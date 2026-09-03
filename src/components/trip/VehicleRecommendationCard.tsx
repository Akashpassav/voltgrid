"use client";

import type { VehicleRecommendation } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Car } from "lucide-react";

export function VehicleRecommendationCard({ rec }: { rec: VehicleRecommendation }) {
  const { comparison } = rec;
  return (
    <div className="rounded-xl border border-info/40 bg-navy-900 p-4">
      <p className="flex items-center gap-2 font-semibold text-info">
        <Car className="h-4 w-4" />
        Consider a four-wheeler for this trip
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Badge tone="blue">{rec.vehicleClass}</Badge>
        <h3 className="text-lg font-semibold">{rec.vehicleName}</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink/90">{rec.reason}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-navy-800 px-2.5 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-mute">
            {comparison.currentVehicleName}
          </dt>
          <dd className="mt-0.5 font-medium">
            {comparison.currentChargingStops} stop{comparison.currentChargingStops === 1 ? "" : "s"}
            {comparison.currentTotalMinutes != null &&
              ` · ${Math.round(comparison.currentTotalMinutes)} min`}
          </dd>
        </div>
        <div className="rounded-lg bg-navy-800 px-2.5 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-mute">{rec.vehicleName}</dt>
          <dd className="mt-0.5 font-medium">
            ~{comparison.recommendedChargingStops} stop
            {comparison.recommendedChargingStops === 1 ? "" : "s"} (estimated)
          </dd>
        </div>
      </div>
    </div>
  );
}
