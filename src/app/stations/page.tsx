"use client";

import React, { useEffect, useMemo, useState } from "react";
import { RouteMap } from "@/components/map/RouteMap";
import { SlotBookingModal } from "@/components/booking/SlotBookingModal";
import { apiGet } from "@/lib/client/api";
import { useGeolocationContext } from "@/lib/context/GeolocationContext";
import { haversineKm } from "@/lib/utils/geo";
import type { LiveStation, ConnectorType } from "@/lib/types";
import {
  Search,
  Filter,
  Zap,
  BatteryCharging,
  Navigation,
  Clock,
  Sparkles,
  MapPin,
  Car,
  Bike,
  CheckCircle2,
  Calendar,
  Layers,
  Map as MapIcon,
  List,
} from "lucide-react";
import Link from "next/link";

const CITIES = ["All", "Chennai", "Bengaluru", "Tambaram", "Chengalpattu", "Maraimalai Nagar"];

export default function StationsExplorerPage() {
  const [stations, setStations] = useState<LiveStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [vehicleClass, setVehicleClass] = useState<"ALL" | "2W" | "4W">("ALL");
  const [connectorFilter, setConnectorFilter] = useState<string>("ALL");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [powerTier, setPowerTier] = useState<"ALL" | "FAST_DC" | "NORMAL_AC">("ALL");

  // Mobile view toggle (Map vs List)
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  // Booking Modal State
  const [bookingStation, setBookingStation] = useState<LiveStation | null>(null);

  const { position: userCoords } = useGeolocationContext();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const json = await apiGet<{ stations: LiveStation[] }>("/api/stations");
        if (!cancelled) {
          setStations(json.stations || []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to fetch charging stations.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filtered & sorted stations
  const filteredStations = useMemo(() => {
    return stations.filter((st) => {
      // City search
      if (selectedCity !== "All" && st.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      // Query search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          st.name.toLowerCase().includes(q) ||
          st.address.toLowerCase().includes(q) ||
          st.operator.toLowerCase().includes(q) ||
          st.city.toLowerCase().includes(q) ||
          st.highway.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Vehicle Class
      if (vehicleClass === "2W") {
        const is2WCompatible =
          st.connectorType === "15A Socket" ||
          st.connectorType === "Bharat AC-001" ||
          st.connectorType === "GB/T Swap" ||
          st.connectorType === "Type 2";
        if (!is2WCompatible) return false;
      } else if (vehicleClass === "4W") {
        const is4WCompatible =
          st.connectorType === "CCS2" ||
          st.connectorType === "Type 2" ||
          st.powerKW >= 7.2;
        if (!is4WCompatible) return false;
      }

      // Connector type
      if (connectorFilter !== "ALL" && st.connectorType !== connectorFilter) {
        return false;
      }

      // Only available
      if (onlyAvailable && st.status !== "available") {
        return false;
      }

      // Power tier
      if (powerTier === "FAST_DC" && st.powerKW < 25) return false;
      if (powerTier === "NORMAL_AC" && st.powerKW >= 25) return false;

      return true;
    }).map((st) => {
      let distKm: number | null = null;
      if (userCoords) {
        distKm = haversineKm(userCoords, { lat: st.latitude, lng: st.longitude });
      }
      return { ...st, distanceKm: distKm };
    }).sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      return (b.status === "available" ? 1 : 0) - (a.status === "available" ? 1 : 0);
    });
  }, [stations, searchQuery, selectedCity, vehicleClass, connectorFilter, onlyAvailable, powerTier, userCoords]);

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      {/* ── TOP HEADER & FILTER BAR ── */}
      <section className="border-b border-line bg-navy-900/80 backdrop-blur-md px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 items-center gap-1 rounded-full bg-volt/10 border border-volt/30 px-2.5 text-[11px] font-semibold text-volt">
                  <Sparkles className="h-3 w-3" /> Live Station Finder & Slot Booking
                </span>
                <span className="text-xs text-mute font-medium">
                  {filteredStations.length} hubs active
                </span>
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-ink">
                Find Stations & Reserve Charging Slots
              </h1>
            </div>

            {/* Quick search input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search station, city, operator, highway…"
                className="w-full rounded-xl border border-line bg-navy-950 py-2.5 pl-9 pr-4 text-xs text-ink placeholder:text-mute focus:border-electric focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-mute hover:text-ink"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills Strip */}
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-line/50">
            {/* City selector */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs py-1">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCity(c)}
                  className={`rounded-lg px-3 py-1 font-medium transition-colors ${
                    selectedCity === c
                      ? "bg-electric text-white font-semibold shadow-sm"
                      : "bg-navy-950 text-mute hover:text-ink border border-line"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-line/80 mx-1 hidden sm:block" />

            {/* Vehicle Switch */}
            <div className="inline-flex rounded-lg border border-line bg-navy-950 p-0.5 text-xs">
              <button
                onClick={() => setVehicleClass("ALL")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  vehicleClass === "ALL" ? "bg-navy-800 text-ink font-semibold" : "text-mute"
                }`}
              >
                All EVs
              </button>
              <button
                onClick={() => setVehicleClass("2W")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  vehicleClass === "2W" ? "bg-volt text-navy-950 font-bold" : "text-mute"
                }`}
              >
                <Bike className="h-3 w-3" /> 2W
              </button>
              <button
                onClick={() => setVehicleClass("4W")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  vehicleClass === "4W" ? "bg-electric text-white font-bold" : "text-mute"
                }`}
              >
                <Car className="h-3 w-3" /> 4W
              </button>
            </div>

            {/* Power Type Switch */}
            <div className="inline-flex rounded-lg border border-line bg-navy-950 p-0.5 text-xs">
              <button
                onClick={() => setPowerTier("ALL")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  powerTier === "ALL" ? "bg-navy-800 text-ink font-semibold" : "text-mute"
                }`}
              >
                All Speeds
              </button>
              <button
                onClick={() => setPowerTier("FAST_DC")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  powerTier === "FAST_DC" ? "bg-volt text-navy-950 font-bold" : "text-mute"
                }`}
              >
                <Zap className="h-3 w-3" /> Fast DC (&gt;25kW)
              </button>
            </div>

            {/* Available only toggle */}
            <button
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`rounded-lg px-3 py-1 text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                onlyAvailable
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold"
                  : "bg-navy-950 text-mute border-line hover:text-ink"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${onlyAvailable ? "bg-emerald-400 animate-pulse" : "bg-mute"}`} />
              Available Now
            </button>

            {/* Mobile View Toggle */}
            <div className="ml-auto lg:hidden flex rounded-lg border border-line bg-navy-950 p-0.5 text-xs">
              <button
                onClick={() => setMobileView("list")}
                className={`flex items-center gap-1 px-3 py-1 rounded-md ${
                  mobileView === "list" ? "bg-navy-800 text-ink font-semibold" : "text-mute"
                }`}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
              <button
                onClick={() => setMobileView("map")}
                className={`flex items-center gap-1 px-3 py-1 rounded-md ${
                  mobileView === "map" ? "bg-navy-800 text-ink font-semibold" : "text-mute"
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" /> Map
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT (SPLIT VIEW) ── */}
      <div className="flex-1 mx-auto max-w-7xl w-full grid lg:grid-cols-[1.1fr_1.1fr] gap-6 p-4">
        {/* LEFT COLUMN: Station Cards List */}
        <div className={`space-y-4 overflow-y-auto max-h-[calc(100vh-220px)] pr-2 ${mobileView === "map" ? "hidden lg:block" : "block"}`}>
          {loading ? (
            <div className="py-20 text-center text-sm text-mute">
              <Zap className="mx-auto h-6 w-6 text-volt animate-bounce mb-2" />
              Scanning EV charging network in Southern India…
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="rounded-2xl border border-line bg-navy-900/50 p-10 text-center">
              <p className="text-sm font-semibold text-ink">No charging stations matched your filter criteria.</p>
              <p className="mt-1 text-xs text-mute">Try resetting the city or connector speed filter.</p>
              <button
                onClick={() => {
                  setSelectedCity("All");
                  setSearchQuery("");
                  setVehicleClass("ALL");
                  setPowerTier("ALL");
                  setOnlyAvailable(false);
                }}
                className="mt-4 rounded-xl bg-navy-800 px-4 py-2 text-xs font-semibold text-volt border border-line hover:bg-navy-700"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredStations.map((station) => {
              const isAvail = station.status === "available";
              const isBusy = station.status === "busy" || station.status === "limited";
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;

              return (
                <div
                  key={station.id}
                  className="rounded-2xl border border-line bg-navy-900/90 p-4 shadow-lg hover:border-electric/50 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            isAvail
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : isBusy
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : "bg-red-500/15 text-red-300 border-red-500/30"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isAvail ? "bg-emerald-400" : isBusy ? "bg-amber-400" : "bg-red-400"
                            }`}
                          />
                          {station.status.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-mute font-mono">{station.operator}</span>
                      </div>

                      <h3 className="mt-1 text-base font-bold text-ink group-hover:text-electric transition-colors">
                        {station.name}
                      </h3>
                      <p className="text-xs text-mute flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-mute/80 shrink-0" />
                        {station.address} · <span className="text-ink/80 font-medium">{station.city}</span>
                      </p>
                    </div>

                    {/* Distance badge if available */}
                    {station.distanceKm !== null && station.distanceKm !== undefined && (
                      <span className="shrink-0 rounded-lg bg-navy-950 px-2 py-1 text-xs font-mono font-medium text-volt border border-line">
                        {station.distanceKm.toFixed(1)} km away
                      </span>
                    )}
                  </div>

                  {/* Highlights Grid */}
                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line/40 pt-3 text-xs">
                    <div className="rounded-lg bg-navy-950/70 p-2 border border-line/30">
                      <span className="block text-[10px] uppercase text-mute">Speed / Power</span>
                      <span className="font-bold text-ink font-mono">{station.powerKW} kW</span>
                      <span className="block text-[9px] text-mute truncate">{station.connectorType}</span>
                    </div>

                    <div className="rounded-lg bg-navy-950/70 p-2 border border-line/30">
                      <span className="block text-[10px] uppercase text-mute">Availability</span>
                      <span className="font-bold text-volt font-mono">
                        {station.availableConnectors}/{station.totalConnectors} Guns
                      </span>
                      <span className="block text-[9px] text-mute">~{station.estimatedQueueMinutes}m wait</span>
                    </div>

                    <div className="rounded-lg bg-navy-950/70 p-2 border border-line/30">
                      <span className="block text-[10px] uppercase text-mute">Tariff</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        ₹{station.pricePerKWh}/kWh
                      </span>
                      <span className="block text-[9px] text-mute">Reliability: {Math.round(station.reliabilityScore * 100)}%</span>
                    </div>
                  </div>

                  {/* Amenity tag */}
                  {station.amenity && (
                    <p className="mt-2 text-[11px] text-mute italic">
                      Amenities: {station.amenity}
                    </p>
                  )}

                  {/* Actions Bar */}
                  <div className="mt-3.5 flex items-center justify-between gap-2 pt-2 border-t border-line/40">
                    <div className="flex items-center gap-2">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-navy-950 px-3 py-1.5 text-xs font-medium text-mute hover:text-ink hover:border-electric/50 transition-colors"
                      >
                        <Navigation className="h-3 w-3 text-electric" />
                        Navigate
                      </a>
                      <Link
                        href={`/stations/${station.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-line bg-navy-950 px-3 py-1.5 text-xs font-medium text-mute hover:text-ink transition-colors"
                      >
                        Analytics
                      </Link>
                    </div>

                    {/* Main Book Slot CTA */}
                    <button
                      onClick={() => setBookingStation(station)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-volt to-emerald-400 px-4 py-2 text-xs font-bold text-navy-950 shadow-md shadow-volt/30 hover:brightness-110 transition-all"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Book Charging Slot
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Corridor Map */}
        <div className={`h-[500px] lg:h-[calc(100vh-220px)] rounded-2xl overflow-hidden border border-line sticky top-6 shadow-2xl ${mobileView === "list" ? "hidden lg:block" : "block"}`}>
          <RouteMap stations={filteredStations} recommendedIds={[]} />
        </div>
      </div>

      {/* Booking Modal */}
      {bookingStation && (
        <SlotBookingModal
          station={bookingStation}
          isOpen={!!bookingStation}
          onClose={() => setBookingStation(null)}
        />
      )}
    </div>
  );
}
