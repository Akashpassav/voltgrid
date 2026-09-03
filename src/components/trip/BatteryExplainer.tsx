"use client";

import type { BatteryBreakdown } from "@/lib/types";
import { InfoTooltip } from "@/components/ui/tooltip";
import { Battery, Zap, Activity } from "lucide-react";

export function BatteryExplainer({ battery }: { battery: BatteryBreakdown }) {
  const is2W = battery.baseConsumptionWhPerKm < 60; // 2W base consumption typically 30-45 Wh/km

  return (
    <div className="rounded-xl border border-line bg-navy-900/90 p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3 border-b border-line/60 pb-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-mute">
            <Battery className="h-3.5 w-3.5 text-volt" />
            Energy Consumption & Range Physics
            <InfoTooltip
              title="First-Principles Range Modeling"
              content="VoltGrid computes true point-to-point range by taking usable pack energy and dividing by speed-, elevation-, traffic-, weather-, and payload-adjusted consumption."
            />
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-volt">
              {battery.estimatedRangeKm.toFixed(0)} km
            </span>
            <span className="text-xs text-mute font-medium">calculated usable range</span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-md border border-line bg-navy-800 px-2 py-1 text-xs text-ink">
          <Zap className="h-3 w-3 text-electric" />
          {battery.chemistry} Cell Pack
        </span>
      </div>

      {/* Physics Breakdown Metrics */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-navy-950 p-2 border border-line/40">
          <p className="text-mute text-[10px] uppercase tracking-wider flex items-center">
            Usable Energy
            <InfoTooltip
              title="Usable Energy (kWh)"
              content={`Calculated as Total (${battery.batteryKWh} kWh) × (${battery.socPercent}% SoC − ${battery.safetyReservePercent}% Reserve) = ${battery.usableEnergyKWh} kWh.`}
            />
          </p>
          <p className="mt-0.5 font-mono font-semibold text-ink">{battery.usableEnergyKWh} kWh</p>
        </div>

        <div className="rounded-lg bg-navy-950 p-2 border border-line/40">
          <p className="text-mute text-[10px] uppercase tracking-wider flex items-center">
            Base Demand
            <InfoTooltip
              title="Nominal Consumption"
              content="Manufacturer calibrated testing consumption under flat elevation, standard ambient temperature, and solo driver/rider."
            />
          </p>
          <p className="mt-0.5 font-mono font-semibold text-ink">{battery.baseConsumptionWhPerKm} Wh/km</p>
        </div>

        <div className="rounded-lg bg-navy-950 p-2 border border-line/40">
          <p className="text-mute text-[10px] uppercase tracking-wider flex items-center">
            Adjusted Demand
            <InfoTooltip
              title="Adjusted Real-World Demand"
              content={`Dynamic energy drain rate after factoring in payload (×${battery.occupancyMultiplier.toFixed(2)}), road gradient (${battery.terrainFactor.toFixed(2)}), and speed/traffic (${battery.trafficFactor.toFixed(2)}).`}
            />
          </p>
          <p className="mt-0.5 font-mono font-semibold text-volt">{battery.adjustedWhPerKm} Wh/km</p>
        </div>

        <div className="rounded-lg bg-navy-950 p-2 border border-line/40">
          <p className="text-mute text-[10px] uppercase tracking-wider flex items-center">
            {is2W ? "Riders" : "Occupants"}
            <InfoTooltip
              title="Vehicle Payload Load"
              content={
                is2W
                  ? `Configured with ${battery.occupancyCount} rider(s). Aerodynamic and mass multiplier is ×${battery.occupancyMultiplier.toFixed(2)}.`
                  : `Configured with ${battery.occupancyCount} occupant(s) + cargo. Total payload consumption penalty is +${battery.cargoPenaltyWhPerKm} Wh/km.`
              }
            />
          </p>
          <p className="mt-0.5 font-mono font-semibold text-ink">
            {battery.occupancyCount} {is2W ? "rider(s)" : "occupant(s)"}
          </p>
        </div>
      </div>

      {/* Physics Formula Terminal */}
      <div className="mt-3 overflow-x-auto rounded-lg border border-line/60 bg-navy-950 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
        <p className="text-[10px] text-mute uppercase tracking-widest mb-1.5 flex items-center gap-1">
          <Activity className="h-3 w-3 text-electric" />
          Deterministic Range Equation:
        </p>
        <div className="text-slate-400">
          usable_energy = {battery.batteryKWh} kWh × ({battery.socPercent}% SoC − {battery.safetyReservePercent}% reserve) = <span className="text-ink font-semibold">{battery.usableEnergyKWh} kWh</span>
        </div>
        <div className="text-slate-400 mt-1">
          adjusted_rate = {battery.baseConsumptionWhPerKm} Wh/km × {battery.occupancyMultiplier.toFixed(2)} (load) × {battery.terrainFactor.toFixed(2)} (gradient) × {battery.trafficFactor.toFixed(2)} (traffic) {battery.cargoPenaltyWhPerKm > 0 ? `+ ${battery.cargoPenaltyWhPerKm} Wh/km (cargo)` : ""} = <span className="text-volt font-semibold">{battery.adjustedWhPerKm} Wh/km</span>
        </div>
        <div className="text-emerald-400 mt-1 font-semibold">
          estimated_range = ({battery.usableEnergyKWh} kWh × 1000) ÷ {battery.adjustedWhPerKm} Wh/km = {battery.estimatedRangeKm.toFixed(1)} km
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-300 border-l-2 border-volt/60 pl-2.5">
        {battery.narrative}
      </p>
    </div>
  );
}