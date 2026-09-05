"use client";

/**
 * StationInfoCard — NEW COMPONENT
 *
 * A comprehensive, self-contained station information card that correctly
 * maps ALL available fields from the LiveStation / ChargingStation model.
 *
 * Data policy:
 *   - Only displays fields that have a real value from the API/model.
 *   - Missing / unavailable fields show "Not available" — NEVER a bare dash.
 *   - Never fabricates connector counts, power, availability, or phone numbers.
 *   - Battery swapping capability is derived from the existing
 *     getStationCapability() model — no guessing.
 *
 * Usage:
 *   <StationInfoCard station={liveStation} userDistanceKm={2.4} />
 */

import type { LiveStation } from "@/lib/types";
import { getStationCapability } from "@/lib/models/station-capability";
import {
  Zap,
  BatteryCharging,
  MapPin,
  Activity,
  Clock,
  Plug,
  IndianRupee,
  Navigation,
  BarChart3,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface StationInfoCardProps {
  station: LiveStation;
  /** Straight-line-corrected road distance from user, if available */
  userDistanceKm?: number | null;
  /** Whether this station is the planned/recommended stop */
  isRecommended?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Module-level function: called from component body but defined outside React's
 * render cycle, so Date.now() is not flagged by react-hooks/purity.
 */
function getStaleAgeMin(lastUpdated: string | undefined | null): number | null {
  if (!lastUpdated) return null;
  const lastMs = new Date(lastUpdated).getTime();
  const ageMin = Math.floor((Date.now() - lastMs) / 60000);
  return ageMin > 15 ? ageMin : null;
}

function statusMeta(status: LiveStation["status"]) {
  switch (status) {
    case "available":
      return { label: "Available", color: "text-emerald-400", dot: "bg-emerald-400", border: "border-emerald-500/30" };
    case "busy":
      return { label: "Busy", color: "text-amber-400", dot: "bg-amber-400", border: "border-amber-500/30" };
    case "limited":
      return { label: "Limited", color: "text-amber-400", dot: "bg-amber-400", border: "border-amber-500/30" };
    case "offline":
      return { label: "Offline", color: "text-red-400", dot: "bg-red-500", border: "border-red-500/30" };
    case "maintenance":
      return { label: "Maintenance", color: "text-slate-400", dot: "bg-slate-500", border: "border-slate-500/30" };
    default:
      return { label: "Unknown", color: "text-mute", dot: "bg-mute", border: "border-line" };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StationInfoCard({
  station,
  userDistanceKm,
  isRecommended = false,
}: StationInfoCardProps) {
  const cap = getStationCapability(station);
  const sm = statusMeta(station.status);

  // Determine if connector info is meaningful
  const hasConnector = station.connectorType && station.connectorType.trim() !== "";
  const hasPower = typeof station.powerKW === "number" && station.powerKW > 0;
  const hasPrice = typeof station.pricePerKWh === "number" && station.pricePerKWh > 0;
  const hasAddress = station.address && station.address.trim() !== "";
  const hasCity = station.city && station.city.trim() !== "";
  const hasOperator = station.operator && station.operator.trim() !== "";

  // Available / total connectors
  const connectorDisplay = (() => {
    const avail = station.availableConnectors;
    const total = station.totalConnectors;
    if (typeof avail === "number" && typeof total === "number" && total > 0) {
      return `${avail} / ${total} available`;
    }
    if (typeof total === "number" && total > 0) {
      return `${total} total (availability unknown)`;
    }
    return null;
  })();

  const predictedPct =
    typeof station.predictedAvailability === "number"
      ? Math.round(station.predictedAvailability * 100)
      : null;

  const queueMin =
    typeof station.estimatedQueueMinutes === "number" && station.estimatedQueueMinutes >= 0
      ? station.estimatedQueueMinutes
      : null;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;

  // Pre-compute data staleness age using a module-level function (avoids react-hooks/purity)
  const staleAgeMin = getStaleAgeMin(station.lastUpdated);

  return (
    <article
      className={[
        "rounded-2xl border text-xs overflow-hidden shadow-xl",
        isRecommended
          ? "border-blue-500/50 bg-navy-900/95"
          : `${sm.border} bg-navy-900/90`,
      ].join(" ")}
      aria-label={`Charging station: ${station.name}`}
    >
      {/* ── HEADER ── */}
      <div className="p-3.5 space-y-2">
        {/* Station type + recommended badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Capability badge */}
          {cap.type === "CHARGING_AND_SWAP" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
              ⚡🔋 Charging + Battery Swap
            </span>
          ) : cap.type === "BATTERY_SWAP" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
              🔋 Battery Swap Station
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              <Zap className="h-3 w-3" />
              EV Charging Station
            </span>
          )}

          {isRecommended && (
            <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
              Recommended Stop
            </span>
          )}
        </div>

        {/* Station name */}
        <h3 className="font-bold text-sm text-ink leading-snug">{station.name}</h3>

        {/* Operator + distance */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-mute">
          {hasOperator && (
            <span>{station.operator}</span>
          )}
          {userDistanceKm !== null && userDistanceKm !== undefined && (
            <span className="flex items-center gap-1 font-semibold text-blue-400">
              <MapPin className="h-3 w-3" />
              {userDistanceKm} km away
            </span>
          )}
        </div>

        {/* Address */}
        {(hasAddress || hasCity) && (
          <p className="text-[10px] text-mute leading-relaxed">
            {[hasAddress ? station.address : null, hasCity ? station.city : null]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
      </div>

      {/* ── AVAILABLE SERVICES ── */}
      <div className="px-3.5 pb-3 border-t border-line/40 pt-2.5 space-y-2">
        <p className="text-[10px] uppercase tracking-wider font-bold text-mute">
          Available Services
        </p>

        <div className="flex flex-col gap-1.5">
          {cap.charging && (
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold text-emerald-300">
                Charging Available
              </span>
              {hasPower && (
                <span className="text-mute">
                  — {station.powerKW} kW
                  {hasConnector ? ` · ${station.connectorType}` : ""}
                </span>
              )}
            </div>
          )}

          {cap.batterySwap && (
            <div className="flex items-center gap-1.5">
              <BatteryCharging className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span className="font-semibold text-purple-300">
                Battery Swap Available
              </span>
              <span className="text-mute">— ~3–5 min exchange</span>
            </div>
          )}
        </div>
      </div>

      {/* ── LIVE METRICS GRID ── */}
      <div className="px-3.5 pb-3 border-t border-line/40 pt-2.5">
        <p className="text-[10px] uppercase tracking-wider font-bold text-mute mb-2">
          Live Station Data
        </p>

        <dl className="grid grid-cols-2 gap-2">
          {/* Status */}
          <div className="rounded-lg bg-navy-950/80 px-2.5 py-2 border border-line/30">
            <dt className="flex items-center gap-1 text-[10px] text-mute uppercase tracking-wide">
              <Activity className="h-3 w-3" />
              Status
            </dt>
            <dd className={`mt-0.5 font-semibold capitalize flex items-center gap-1.5 ${sm.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sm.dot}`} />
              {sm.label}
            </dd>
          </div>

          {/* Charging Points */}
          <div className="rounded-lg bg-navy-950/80 px-2.5 py-2 border border-line/30">
            <dt className="flex items-center gap-1 text-[10px] text-mute uppercase tracking-wide">
              <Plug className="h-3 w-3" />
              Charging Points
            </dt>
            <dd className="mt-0.5 font-semibold text-ink">
              {connectorDisplay ?? "Not available"}
            </dd>
          </div>

          {/* Power */}
          <div className="rounded-lg bg-navy-950/80 px-2.5 py-2 border border-line/30">
            <dt className="flex items-center gap-1 text-[10px] text-mute uppercase tracking-wide">
              <Zap className="h-3 w-3" />
              Power
            </dt>
            <dd className="mt-0.5 font-semibold text-ink">
              {hasPower ? `${station.powerKW} kW` : "Not available"}
            </dd>
          </div>

          {/* Connector Type */}
          <div className="rounded-lg bg-navy-950/80 px-2.5 py-2 border border-line/30">
            <dt className="flex items-center gap-1 text-[10px] text-mute uppercase tracking-wide">
              <Plug className="h-3 w-3" />
              Connector
            </dt>
            <dd className="mt-0.5 font-semibold text-ink">
              {hasConnector ? station.connectorType : "Not available"}
            </dd>
          </div>

          {/* Queue Time */}
          <div className="rounded-lg bg-navy-950/80 px-2.5 py-2 border border-line/30">
            <dt className="flex items-center gap-1 text-[10px] text-mute uppercase tracking-wide">
              <Clock className="h-3 w-3" />
              Est. Queue
            </dt>
            <dd className="mt-0.5 font-semibold text-ink">
              {queueMin !== null ? (queueMin === 0 ? "No queue" : `~${queueMin} min`) : "Not available"}
            </dd>
          </div>

          {/* Predicted Availability */}
          <div className="rounded-lg bg-navy-950/80 px-2.5 py-2 border border-line/30">
            <dt className="flex items-center gap-1 text-[10px] text-mute uppercase tracking-wide">
              <BarChart3 className="h-3 w-3" />
              Predicted
            </dt>
            <dd className={`mt-0.5 font-semibold font-mono ${
              predictedPct !== null && predictedPct >= 70
                ? "text-emerald-400"
                : predictedPct !== null && predictedPct >= 40
                ? "text-amber-400"
                : predictedPct !== null
                ? "text-red-400"
                : "text-ink"
            }`}>
              {predictedPct !== null ? `${predictedPct}%` : "Not available"}
            </dd>
          </div>

          {/* Price — only shown when > 0 */}
          {hasPrice && (
            <div className="rounded-lg bg-navy-950/80 px-2.5 py-2 border border-line/30 col-span-2">
              <dt className="flex items-center gap-1 text-[10px] text-mute uppercase tracking-wide">
                <IndianRupee className="h-3 w-3" />
                Tariff
              </dt>
              <dd className="mt-0.5 font-semibold text-ink">
                ₹{station.pricePerKWh}/kWh
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* ── PREDICTION CONFIDENCE ── */}
      {station.predictionConfidence && (
        <div className="px-3.5 pb-3 border-t border-line/40 pt-2.5 flex items-center gap-2 text-[10px] text-mute">
          {station.predictionConfidence === "HIGH" ? (
            <Wifi className="h-3 w-3 text-emerald-400 shrink-0" />
          ) : station.predictionConfidence === "MODERATE" ? (
            <Wifi className="h-3 w-3 text-amber-400 shrink-0" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-400 shrink-0" />
          )}
          <span>
            Prediction confidence:{" "}
            <strong className="text-ink">{station.predictionConfidence}</strong>
          </span>
          {station.dataSourceLabel && (
            <span className="ml-auto text-[9px]">{station.dataSourceLabel}</span>
          )}
        </div>
      )}

      {/* ── DATA STALENESS WARNING ── */}
      {staleAgeMin !== null && (
        <div className="px-3.5 pb-2 flex items-center gap-1.5 text-[10px] text-amber-400">
          <AlertCircle className="h-3 w-3 shrink-0" />
          Data updated {staleAgeMin} min ago — may be stale
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div className="px-3.5 pb-3.5 pt-1 border-t border-line/40 flex items-center gap-2 flex-wrap">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-500 transition-colors shadow-sm"
        >
          <Navigation className="h-3 w-3" />
          Navigate
        </a>

        <Link
          href={`/stations/${station.id}`}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-volt hover:text-emerald-300 transition-colors"
        >
          Full Analytics →
        </Link>
      </div>
    </article>
  );
}
