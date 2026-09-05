"use client";

import { useMemo, useState } from "react";
import type { Coordinates, LiveStation } from "@/lib/types";
import { findNearestEmergencyHelp, type BatteryCondition } from "@/lib/services/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  PhoneCall,
  Zap,
  BatteryCharging,
  LifeBuoy,
  Navigation,
  Truck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface EmergencyAssistanceProps {
  currentPosition: Coordinates | null;
  stations: LiveStation[];
  socPercent: number;
  estimatedRangeKm?: number;
  destinationDistKm?: number;
  isUnreachable?: boolean;
  onSelectStation?: (station: LiveStation) => void;
  defaultExpanded?: boolean;
}

export function EmergencyAssistance({
  currentPosition,
  stations,
  socPercent,
  estimatedRangeKm,
  destinationDistKm,
  isUnreachable = false,
  onSelectStation,
  defaultExpanded = false,
}: EmergencyAssistanceProps) {
  const [expanded, setExpanded] = useState(defaultExpanded || socPercent <= 15 || isUnreachable);

  const condition: BatteryCondition = useMemo(() => {
    if (isUnreachable || socPercent <= 5) return "STRANDED";
    if (socPercent <= 15 || (estimatedRangeKm !== undefined && estimatedRangeKm < 15)) return "CRITICAL_BATTERY";
    if (socPercent <= 25 || (estimatedRangeKm !== undefined && destinationDistKm !== undefined && estimatedRangeKm < destinationDistKm)) {
      return "LOW_BATTERY";
    }
    return "NORMAL";
  }, [socPercent, estimatedRangeKm, destinationDistKm, isUnreachable]);

  const emergencyData = useMemo(() => {
    const pos: Coordinates = currentPosition ?? { lat: 12.92, lng: 80.12 };
    return findNearestEmergencyHelp(pos, stations, condition, estimatedRangeKm ?? 15);
  }, [currentPosition, stations, condition, estimatedRangeKm]);

  const isUrgent = condition === "CRITICAL_BATTERY" || condition === "STRANDED";

  return (
    <section
      className={`rounded-2xl border transition-all ${
        isUrgent
          ? "border-red-500/60 bg-red-950/30 shadow-2xl shadow-red-950/40"
          : "border-line bg-navy-900/80 shadow-md"
      }`}
      aria-label="EV Emergency Assistance and Helpline"
    >
      {/* ── HEADER BANNER ── */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-line/50">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isUrgent ? "bg-red-500/20 text-red-400" : "bg-volt/15 text-volt"
            }`}
          >
            {isUrgent ? <AlertTriangle className="h-5 w-5 animate-pulse" /> : <LifeBuoy className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-ink tracking-tight">
                {isUrgent ? "EV Emergency Assistance" : "EV Roadside & Helpline Assistance"}
              </h2>
              <Badge
                tone={
                  condition === "STRANDED"
                    ? "red"
                    : condition === "CRITICAL_BATTERY"
                    ? "red"
                    : condition === "LOW_BATTERY"
                    ? "amber"
                    : "green"
                }
              >
                {condition === "STRANDED"
                  ? "Stranded"
                  : condition === "CRITICAL_BATTERY"
                  ? "Battery Critical"
                  : condition === "LOW_BATTERY"
                  ? "Battery Low"
                  : "Standby Active"}
              </Badge>
            </div>
            <p className="text-xs text-mute mt-0.5">{emergencyData.guidance}</p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="text-xs h-8 gap-1.5"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? (
            <>
              Hide Help Directory <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Find Nearest Help & Contacts <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </div>

      {/* ── EXPANDED DIRECTORY ── */}
      {expanded && (
        <div className="p-4 sm:p-5 space-y-5 text-xs">
          {/* Quick Helplines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-red-300 flex items-center gap-1.5">
                    <PhoneCall className="h-4 w-4 text-red-400" />
                    National Highway Emergency
                  </span>
                  <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-mono">
                    24x7 Official
                  </span>
                </div>
                <p className="text-[11px] text-mute mt-1.5 leading-relaxed">
                  NHAI Highway Patrol, ambulance, and flatbed EV towing across all national highways.
                </p>
              </div>
              <a
                href="tel:1033"
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-500 transition-colors shadow-md"
              >
                <PhoneCall className="h-3.5 w-3.5" /> Call Highway Assistance (1033)
              </a>
            </div>

            <div className="rounded-xl border border-line bg-navy-950 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink flex items-center gap-1.5">
                    <LifeBuoy className="h-4 w-4 text-volt" />
                    CPO / Operator Helpline
                  </span>
                  <span className="text-[10px] bg-navy-800 text-mute border border-line px-2 py-0.5 rounded-full font-mono">
                    {emergencyData.helpline.isConfigured ? "Configured" : "Placeholder"}
                  </span>
                </div>
                <p className="text-[11px] text-mute mt-1.5 leading-relaxed">
                  Mobile EV rescue van with portable DC boost charger or emergency swap pack dispatch.
                </p>
              </div>
              <a
                href={`tel:${emergencyData.helpline.secondaryNumber}`}
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-navy-800 border border-line/80 px-3 py-2 text-xs font-semibold text-ink hover:bg-navy-700 transition-colors"
              >
                <PhoneCall className="h-3.5 w-3.5 text-volt" />{" "}
                {emergencyData.helpline.isConfigured
                  ? `Call ${emergencyData.helpline.secondaryNumber}`
                  : "Call Dispatch (1800-VOLT-GRID)"}
              </a>
            </div>
          </div>

          {/* Nearest Energy Hubs by Priority */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs uppercase tracking-[0.14em] font-semibold text-ink flex items-center gap-2">
              <Navigation className="h-3.5 w-3.5 text-volt" />
              Nearest Reachable Energy Stations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Priority 1: Charging */}
              <div className="rounded-xl border border-emerald-500/20 bg-navy-950/80 p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" /> Priority 1: Charging
                    </span>
                    <span className="text-[10px] text-mute">{emergencyData.priority1_charging.length} nearby</span>
                  </div>
                  {emergencyData.priority1_charging.length > 0 ? (
                    <div className="mt-2.5 space-y-2">
                      {emergencyData.priority1_charging.map((item) => (
                        <div
                          key={item.station.id}
                          className="rounded-lg bg-navy-900/90 p-2 border border-line/40 hover:border-emerald-500/40 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-ink text-[11px] truncate max-w-[170px]">
                              {item.station.name}
                            </p>
                            <span className="text-[10px] font-mono font-medium text-emerald-400">
                              ~{item.distanceKm} km
                            </span>
                          </div>
                          <p className="text-[10px] text-mute mt-0.5">
                            {item.station.operator} · {item.station.powerKW} kW {item.station.connectorType}
                          </p>
                          {onSelectStation && (
                            <button
                              type="button"
                              onClick={() => onSelectStation(item.station)}
                              className="mt-1.5 text-[10px] text-volt hover:underline flex items-center gap-1 font-medium"
                            >
                              View on Map →
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] text-mute italic">No charging stations in immediate vicinity.</p>
                  )}
                </div>
              </div>

              {/* Priority 2: Battery Swapping */}
              <div className="rounded-xl border border-purple-500/20 bg-navy-950/80 p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1">
                      <BatteryCharging className="h-3.5 w-3.5" /> Priority 2: Battery Swap
                    </span>
                    <span className="text-[10px] text-mute">{emergencyData.priority2_swapping.length} nearby</span>
                  </div>
                  {emergencyData.priority2_swapping.length > 0 ? (
                    <div className="mt-2.5 space-y-2">
                      {emergencyData.priority2_swapping.map((item) => (
                        <div
                          key={item.station.id}
                          className="rounded-lg bg-navy-900/90 p-2 border border-line/40 hover:border-purple-500/40 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-ink text-[11px] truncate max-w-[170px]">
                              {item.station.name}
                            </p>
                            <span className="text-[10px] font-mono font-medium text-purple-400">
                              ~{item.distanceKm} km
                            </span>
                          </div>
                          <p className="text-[10px] text-mute mt-0.5">
                            {item.station.operator} · Rapid ~3–5 min battery swap
                          </p>
                          {onSelectStation && (
                            <button
                              type="button"
                              onClick={() => onSelectStation(item.station)}
                              className="mt-1.5 text-[10px] text-purple-400 hover:underline flex items-center gap-1 font-medium"
                            >
                              View on Map →
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] text-mute italic">
                      No standalone swap stations within radius. Check dual hubs.
                    </p>
                  )}
                </div>
              </div>

              {/* Priority 3: Combined Charging + Swapping */}
              <div className="rounded-xl border border-sky-500/20 bg-navy-950/80 p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" />
                      <BatteryCharging className="h-3.5 w-3.5" /> Priority 3: Dual Hubs
                    </span>
                    <span className="text-[10px] text-mute">{emergencyData.priority3_combined.length} nearby</span>
                  </div>
                  {emergencyData.priority3_combined.length > 0 ? (
                    <div className="mt-2.5 space-y-2">
                      {emergencyData.priority3_combined.map((item) => (
                        <div
                          key={item.station.id}
                          className="rounded-lg bg-navy-900/90 p-2 border border-line/40 hover:border-sky-500/40 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-ink text-[11px] truncate max-w-[170px]">
                              {item.station.name}
                            </p>
                            <span className="text-[10px] font-mono font-medium text-sky-400">
                              ~{item.distanceKm} km
                            </span>
                          </div>
                          <p className="text-[10px] text-mute mt-0.5">
                            {item.station.operator} · Both Fast Charging & Swap
                          </p>
                          {onSelectStation && (
                            <button
                              type="button"
                              onClick={() => onSelectStation(item.station)}
                              className="mt-1.5 text-[10px] text-sky-400 hover:underline flex items-center gap-1 font-medium"
                            >
                              View on Map →
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] text-mute italic">No combined charging+swap stations nearby.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Priority 4: Roadside Assistance Procedures */}
          <div className="rounded-xl border border-line/70 bg-navy-950/70 p-3.5">
            <h4 className="font-semibold text-ink flex items-center gap-1.5 text-xs">
              <Truck className="h-4 w-4 text-mute" />
              Priority 4: Emergency EV Towing & Safety Protocol
            </h4>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-mute">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Flatbed Towing Only:</strong> Never tow an EV with drive wheels on the ground. Regenerative braking can overheat the motor.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Hazard Signaling:</strong> Park on the road shoulder, engage hazard flashers, and place safety triangle 50m behind vehicle.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}