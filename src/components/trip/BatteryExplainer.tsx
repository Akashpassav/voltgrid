"use client";

import type { BatteryBreakdown } from "@/lib/types";

export function BatteryExplainer({ battery }: { battery: BatteryBreakdown }) {
  return (
    <div className="rounded-xl border border-line bg-navy-900 p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-mute">Battery & range model</p>
      <p className="mt-2 font-mono text-2xl text-volt">{battery.estimatedRangeKm.toFixed(0)} km</p>
      <p className="text-xs text-mute">
        {battery.chemistry} pack · {battery.occupancyCount} occupant{battery.occupancyCount === 1 ? "" : "s"} · confident range after the safety reserve
      </p>
      <div className="mt-3 overflow-x-auto rounded-lg bg-navy-950 p-3 font-mono text-[11px] leading-relaxed text-mute">
        <div>usable energy = {battery.batteryKWh} kWh × ({battery.socPercent}% − {battery.safetyReservePercent}%) = {battery.usableEnergyKWh} kWh</div>
        <div>occupancy load = ×{battery.occupancyMultiplier.toFixed(3)}; cargo penalty = +{battery.cargoPenaltyWhPerKm} Wh/km</div>
        <div>adjusted Wh/km = {battery.baseConsumptionWhPerKm} × {battery.occupancyMultiplier.toFixed(3)} load × {battery.terrainFactor.toFixed(2)} terrain × {battery.trafficFactor.toFixed(2)} traffic × {battery.weatherFactor.toFixed(2)} weather + {battery.cargoPenaltyWhPerKm} cargo = {battery.adjustedWhPerKm}</div>
        <div>range = {battery.usableEnergyKWh} kWh ÷ {battery.adjustedWhPerKm} Wh/km = {battery.estimatedRangeKm} km</div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink/90">{battery.narrative}</p>
    </div>
  );
}
