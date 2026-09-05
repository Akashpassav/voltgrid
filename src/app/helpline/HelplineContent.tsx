"use client";

/**
 * HelplineContent — Full interactive EV Emergency Assistance UI (NEW FILE)
 *
 * This is the client-side content for /helpline. It is rendered inside
 * a <Suspense> boundary in page.tsx (required by Next.js App Router
 * when using useSearchParams).
 *
 * Data policy:
 *   - Uses existing /api/stations endpoint (same as route page).
 *   - Uses existing findNearestEmergencyHelp() and getBatteryCondition().
 *   - Uses existing GeolocationContext for user position.
 *   - NEVER fabricates phone numbers, distances, or station data.
 *   - Shows "Not available" for missing information.
 *   - No existing file is modified.
 *
 * Battery states:
 *   NORMAL         → General helpline reference / standby
 *   LOW_BATTERY    → Nearest energy stations highlighted
 *   CRITICAL       → Priority routing to nearest charger/swap
 *   STRANDED       → Full emergency experience, pulsing UI
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useGeolocationContext } from "@/lib/context/GeolocationContext";
import { findNearestEmergencyHelp, getBatteryCondition } from "@/lib/services/navigation";
import { apiGet } from "@/lib/client/api";
import type { LiveStation } from "@/lib/types";
import { StationInfoCard } from "@/components/stations/StationInfoCard";
import {
  AlertTriangle,
  ArrowLeft,
  Battery,
  BatteryCharging,
  CheckCircle2,
  Locate,
  PhoneCall,
  RefreshCw,
  ShieldAlert,
  Truck,
  Zap,
  LifeBuoy,
  Navigation,
} from "lucide-react";
import { haversineKm } from "@/lib/utils/geo";

// ── Battery condition display config ─────────────────────────────────────────

const CONDITION_CONFIG = {
  NORMAL: {
    label: "Normal Operation",
    sublabel: "Battery levels are within safe operating margins.",
    icon: Battery,
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    badgeColor: "bg-emerald-500/20 text-emerald-300",
  },
  LOW_BATTERY: {
    label: "Low Battery Warning",
    sublabel: "Plan a charging stop soon. Energy level is getting low.",
    icon: Battery,
    iconColor: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    badgeColor: "bg-amber-500/20 text-amber-300",
  },
  CRITICAL_BATTERY: {
    label: "Battery Critically Low",
    sublabel: "Divert immediately to the nearest accessible energy station.",
    icon: ShieldAlert,
    iconColor: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    badgeColor: "bg-red-500/20 text-red-300",
  },
  STRANDED: {
    label: "Vehicle Stranded — Battery Depleted",
    sublabel: "Request roadside assistance or flatbed tow to the nearest energy hub.",
    icon: AlertTriangle,
    iconColor: "text-red-400",
    bgColor: "bg-red-950/40",
    borderColor: "border-red-500/60",
    badgeColor: "bg-red-600 text-white",
  },
};

// ── Quick action card ─────────────────────────────────────────────────────────

function QuickAction({
  icon: Icon,
  label,
  sublabel,
  color,
  onClick,
  active = false,
}: {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  color: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-xl border p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]",
        active
          ? "border-volt/60 bg-volt/10 shadow-lg shadow-volt/10"
          : "border-line bg-navy-900/90 hover:border-line/60",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}/15`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-ink text-sm leading-tight">{label}</p>
          <p className="text-[11px] text-mute mt-0.5 leading-relaxed">{sublabel}</p>
        </div>
      </div>
    </button>
  );
}

// ── Main interactive content ──────────────────────────────────────────────────

export default function HelplineContent() {
  const searchParams = useSearchParams();
  const geo = useGeolocationContext();

  // SOC from query param (set by EmergencyFAB on route page)
  const socFromUrl = searchParams ? Number(searchParams.get("soc") ?? "50") : 50;
  const [displayedSoc, setDisplayedSoc] = useState<number>(
    isNaN(socFromUrl) ? 50 : Math.max(0, Math.min(100, socFromUrl)),
  );

  const [stations, setStations] = useState<LiveStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<
    "overview" | "charging" | "swap" | "dual" | "roadside"
  >("overview");

  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<{ stations: LiveStation[] }>("/api/stations");
      setStations(data.stations ?? []);
    } catch {
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStations();
    geo.requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive battery condition
  const condition = useMemo(
    () => getBatteryCondition(displayedSoc),
    [displayedSoc],
  );

  const conditionCfg = CONDITION_CONFIG[condition];
  const ConditionIcon = conditionCfg.icon;
  const userPos = geo.position;

  const emergencyData = useMemo(() => {
    if (!userPos) return null;
    return findNearestEmergencyHelp(userPos, stations, condition, 20);
  }, [userPos, stations, condition]);

  function withDist(station: LiveStation): number | null {
    if (!userPos) return null;
    return Number(
      (haversineKm(userPos, { lat: station.latitude, lng: station.longitude }) * 1.15).toFixed(1),
    );
  }

  const isUrgent = condition === "CRITICAL_BATTERY" || condition === "STRANDED";

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-navy-950">
      {/* ── PAGE HEADER ── */}
      <div
        className={[
          "border-b px-4 py-5 sm:px-6",
          isUrgent
            ? "border-red-500/40 bg-red-950/30"
            : "border-line bg-navy-900/60",
        ].join(" ")}
      >
        <div className="mx-auto max-w-4xl">
          <Link
            href="/route"
            className="inline-flex items-center gap-1.5 text-xs text-mute hover:text-ink transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Route
          </Link>

          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div className="flex items-start gap-4">
              <div
                className={[
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border",
                  conditionCfg.bgColor,
                  conditionCfg.borderColor,
                ].join(" ")}
              >
                <ConditionIcon
                  className={`h-7 w-7 ${conditionCfg.iconColor} ${isUrgent ? "animate-pulse" : ""}`}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-ink leading-tight">
                    EV Emergency Assistance
                  </h1>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${conditionCfg.badgeColor}`}
                  >
                    {conditionCfg.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-mute leading-relaxed max-w-xl">
                  {conditionCfg.sublabel}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchStations()}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-mute hover:text-ink transition-colors"
              title="Refresh station data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Updating…" : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-8">

        {/* ── BATTERY INDICATOR ── */}
        <section className="rounded-2xl border border-line bg-navy-900/80 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-ink flex items-center gap-2">
              <Battery className="h-4 w-4 text-volt" />
              Battery State of Charge
            </p>
            <span
              className={`font-mono font-bold text-lg ${
                displayedSoc <= 15
                  ? "text-red-400"
                  : displayedSoc <= 25
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {displayedSoc}%
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-navy-800 overflow-hidden">
            <div
              className={[
                "h-full rounded-full transition-all duration-300",
                displayedSoc <= 5
                  ? "bg-red-500"
                  : displayedSoc <= 15
                  ? "bg-red-400"
                  : displayedSoc <= 25
                  ? "bg-amber-400"
                  : "bg-emerald-400",
              ].join(" ")}
              style={{ width: `${Math.max(2, displayedSoc)}%` }}
              role="progressbar"
              aria-valuenow={displayedSoc}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Battery: ${displayedSoc}%`}
            />
          </div>

          <div className="flex justify-between mt-1.5 text-[10px] text-mute font-mono">
            <span className="text-red-400">Stranded ≤5%</span>
            <span className="text-red-400">Critical ≤15%</span>
            <span className="text-amber-400">Low ≤25%</span>
            <span className="text-emerald-400">Normal</span>
          </div>

          {/* Simulate battery level (for demo/testing) */}
          <div className="mt-4 pt-3 border-t border-line/40">
            <p className="text-[10px] text-mute mb-2 uppercase tracking-wider font-semibold">
              Simulate Battery Level
            </p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "🔋 Stranded (3%)", soc: 3 },
                { label: "🔴 Critical (12%)", soc: 12 },
                { label: "🟡 Low (20%)", soc: 20 },
                { label: "🟢 Normal (65%)", soc: 65 },
              ].map(({ label, soc }) => (
                <button
                  key={soc}
                  type="button"
                  onClick={() => setDisplayedSoc(soc)}
                  className={[
                    "rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-colors",
                    displayedSoc === soc
                      ? "border-volt/60 bg-volt/15 text-volt"
                      : "border-line text-mute hover:text-ink",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── LOCATION STATUS ── */}
        <section className="rounded-2xl border border-line bg-navy-900/80 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink flex items-center gap-2">
              <Locate className="h-4 w-4 text-volt" />
              Your Location
            </p>
            {(geo.status === "idle" || geo.status === "requesting") && (
              <button
                type="button"
                onClick={() => geo.requestLocation()}
                className="rounded-lg border border-volt/40 bg-volt/10 px-3 py-1.5 text-xs font-semibold text-volt hover:bg-volt/20 transition-colors"
              >
                Enable GPS
              </button>
            )}
          </div>

          {userPos ? (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-volt opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-volt" />
              </span>
              <span className="text-ink font-mono text-xs">
                {userPos.lat.toFixed(5)}, {userPos.lng.toFixed(5)}
              </span>
              <span className="text-[10px] text-mute">· GPS active</span>
            </div>
          ) : (
            <p className="mt-2 text-xs text-mute">
              {geo.status === "denied"
                ? "Location access denied. Enable in browser settings to find nearest stations."
                : geo.status === "unsupported"
                ? "Geolocation is not supported by your browser."
                : "Waiting for location…"}
            </p>
          )}
        </section>

        {/* ── QUICK ACTIONS ── */}
        <section>
          <p className="text-xs uppercase tracking-[0.16em] font-semibold text-mute mb-3">
            What would you like to do?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickAction
              icon={Zap}
              label="📍 Find Nearest Charging Station"
              sublabel="Locate the closest available EV charging point"
              color="text-emerald-400"
              active={activeView === "charging"}
              onClick={() => setActiveView(activeView === "charging" ? "overview" : "charging")}
            />
            <QuickAction
              icon={BatteryCharging}
              label="🔋 Find Nearest Battery Swap"
              sublabel="Rapid 3–5 min battery replacement stations"
              color="text-purple-400"
              active={activeView === "swap"}
              onClick={() => setActiveView(activeView === "swap" ? "overview" : "swap")}
            />
            <QuickAction
              icon={Zap}
              label="⚡🔋 Dual Charging + Swap Hubs"
              sublabel="Stations with both fast charging and battery swap"
              color="text-sky-400"
              active={activeView === "dual"}
              onClick={() => setActiveView(activeView === "dual" ? "overview" : "dual")}
            />
            <QuickAction
              icon={Truck}
              label="🛠 EV Roadside Assistance"
              sublabel="Towing, mobile charging dispatch, safety protocol"
              color="text-amber-400"
              active={activeView === "roadside"}
              onClick={() => setActiveView(activeView === "roadside" ? "overview" : "roadside")}
            />
          </div>
        </section>

        {/* Location required notice */}
        {!userPos && activeView !== "overview" && activeView !== "roadside" && (
          <div className="rounded-xl border border-warn/30 bg-warn/10 p-4 text-sm text-warn">
            📍 Enable GPS location to find the nearest stations to you.
          </div>
        )}

        {/* ── CHARGING STATIONS ── */}
        {userPos && emergencyData && activeView === "charging" && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              Nearest Charging Stations
              <span className="text-xs text-mute font-normal">
                ({emergencyData.priority1_charging.length} found)
              </span>
            </h2>
            {emergencyData.priority1_charging.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emergencyData.priority1_charging.map((item) => (
                  <StationInfoCard
                    key={item.station.id}
                    station={item.station}
                    userDistanceKm={withDist(item.station)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-navy-900/80 p-5 text-sm text-mute text-center">
                No charging stations found in the current dataset.
              </div>
            )}
          </section>
        )}

        {/* ── BATTERY SWAP STATIONS ── */}
        {userPos && emergencyData && activeView === "swap" && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <BatteryCharging className="h-4 w-4 text-purple-400" />
              Nearest Battery Swap Stations
              <span className="text-xs text-mute font-normal">
                ({emergencyData.priority2_swapping.length} found)
              </span>
            </h2>
            {emergencyData.priority2_swapping.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emergencyData.priority2_swapping.map((item) => (
                  <StationInfoCard
                    key={item.station.id}
                    station={item.station}
                    userDistanceKm={withDist(item.station)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-navy-900/80 p-5 text-sm text-mute text-center">
                <p>No dedicated battery swap stations found in the current dataset.</p>
                <p className="text-xs mt-1">
                  Try &quot;Dual Hubs&quot; for stations with both charging and swap services.
                </p>
              </div>
            )}
          </section>
        )}

        {/* ── DUAL HUBS ── */}
        {userPos && emergencyData && activeView === "dual" && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Zap className="h-4 w-4 text-sky-400" />
              <BatteryCharging className="h-4 w-4 text-sky-400" />
              Dual-Service Hubs (Charging + Swap)
              <span className="text-xs text-mute font-normal">
                ({emergencyData.priority3_combined.length} found)
              </span>
            </h2>
            {emergencyData.priority3_combined.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emergencyData.priority3_combined.map((item) => (
                  <StationInfoCard
                    key={item.station.id}
                    station={item.station}
                    userDistanceKm={withDist(item.station)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-navy-900/80 p-5 text-sm text-mute text-center">
                No combined charging + swap stations found nearby.
              </div>
            )}
          </section>
        )}

        {/* ── EMERGENCY CONTACTS & ROADSIDE ── */}
        {(activeView === "roadside" || activeView === "overview") && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-red-400" />
              Emergency Contacts &amp; Roadside Assistance
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* NHAI — verified official number */}
              <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-red-300 flex items-center gap-2 text-sm">
                      <PhoneCall className="h-4 w-4" />
                      National Highway Emergency
                    </span>
                    <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-mono">
                      24×7 Official
                    </span>
                  </div>
                  <p className="text-xs text-mute leading-relaxed">
                    NHAI Highway Patrol — flatbed EV towing, ambulance, and emergency
                    vehicle recovery across all National Highways and Expressways.
                  </p>
                </div>
                <a
                  href="tel:1033"
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition-colors shadow-md"
                >
                  <PhoneCall className="h-4 w-4" />
                  Call 1033 — Highway Assistance
                </a>
              </div>

              {/* Operator helpline — only if configured */}
              <div className="rounded-2xl border border-line bg-navy-900/90 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-ink flex items-center gap-2 text-sm">
                      <LifeBuoy className="h-4 w-4 text-volt" />
                      CPO / Operator Helpline
                    </span>
                    <span className="text-[10px] bg-navy-800 text-mute border border-line px-2 py-0.5 rounded-full">
                      {emergencyData?.helpline.isConfigured ? "Configured" : "Not configured"}
                    </span>
                  </div>
                  <p className="text-xs text-mute leading-relaxed">
                    Mobile EV rescue van with portable DC boost charger or emergency
                    battery swap pack dispatch to your location.
                  </p>
                </div>
                {emergencyData?.helpline.isConfigured ? (
                  <a
                    href={`tel:${emergencyData.helpline.secondaryNumber}`}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-navy-800 border border-line/80 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-navy-700 transition-colors"
                  >
                    <PhoneCall className="h-4 w-4 text-volt" />
                    Call {emergencyData.helpline.secondaryNumber}
                  </a>
                ) : (
                  <div className="mt-4 rounded-xl border border-line/40 bg-navy-950/50 px-4 py-2.5 text-xs text-mute text-center">
                    Helpline number not configured.
                    <br />
                    Contact your fleet operator directly.
                  </div>
                )}
              </div>
            </div>

            {/* EV Safety Protocol */}
            <div className="rounded-2xl border border-line/70 bg-navy-900/70 p-5">
              <h3 className="font-semibold text-ink flex items-center gap-2 text-sm mb-4">
                <Truck className="h-4 w-4 text-mute" />
                EV Emergency Safety Protocol
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-mute">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Flatbed Towing Only:</strong>{" "}
                    Never tow an EV with drive wheels on the ground — regenerative
                    braking can overheat the motor and damage the battery.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Hazard Signaling:</strong>{" "}
                    Park on the road shoulder, engage hazard flashers, and place
                    a safety triangle 50 m behind the vehicle.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Battery Fire Protocol:</strong>{" "}
                    Do not use CO₂ or dry powder extinguishers on lithium battery
                    fires. Evacuate and call 101 (Fire) immediately.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Share Your Location:</strong>{" "}
                    Provide your GPS coordinates (shown above) to emergency services
                    or fleet operator for faster dispatch.
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── OVERVIEW: ALL NEARBY STATIONS ── */}
        {activeView === "overview" && userPos && emergencyData && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Navigation className="h-4 w-4 text-volt" />
              Nearest Reachable Energy Stations
            </h2>

            {isUrgent && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Battery is {condition === "STRANDED" ? "depleted" : "critically low"}.
                  Prioritising the closest reachable stations below.
                </span>
              </div>
            )}

            {emergencyData.priority1_charging.length > 0 && (
              <div>
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                  <Zap className="h-3.5 w-3.5" />
                  Charging Stations ({emergencyData.priority1_charging.length})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {emergencyData.priority1_charging.slice(0, 2).map((item) => (
                    <StationInfoCard
                      key={item.station.id}
                      station={item.station}
                      userDistanceKm={withDist(item.station)}
                    />
                  ))}
                </div>
              </div>
            )}

            {emergencyData.priority2_swapping.length > 0 && (
              <div>
                <p className="text-xs font-bold text-purple-400 flex items-center gap-1.5 mb-2">
                  <BatteryCharging className="h-3.5 w-3.5" />
                  Battery Swap Stations ({emergencyData.priority2_swapping.length})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {emergencyData.priority2_swapping.slice(0, 2).map((item) => (
                    <StationInfoCard
                      key={item.station.id}
                      station={item.station}
                      userDistanceKm={withDist(item.station)}
                    />
                  ))}
                </div>
              </div>
            )}

            {emergencyData.priority1_charging.length === 0 &&
              emergencyData.priority2_swapping.length === 0 &&
              emergencyData.priority3_combined.length === 0 && (
              <div className="rounded-xl border border-line bg-navy-900/80 p-5 text-center text-sm text-mute">
                No energy stations found in current data.
                <br />
                <button
                  type="button"
                  onClick={() => void fetchStations()}
                  className="mt-3 inline-flex items-center gap-1.5 text-volt hover:underline text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh station data
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── FOOTER ── */}
        <div className="pt-4 border-t border-line/40 text-center text-[11px] text-mute">
          VoltGrid EV Emergency Assistance — Station data is{" "}
          {loading ? "refreshing…" : "live from infrastructure APIs."}{" "}
          <Link href="/planner" className="text-volt hover:underline">
            Plan a new route →
          </Link>
        </div>
      </div>
    </div>
  );
}
