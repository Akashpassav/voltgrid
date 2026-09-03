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
import { AlertTriangle, Bike, Car, ShieldCheck, Zap, ArrowLeft, RefreshCw } from "lucide-react";

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
            `⚠ Charger ${rec} became unavailable. 🔄 Autonomous re-routing activated. New charging point: ${next?.stationName ?? "None (direct reached)"}. Route confidence: ${reroute.route.confidence.score}%.`,
          );
        }
      })();
    }
  }, [stations, result, trip]);

  if (!result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-semibold text-ink">No active route session found.</p>
        <p className="mt-2 text-sm text-mute">Configure an origin, destination, and vehicle to run the optimization engine.</p>
        <Link
          href="/planner"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-volt px-4 py-2 text-sm font-semibold text-navy-950 hover:brightness-110"
        >
          <ArrowLeft className="h-4 w-4" />
          Open Route Planner
        </Link>
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-xl border border-danger/40 bg-danger/10 p-5 shadow-xl">
          <p className="flex items-center gap-2 font-semibold text-danger">
            <AlertTriangle className="h-5 w-5" />
            Routing Feasibility Notice ({result.code})
          </p>
          <p className="mt-2 text-sm text-ink leading-relaxed">{result.message}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-mute">
            {result.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <Link
            href="/planner"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-volt hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Adjust trip parameters or select another EV
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
  const is4W = route.vehicle.class === "4W";

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col lg:flex-row">
      {/* ── INTERACTIVE ROAD MAP ── */}
      <div className="relative h-[48vh] lg:h-[calc(100vh-5.75rem)] lg:flex-1">
        <RouteMap stations={stations} route={route} recommendedIds={recIds} />
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1 shadow-md">
          <Legend color="#3ddc97" label="Available CPO" />
          <Legend color="#f5a524" label="High Queue" />
          <Legend color="#f04343" label="Outage / Offline" />
          <Legend color="#4c8dff" label="Planned Stop" />
          <Legend color="#6b7c93" label="Maintenance" />
        </div>
      </div>

      {/* ── ROUTE DETAILS & SIDEBAR ── */}
      <aside className="max-h-[52vh] space-y-4 overflow-y-auto border-t border-line bg-navy-950/95 p-4 lg:max-h-none lg:w-[440px] lg:border-l lg:border-t-0 shadow-2xl">
        {notice && (
          <div className="rounded-xl border border-warn/40 bg-warn/10 p-3 text-xs text-warn flex items-start justify-between gap-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 shrink-0 mt-0.5 animate-spin text-warn" />
              <span>{notice}</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-xs h-6 px-2 text-mute hover:text-ink"
              onClick={() => setNotice(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.16em] text-volt font-semibold">EV Navigation Plan</p>
            <span className="flex items-center gap-1 rounded-full bg-navy-800 px-2 py-0.5 text-[10px] font-medium text-ink border border-line">
              {is4W ? <Car className="h-3 w-3 text-electric" /> : <Bike className="h-3 w-3 text-volt" />}
              {is4W ? "Passenger EV (4W)" : "Light EV (2W)"}
            </span>
          </div>

          <h1 className="mt-1 text-2xl font-bold text-ink">
            {route.origin.name} → {route.destination.name}
          </h1>
          <p className="text-xs text-mute mt-0.5">
            {route.vehicle.brand} {route.vehicle.name} · Preference: <strong className="text-ink capitalize font-medium">{route.preference}</strong>
          </p>
        </div>

        {/* Core Trip Performance Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          <Stat label="Total Distance" value={`${route.distanceKm} km`} />
          <Stat label="Estimated ETA" value={formatDuration(route.totalMinutes)} />
          <Stat label="Starting SoC" value={`${route.startSocPercent}%`} />
          <Stat label="Arrival SoC" value={`${route.arrivalSocPercent.toFixed(0)}%`} highlight />
          <Stat label="Charging Stops" value={`${route.chargingStops.length} stop${route.chargingStops.length === 1 ? "" : "s"}`} />
          <Stat label="Arrival Time" value={formatTimeIst(new Date(route.etaIso))} />
        </div>

        {/* Route Confidence Meter */}
        <ConfidenceMeter confidence={route.confidence} />

        {/* Planned Charging Stops List (Supports Single or Multi-Stop) */}
        {route.chargingStops.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.14em] text-mute flex items-center gap-1.5 font-semibold">
              <Zap className="h-3.5 w-3.5 text-volt" />
              Planned Charging Infrastructure ({route.chargingStops.length})
            </p>
            {route.chargingStops.map((stop, idx) => (
              <ChargingStopCard
                key={`${stop.stationId}-${idx}`}
                stop={stop}
                stopNumber={idx + 1}
                totalStops={route.chargingStops.length}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-volt/40 bg-volt/10 p-4 text-xs shadow-md">
            <div className="flex items-center gap-2 font-semibold text-volt text-sm">
              <ShieldCheck className="h-4 w-4" />
              Direct Route Feasible — 0 Charging Stops Required
            </div>
            <p className="mt-1.5 leading-relaxed text-ink/80">
              Your predicted arrival battery level ({route.arrivalSocPercent.toFixed(0)}% SoC) satisfies the requested safety reserve. No charging stops are needed.
            </p>
          </div>
        )}

        {/* Alternative Paths */}
        {route.routeAlternatives && route.routeAlternatives.length > 0 && (
          <div className="rounded-xl border border-line bg-navy-900/80 p-3.5 text-xs shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.16em] text-mute font-semibold">Alternative Corridor Options</p>
            <ul className="mt-2 space-y-2">
              {route.routeAlternatives.map((alt) => (
                <li key={`${alt.label}-${alt.distanceKm}`} className="rounded-lg bg-navy-800/90 p-2.5 border border-line/40">
                  <p className="font-semibold text-ink">{alt.label}</p>
                  <p className="text-[11px] text-mute mt-0.5">
                    {alt.distanceKm} km · {alt.drivingMinutes} min · {alt.energyKWh} kWh · Est. Arrival: {alt.arrivalSocPercent}% SoC
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Battery & Range First-Principles Explainer */}
        <BatteryExplainer battery={route.battery} />

        {/* Warnings */}
        {route.warnings.map((w) => (
          <p key={w} className="text-xs text-warn rounded-lg bg-warn/10 border border-warn/30 p-2.5">
            {w}
          </p>
        ))}

        {/* Grid & Infrastructure Status */}
        <p className="text-[11px] leading-relaxed text-mute/90 italic border-l-2 border-line pl-2.5">
          {route.gridHint}
        </p>

        {result.vehicleRecommendation && (
          <VehicleRecommendationCard rec={result.vehicleRecommendation} />
        )}

        {result.overnightPlan && <OvernightStayCard plan={result.overnightPlan} />}

        {/* Operator / Evaluator Sandbox (Collapsible) */}
        <DemoControls
          trip={trip}
          recommendedId={recIds[0]}
          defaultOpen={false}
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

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-navy-900/80 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-mute">{label}</p>
      <p className={`mt-0.5 font-semibold text-sm ${highlight ? "text-volt font-mono" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="pointer-events-none inline-flex items-center gap-1.5 rounded-full bg-navy-950/90 px-2.5 py-1 text-[10px] text-ink border border-line/60">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}