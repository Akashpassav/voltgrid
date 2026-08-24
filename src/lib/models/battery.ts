import type { BatteryBreakdown, Vehicle } from "@/lib/types";

export interface EnergyContext {
  terrainFactor: number;
  trafficFactor: number;
  weatherFactor: number;
  safetyReservePercent?: number;
}

/**
 * Transparent 2W energy model.
 *
 * Estimated Range =
 *   (BatteryCapacity × usable SOC fraction)
 *   ÷ (base Wh/km × terrain × traffic × weather / 1000)
 *
 * Usable SOC keeps a safety reserve so the planner never spends the last 15%.
 */
export function usableEnergyKWh(
  vehicle: Vehicle,
  socPercent: number,
  safetyReservePercent = vehicle.safetyReservePercent,
): number {
  const usable = Math.max(0, socPercent - safetyReservePercent);
  return (vehicle.batteryKWh * usable) / 100;
}

export function adjustedWhPerKm(vehicle: Vehicle, ctx: EnergyContext): number {
  return (
    vehicle.baseConsumptionWhPerKm *
    ctx.terrainFactor *
    ctx.trafficFactor *
    ctx.weatherFactor
  );
}

export function energyForDistanceKWh(
  vehicle: Vehicle,
  distanceKm: number,
  ctx: EnergyContext,
): number {
  return (distanceKm * adjustedWhPerKm(vehicle, ctx)) / 1000;
}

export function socAfterEnergy(
  vehicle: Vehicle,
  socPercent: number,
  energyKWh: number,
): number {
  const drop = (energyKWh / vehicle.batteryKWh) * 100;
  return Math.max(0, socPercent - drop);
}

export function estimatedRangeKm(
  vehicle: Vehicle,
  socPercent: number,
  ctx: EnergyContext,
): number {
  const energy = usableEnergyKWh(vehicle, socPercent, ctx.safetyReservePercent);
  const kWhPerKm = adjustedWhPerKm(vehicle, ctx) / 1000;
  if (kWhPerKm <= 0) return 0;
  return energy / kWhPerKm;
}

export function chargeTimeMinutes(
  vehicle: Vehicle,
  fromSoc: number,
  toSoc: number,
  chargerKW: number,
): number {
  if (toSoc <= fromSoc) return 0;
  const energy = (vehicle.batteryKWh * (toSoc - fromSoc)) / 100;
  const usableKW = Math.min(chargerKW, vehicle.maxChargeKW) * vehicle.chargeEfficiency;
  if (usableKW <= 0) return 999;
  return (energy / usableKW) * 60;
}

export function describeBattery(
  vehicle: Vehicle,
  socPercent: number,
  ctx: EnergyContext,
): BatteryBreakdown {
  const reserve = ctx.safetyReservePercent ?? vehicle.safetyReservePercent;
  const usable = usableEnergyKWh(vehicle, socPercent, reserve);
  const wh = adjustedWhPerKm(vehicle, ctx);
  const range = estimatedRangeKm(vehicle, socPercent, ctx);
  const narrative =
    `Your ${vehicle.name} has a ${vehicle.batteryKWh.toFixed(2)} kWh pack at ${socPercent}% ` +
    `(${((vehicle.batteryKWh * socPercent) / 100).toFixed(2)} kWh on board). ` +
    `We hold back a ${reserve}% safety reserve, leaving ${usable.toFixed(2)} kWh usable. ` +
    `Base consumption is ${vehicle.baseConsumptionWhPerKm} Wh/km, adjusted to ${wh.toFixed(0)} Wh/km ` +
    `after terrain ×${ctx.terrainFactor.toFixed(2)}, traffic ×${ctx.trafficFactor.toFixed(2)} ` +
    `and weather ×${ctx.weatherFactor.toFixed(2)}. ` +
    `That yields about ${range.toFixed(0)} km of confident range before the reserve.`;

  return {
    batteryKWh: vehicle.batteryKWh,
    socPercent,
    safetyReservePercent: reserve,
    usableEnergyKWh: Number(usable.toFixed(3)),
    baseConsumptionWhPerKm: vehicle.baseConsumptionWhPerKm,
    terrainFactor: ctx.terrainFactor,
    trafficFactor: ctx.trafficFactor,
    weatherFactor: ctx.weatherFactor,
    adjustedWhPerKm: Number(wh.toFixed(1)),
    estimatedRangeKm: Number(range.toFixed(1)),
    narrative,
  };
}
