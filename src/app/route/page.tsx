"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RouteMap } from "@/components/map/RouteMap";
import { ConfidenceMeter } from "@/components/trip/ConfidenceMeter";
import { ChargingStopCard } from "@/components/trip/ChargingStopCard";
import { BatteryExplainer } from "@/components/trip/BatteryExplainer";
import { OvernightStayCard } from "@/components/trip/OvernightStayCard";
import { VehicleRecommendationCard } from "@/components/trip/VehicleRecommendationCard";
import { DemoControls } from "@/components/demo/DemoControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  apiGet,
  apiPost,
  loadResult,
  loadTrip,
  saveResult,
} from "@/lib/client/api";
import type { LiveStation, OptimizeResponse, TripRequest } from "@/lib/types";
import { formatDuration, formatTimeIst } from "@/lib/utils/time";
import { AlertTriangle } from "lucide-react";

export default function RoutePage() {
  const [result, setResult] = useState<OptimizeResponse | null>(null);
  const [stations, setStations] = useState<LiveStation[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [trip, setTrip] = useState<TripRequest | null>(null);
  const reroutedFor = useRef<string | null>(null);

  useEffect(() => {
    setResult(loadResult());
    setTrip(loadTrip());
  }, []);

  const refreshStations = useCallback(async () => {
    try {
      const json = await apiGet<{ stations: LiveStation[] }>("/api/stations");
      setStations(json.stations);
      return json.stations;
    } catch {
      return [] as LiveStation[];
    }
  }, []);

  useEffect(() => {
    void refreshStations();
    const id = setInterval(() => void refreshStations(), 8000);
    return () => clearInterval(id);
  }, [refreshStations]);

  useEffect(() => {
    if (!result?.ok || !trip) return;
    const rec = result.route.chargingStops[0]?.stationId;
    if (!rec) return;
    const live = stations.find((s) => s.id === rec);
    if (!live) return;
    if (live.status === "offline" || live.status === "maintenance") {
      if (reroutedFor.current === rec) return;
      reroutedFor.current = rec;
      void (async () => {
        const reroute = await apiPost<OptimizeResponse>("/api/reroute", {
          trip,
          failedStationId: rec,
        });
        saveResult(reroute);
        setResult(reroute);
        if (reroute.ok) {
          const next = reroute.route.chargingStops[0];
          setNotice(
            `⚠ Charger ${rec} became unavailable. 🔄 Route recalculated. New charging stop: ${next?.stationId ?? "none"}. Additional travel time updated. Route confidence: ${reroute.route.confidence.score}%.`,
          );
        }
      })();
    }
  }, [stations, result, trip]);

  if (!result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-semibold">No route in this session yet.</p>
        <p className="mt-2 text-sm text-mute">Plan a trip to run the optimiser.</p>
        <Link href="/planner" className="mt-4 inline-block text-volt">
          Open planner →
        </Link>
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-xl border border-danger/40 bg-danger/10 p-5">
          <p className="flex items-center gap-2 font-semibold text-danger">
            <AlertTriangle className="h-4 w-4" />
            {result.code}
          </p>
          <p className="mt-2 text-sm">{result.message}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-mute">
            {result.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <Link href="/planner" className="mt-4 inline-block text-sm text-volt">
            Adjust trip →
          </Link>
        </div>
        {result.vehicleRecommendation && (
          <div className="mt-4">
            <VehicleRecommendationCard rec={result.vehicleRecommendation} />
          </div>
        )}
        {result.overnightPlan && (
          <div className="mt-4">
            <OvernightStayCard plan={result.overnightPlan} />
          </div>
        )}
      </div>
    );
  }

  const route = result.route;
  const recIds = result.recommendedStationIds;

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col lg:flex-row">
      <div className="relative h-[48vh] lg:h-[calc(100vh-5.75rem)] lg:flex-1">
        <RouteMap stations={stations} route={route} recommendedIds={recIds} />
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1">
          <Legend color="#3ddc97" label="Available" />
          <Legend color="#f5a524" label="Busy" />
          <Legend color="#f04343" label="Offline" />
          <Legend color="#4c8dff" label="Recommended" />
          <Legend color="#6b7c93" label="Maintenance" />
        </div>
      </div>
      <aside className="max-h-[52vh] space-y-4 overflow-y-auto border-t border-line bg-navy-950 p-4 lg:max-h-none lg:w-[420px] lg:border-l lg:border-t-0">
        {notice && (
          <div className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
            {notice}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="ml-2"
              onClick={() => setNotice(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-mute">Trip summary</p>
          <h1 className="text-2xl font-semibold">
            {route.origin.name} → {route.destination.name}
          </h1>
          <p className="text-xs text-mute">
            {route.vehicle.brand} {route.vehicle.name} · {route.preference}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Distance" value={`${route.distanceKm} km`} />
          <Stat label="ETA" value={formatDuration(route.totalMinutes)} />
          <Stat label="Current battery" value={`${route.startSocPercent}%`} />
          <Stat label="Arrival battery" value={`${route.arrivalSocPercent.toFixed(0)}%`} />
          <Stat label="Charging stops" value={`${route.chargingStops.length}`} />
          <Stat label="Arrive by" value={formatTimeIst(new Date(route.etaIso))} />
        </div>

        <ConfidenceMeter confidence={route.confidence} />

        {route.chargingStops[0] ? (
          <ChargingStopCard stop={route.chargingStops[0]} />
        ) : (
          <div className="rounded-xl border border-volt/30 bg-volt/10 p-4 text-sm">
            No charging stop required — destination is inside the reserved range.
          </div>
        )}

        <BatteryExplainer battery={route.battery} />

        {route.warnings.map((w) => (
          <p key={w} className="text-xs text-warn">
            {w}
          </p>
        ))}

        <p className="text-xs leading-relaxed text-mute">{route.gridHint}</p>

        {result.vehicleRecommendation && (
          <VehicleRecommendationCard rec={result.vehicleRecommendation} />
        )}

        {result.overnightPlan && <OvernightStayCard plan={result.overnightPlan} />}

        <div className="flex flex-wrap gap-1">
          <Badge tone="mute">Stations: static</Badge>
          <Badge tone="amber">Status: simulated</Badge>
          <Badge tone="blue">Prediction: model</Badge>
        </div>

        <DemoControls
          trip={trip}
          recommendedId={recIds[0]}
          onResult={(next, msg) => {
            saveResult(next);
            setResult(next);
            setNotice(msg);
            void refreshStations();
          }}
        />
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-navy-900 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-mute">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="pointer-events-none inline-flex items-center gap-1 rounded-full bg-navy-950/80 px-2 py-0.5 text-[10px] text-ink">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
