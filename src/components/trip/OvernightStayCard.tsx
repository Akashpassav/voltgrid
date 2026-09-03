"use client";

import type { OvernightPlan, OvernightStay } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { BedDouble, PlugZap, MapPin } from "lucide-react";

const KIND_LABEL: Record<OvernightStay["kind"], string> = {
  hotel: "Hotel",
  guest_house: "Guest house",
  motel: "Motel",
};

function StayItem({ stay }: { stay: OvernightStay }) {
  const mapsUrl = `https://www.google.com/maps?q=${stay.latitude},${stay.longitude}`;
  return (
    <div className="rounded-lg bg-navy-800 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{stay.name}</p>
          <p className="text-xs text-mute">{KIND_LABEL[stay.kind]}</p>
        </div>
        {stay.nearestStation && (
          <Badge tone="green">
            <PlugZap className="mr-1 inline h-3 w-3" />
            Near charger
          </Badge>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {stay.distanceFromReachablePointKm.toFixed(1)} km from your reachable point
        </span>
        {stay.nearestStation && (
          <span className="flex items-center gap-1">
            <PlugZap className="h-3 w-3" />
            {stay.nearestStation.name} · {stay.nearestStation.distanceKm.toFixed(1)} km away
          </span>
        )}
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-xs font-medium text-volt hover:underline"
      >
        Open in maps →
      </a>
    </div>
  );
}

export function OvernightStayCard({ plan }: { plan: OvernightPlan }) {
  return (
    <div className="rounded-xl border border-volt/40 bg-navy-900 p-4">
      <p className="flex items-center gap-2 font-semibold text-volt">
        <BedDouble className="h-4 w-4" />
        Stay overnight and continue tomorrow
      </p>
      <p className="mt-1 text-sm text-mute">
        You can safely reach about {plan.reachableDistanceKm.toFixed(0)} km before your
        battery runs low. Here are places to stay near that point — charge overnight and
        continue the trip in the morning.
      </p>
      <div className="mt-3 space-y-2">
        {plan.stays.map((stay) => (
          <StayItem key={stay.id} stay={stay} />
        ))}
      </div>
    </div>
  );
}
