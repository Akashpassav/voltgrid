"use client";

import type { ChargingStopPlan } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { PlugZap, Clock, IndianRupee, Route } from "lucide-react";
import Link from "next/link";

export function ChargingStopCard({ stop }: { stop: ChargingStopPlan }) {
  return (
    <div className="rounded-xl border border-info/40 bg-navy-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone="blue">Recommended stop</Badge>
          <h3 className="mt-2 text-lg font-semibold">{stop.stationName}</h3>
          <p className="text-xs text-mute">
            {stop.stationId} · {stop.operator}
          </p>
        </div>
        <p className="font-mono text-2xl font-semibold text-volt">
          {Math.round(stop.predictedAvailability * 100)}%
        </p>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <Item icon={<Route className="h-3.5 w-3.5" />} label="Detour" value={`${stop.detourKm.toFixed(1)} km · ${stop.detourMinutes.toFixed(0)} min`} />
        <Item icon={<Clock className="h-3.5 w-3.5" />} label="Charge + queue" value={`${stop.chargeMinutes + stop.queueMinutes} min`} />
        <Item icon={<PlugZap className="h-3.5 w-3.5" />} label="Connector" value={`${stop.connectorType} · ${stop.powerKW} kW`} />
        <Item icon={<IndianRupee className="h-3.5 w-3.5" />} label="Energy cost" value={`₹${stop.costInr}`} />
      </dl>
      <p className="mt-3 text-sm leading-relaxed text-ink/90">{stop.whySelected}</p>
      <p className="mt-2 text-xs text-mute">
        Arrive {stop.arriveSocPercent.toFixed(0)}% → depart {stop.departSocPercent.toFixed(0)}% · score {stop.score}
      </p>
      <Link
        href={`/stations/${stop.stationId}`}
        className="mt-3 inline-block text-sm font-medium text-volt hover:underline"
      >
        Open charger intelligence →
      </Link>
    </div>
  );
}

function Item({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-navy-800 px-2.5 py-2">
      <dt className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-mute">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
