import type { BatteryBreakdown, Vehicle } from "@/lib/types";
import { CARGO_PENALTY_WH_PER_100KG } from "@/lib/data/vehicles";

export interface EnergyContext {
  terrainFactor: number;
  trafficFactor: number;
  weatherFactor: number;
  safetyReservePercent?: number;
  occupancyCount?: number;
  cargoLoadKg?: number;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function occupancyMultiplier(vehicle: Vehicle, occupancyCount = 1): number {
  const maxOccupants = vehicle.class === "2W" ? 2 : 5;
  const occupants = Math.round(clamp(occupancyCount, 1, maxOccupants));
  const curve = vehicle.batteryProfile.occupancyConsumptionCurve;
  if (curve.length === 0) return 1;
  const exact = curve.find((p) => p.occupants === occupants);
  if (exact) return exact.consumptionMultiplier;
  const sorted = [...curve].sort((a, b) => a.occupants - b.occupants);
  if (occupants <= sorted[0].occupants) return sorted[0].consumptionMultiplier;
  if (occupants >= sorted.at(-1)!.occupants) return sorted.at(-1)!.consumptionMultiplier;
  for (let i = 1; i < sorted.length; i += 1) {
    const a = sorted[i - 1];
    const b = sorted[i];
    if (occupants <= b.occupants) {
      const t = (occupants - a.occupants) / (b.occupants - a.occupants);
      return a.consumptionMultiplier + (b.consumptionMultiplier - a.consumptionMultiplier) * t;
    }
  }
  return 1;
}

export function cargoPenaltyWhPerKm(cargoLoadKg = 0): number {
  return Math.max(0, cargoLoadKg) * (CARGO_PENALTY_WH_PER_100KG / 100);
}

export function usableEnergyKWh(vehicle: Vehicle, socPercent: number, safetyReservePercent = vehicle.safetyReservePercent): number {
  const usable = Math.max(0, socPercent - safetyReservePercent);
  return (vehicle.batteryKWh * usable) / 100;
}

export function adjustedWhPerKm(vehicle: Vehicle, ctx: EnergyContext): number {
  const occupancy = occupancyMultiplier(vehicle, ctx.occupancyCount ?? 1);
  const cargoPenalty = vehicle.class === "4W" ? cargoPenaltyWhPerKm(ctx.cargoLoadKg ?? 0) : 0;
  return vehicle.batteryProfile.nominalWhPerKm * occupancy * ctx.terrainFactor * ctx.trafficFactor * ctx.weatherFactor + cargoPenalty;
}

export function energyForDistanceKWh(vehicle: Vehicle, distanceKm: number, ctx: EnergyContext): number {
  return (distanceKm * adjustedWhPerKm(vehicle, ctx)) / 1000;
}

export function socAfterEnergy(vehicle: Vehicle, socPercent: number, energyKWh: number): number {
  const drop = (energyKWh / vehicle.batteryKWh) * 100;
  return Math.max(0, socPercent - drop);
}

export function estimatedRangeKm(vehicle: Vehicle, socPercent: number, ctx: EnergyContext): number {
  const energy = usableEnergyKWh(vehicle, socPercent, ctx.safetyReservePercent);
  const kWhPerKm = adjustedWhPerKm(vehicle, ctx) / 1000;
  if (kWhPerKm <= 0) return 0;
  return energy / kWhPerKm;
}

export function chargeTimeMinutes(vehicle: Vehicle, fromSoc: number, toSoc: number, chargerKW: number): number {
  if (toSoc <= fromSoc) return 0;
  const energy = (vehicle.batteryKWh * (toSoc - fromSoc)) / 100;
  const usableKW = Math.min(chargerKW, vehicle.maxChargeKW) * vehicle.chargeEfficiency;
  if (usableKW <= 0) return 999;
  return (energy / usableKW) * 60;
}

export function desiredChargePercent(vehicle: Vehicle): number {
  return clamp(vehicle.batteryProfile.desiredChargePercent, vehicle.batteryProfile.safeMinSocPercent + 5, vehicle.batteryProfile.safeMaxSocPercent);
}

export function describeBattery(vehicle: Vehicle, socPercent: number, ctx: EnergyContext): BatteryBreakdown {
  const reserve = ctx.safetyReservePercent ?? vehicle.safetyReservePercent;
  const occupancyCount = Math.round(clamp(ctx.occupancyCount ?? 1, 1, vehicle.class === "2W" ? 2 : 5));
  const occupancy = occupancyMultiplier(vehicle, occupancyCount);
  const cargoLoadKg = Math.max(0, ctx.cargoLoadKg ?? 0);
  const cargoPenalty = vehicle.class === "4W" ? cargoPenaltyWhPerKm(cargoLoadKg) : 0;
  const usable = usableEnergyKWh(vehicle, socPercent, reserve);
  const wh = adjustedWhPerKm(vehicle, ctx);
  const range = estimatedRangeKm(vehicle, socPercent, ctx);
  const narrative =
    `Your ${vehicle.name} uses a ${vehicle.batteryProfile.chemistry} ${vehicle.batteryKWh.toFixed(2)} kWh pack. ` +
    `At ${socPercent}% SOC, we hold back ${reserve}% and leave ${usable.toFixed(2)} kWh usable. ` +
    `Base consumption is ${vehicle.batteryProfile.nominalWhPerKm} Wh/km; ${occupancyCount} occupant${occupancyCount === 1 ? "" : "s"} applies ×${occupancy.toFixed(2)} load, ` +
    `then terrain ×${ctx.terrainFactor.toFixed(2)}, traffic ×${ctx.trafficFactor.toFixed(2)} and weather ×${ctx.weatherFactor.toFixed(2)}. ` +
    (cargoPenalty > 0 ? `Cargo adds ${cargoPenalty.toFixed(1)} Wh/km. ` : "") +
    `That yields about ${range.toFixed(0)} km of confident range before the reserve.`;

  return {
    batteryKWh: vehicle.batteryKWh,
    socPercent,
    safetyReservePercent: reserve,
    chemistry: vehicle.batteryProfile.chemistry,
    safeMinSocPercent: vehicle.batteryProfile.safeMinSocPercent,
    safeMaxSocPercent: vehicle.batteryProfile.safeMaxSocPercent,
    desiredChargePercent: desiredChargePercent(vehicle),
    occupancyCount,
    occupancyMultiplier: Number(occupancy.toFixed(3)),
    cargoLoadKg: Number(cargoLoadKg.toFixed(1)),
    cargoPenaltyWhPerKm: Number(cargoPenalty.toFixed(2)),
    usableEnergyKWh: Number(usable.toFixed(3)),
    baseConsumptionWhPerKm: vehicle.batteryProfile.nominalWhPerKm,
    terrainFactor: ctx.terrainFactor,
    trafficFactor: ctx.trafficFactor,
    weatherFactor: ctx.weatherFactor,
    adjustedWhPerKm: Number(wh.toFixed(1)),
    estimatedRangeKm: Number(range.toFixed(1)),
    narrative,
  };
}
