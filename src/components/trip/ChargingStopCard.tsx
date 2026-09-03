"use client";

import type { ChargingStopPlan } from "@/lib/types";
import { PlugZap, Clock, IndianRupee, Route, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { InfoTooltip } from "@/components/ui/tooltip";

export function ChargingStopCard({
  stop,
  stopNumber = 1,
  totalStops = 1,
}: {
  stop: ChargingStopPlan;
  stopNumber?: number;
  totalStops?: number;
}) {
  const isDC = stop.powerKW >= 25;

  return (
    <div className="rounded-xl border border-info/40 bg-navy-900/90 p-4 shadow-lg backdrop-blur-sm transition-all hover:border-info/60">
      <div className="flex items-start justify-between gap-3 border-b border-line/60 pb-3">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-info/10 border border-info/30 px-2 py-0.5 text-[11px] font-semibold text-info">
              <Zap className="h-3 w-3 text-info" />
              {totalStops > 1 ? `Charging Stop ${stopNumber} of ${totalStops}` : "Recommended Charging Stop"}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
              isDC
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}>
              {isDC ? "DC Fast Charging" : "Standard AC Charging"}
            </span>
          </div>

          <h3 className="mt-2 text-base font-semibold text-ink sm:text-lg">{stop.stationName}</h3>
          <p className="text-xs text-mute mt-0.5">
            Operator: <strong className="text-ink font-medium">{stop.operator}</strong> · ID: {stop.stationId}
          </p>
        </div>

        <div className="text-right">
          <p className="flex items-center justify-end text-[10px] uppercase tracking-wider text-mute">
            Live Uptime
            <InfoTooltip
              title="Predicted Availability Score"
              content="Machine-learning availability score based on historical CPO uptime, queue duration, and arrival-time probability."
            />
          </p>
          <p className="font-mono text-2xl font-bold text-volt">
            {Math.round(stop.predictedAvailability * 100)}%
          </p>
        </div>
      </div>

      {/* Charging Session Parameters */}
      <div className="mt-3 rounded-lg bg-navy-950/80 p-2.5 border border-line/50">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-mute flex items-center gap-1">
            Battery Recharge Delta:
          </span>
          <span className="font-mono font-medium text-ink flex items-center gap-1">
            <span className="text-warn">{stop.arriveSocPercent.toFixed(0)}% SoC</span>
            <ArrowRight className="h-3 w-3 text-mute" />
            <span className="text-volt">{stop.departSocPercent.toFixed(0)}% SoC</span>
            <span className="text-mute text-[11px]">(+{stop.energyAddedKWh} kWh)</span>
          </span>
        </div>
        {/* Visual SoC Bar */}
        <div className="h-2 w-full rounded-full bg-navy-800 overflow-hidden relative">
          <div
            className="h-full bg-warn/80"
            style={{ width: `${Math.min(100, stop.arriveSocPercent)}%` }}
          />
          <div
            className="h-full bg-volt absolute top-0"
            style={{
              left: `${Math.min(100, stop.arriveSocPercent)}%`,
              width: `${Math.min(100, Math.max(0, stop.departSocPercent - stop.arriveSocPercent))}%`,
            }}
          />
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Item
          icon={<Route className="h-3.5 w-3.5 text-electric" />}
          label="Corridor Detour"
          value={`${stop.detourKm.toFixed(1)} km`}
          subtext={`+${stop.detourMinutes.toFixed(0)} min drive`}
        />
        <Item
          icon={<Clock className="h-3.5 w-3.5 text-volt" />}
          label="Charge Time"
          value={`${stop.chargeMinutes} min`}
          subtext={stop.queueMinutes > 0 ? `+${stop.queueMinutes} min queue` : "0 min queue"}
        />
        <Item
          icon={<PlugZap className="h-3.5 w-3.5 text-amber-400" />}
          label="Connector & Power"
          value={`${stop.powerKW} kW`}
          subtext={stop.connectorType}
        />
        <Item
          icon={<IndianRupee className="h-3.5 w-3.5 text-emerald-400" />}
          label="Estimated Cost"
          value={`₹${stop.costInr}`}
          subtext={`Energy: ${stop.energyAddedKWh} kWh`}
        />
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-slate-300 border-l-2 border-info/50 pl-2.5">
        {stop.whySelected}
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-line/40 pt-2.5">
        <span className="text-[11px] text-mute flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-volt" />
          Multi-factor Score: <strong className="text-ink font-semibold">{stop.score}/100</strong>
        </span>
        <Link
          href={`/stations/${stop.stationId}`}
          className="text-xs font-semibold text-volt hover:text-emerald-300 transition-colors"
        >
          View Charger Analytics →
        </Link>
      </div>
    </div>
  );
}

function Item({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-lg bg-navy-800/80 p-2 border border-line/30">
      <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-mute">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold text-ink">{value}</dd>
      {subtext && <p className="text-[10px] text-mute leading-tight">{subtext}</p>}
    </div>
  );
}