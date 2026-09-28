"use client";

import React from "react";
import type { LiveStation } from "@/lib/types";
import {
  Compass,
  BarChart2,
  Calendar,
  MapPin,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface StationCardProps {
  station: LiveStation;
  distanceKm?: number | null;
  onBookClick?: (station: LiveStation) => void;
  showBookButton?: boolean;
  className?: string;
}

export function StationCard({
  station,
  distanceKm,
  onBookClick,
  showBookButton = true,
  className = "",
}: StationCardProps) {
  const isAvail = station.status === "available";
  const isBusy = station.status === "busy" || station.status === "limited";
  const isMaint = station.status === "maintenance" || station.status === "offline";

  const statusLabel = station.status.toUpperCase();
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;

  // Route breadcrumb formatting: e.g. "Chennai - Ranipet - Chitoor - Kolar - Bangalore, Sriperumbudur, Tamil Nadu"
  const locationBreadcrumb = (() => {
    const parts = [
      station.highway && station.highway !== "Inner city" ? station.highway : null,
      station.address,
      station.city,
    ].filter(Boolean);
    return parts.join(", ");
  })();

  const stateName =
    station.city?.toLowerCase().includes("bengaluru") || station.city?.toLowerCase().includes("kolar")
      ? "Karnataka"
      : "Tamil Nadu";

  return (
    <article
      className={`rounded-2xl border border-line bg-navy-900/90 p-5 shadow-xl transition-all hover:border-electric/50 hover:shadow-electric/10 ${className}`}
    >
      {/* ── TOP ROW: Status Badge (Left) + Distance Badge (Right) ── */}
      <div className="flex items-center justify-between gap-3">
        {/* Status Badge next to network/provider name */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase border ${
              isAvail
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : isBusy
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : "bg-red-500/15 text-red-400 border-red-500/30"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isAvail
                  ? "bg-emerald-400 animate-pulse"
                  : isBusy
                    ? "bg-amber-400"
                    : "bg-red-400"
              }`}
            />
            {statusLabel}
          </span>
          <span className="text-xs font-medium text-mute font-sans">
            {station.operator || "Independent CPO"}
          </span>
        </div>

        {/* Distance Badge */}
        {distanceKm !== null && distanceKm !== undefined && (
          <span className="rounded-full bg-navy-950 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-volt border border-line shrink-0">
            {distanceKm.toFixed(1)} km away
          </span>
        )}
      </div>

      {/* ── STATION NAME: Bold, Accent-Colored (Electric Blue), One Line ── */}
      <h3 className="mt-3 truncate text-lg font-bold text-electric tracking-tight">
        {station.name}
      </h3>

      {/* ── LOCATION LINE: Pin icon + route breadcrumb with State bolded ── */}
      <p className="mt-1 flex items-center gap-1 text-xs text-mute truncate">
        <MapPin className="h-3.5 w-3.5 text-mute/80 shrink-0" />
        <span className="truncate">
          {locationBreadcrumb ? `${locationBreadcrumb}, ` : ""}
          <strong className="text-ink font-semibold">{stateName}</strong>
        </span>
      </p>

      {/* ── THREE-COLUMN STAT ROW (Divided by hairlines) ── */}
      <div className="mt-4 grid grid-cols-3 divide-x divide-line/60 rounded-xl border border-line/50 bg-navy-950/70 p-3 text-center">
        {/* Speed / Power */}
        <div className="px-2">
          <span className="block font-mono text-base sm:text-lg font-extrabold text-ink">
            {station.powerKW} kW
          </span>
          <span className="block truncate text-[10px] font-medium uppercase tracking-wider text-mute mt-0.5">
            {station.connectorType}
          </span>
        </div>

        {/* Availability */}
        <div className="px-2">
          <span className="block font-mono text-base sm:text-lg font-extrabold text-volt">
            {station.availableConnectors}/{station.totalConnectors} Guns
          </span>
          <span className="block text-[10px] font-medium text-mute mt-0.5">
            ~{station.estimatedQueueMinutes}m wait
          </span>
        </div>

        {/* Tariff */}
        <div className="px-2">
          <span className="block font-mono text-base sm:text-lg font-extrabold text-emerald-400">
            ₹{station.pricePerKWh}/kWh
          </span>
          <span className="block text-[10px] font-medium text-mute mt-0.5">
            {Math.round(station.reliabilityScore * 100)}% reliability
          </span>
        </div>
      </div>

      {/* ── ACTION ROW ── */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line/40 pt-3">
        <div className="flex items-center gap-2">
          {/* Navigate outline button */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-navy-950 px-3 py-1.5 text-xs font-semibold text-mute hover:border-electric hover:text-ink transition-colors shadow-sm"
          >
            <Compass className="h-3.5 w-3.5 text-electric" />
            Navigate
          </a>

          {/* Analytics outline button */}
          <Link
            href={`/stations/${station.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-navy-950 px-3 py-1.5 text-xs font-semibold text-mute hover:border-electric hover:text-ink transition-colors shadow-sm"
          >
            <BarChart2 className="h-3.5 w-3.5 text-mute" />
            Analytics
          </Link>
        </div>

        {/* Book Charging Slot filled green pill button */}
        {showBookButton && (
          <button
            type="button"
            onClick={() => onBookClick && onBookClick(station)}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-volt to-emerald-400 px-4 py-2 text-xs font-bold text-navy-950 shadow-md shadow-volt/30 hover:brightness-110 transition-all cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5" />
            Book Charging Slot
          </button>
        )}
      </div>
    </article>
  );
}
