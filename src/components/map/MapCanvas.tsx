"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinates, LiveStation, OptimizedRoute, StationCapability } from "@/lib/types";
import Link from "next/link";
import { useGeolocationContext } from "@/lib/context/GeolocationContext";
import { Locate, AlertTriangle, Bike, Car, LayoutGrid, Navigation } from "lucide-react";
import { useStationCoverage } from "@/lib/hooks/useStationCoverage";
import { getStationCapability } from "@/lib/models/station-capability";
import { haversineKm } from "@/lib/utils/geo";

const CHENNAI: Coordinates = { lat: 12.92, lng: 80.12 };

type VehicleFilter = "all" | "2-wheeler" | "4-wheeler";

function statusColor(
  status: LiveStation["status"],
  recommended: boolean,
): string {
  if (recommended) return "#4285F4";
  if (status === "available") return "#34A853";
  if (status === "busy" || status === "limited") return "#FBBC05";
  if (status === "offline") return "#EA4335";
  return "#6b7c93";
}

function markerIcon(
  color: string,
  recommended: boolean,
  capabilityType: StationCapability = "CHARGING",
) {
  const size = recommended ? 34 : 26;

  const glow = recommended
    ? `<div style="position:absolute;inset:-6px;border-radius:999px;background:${color};opacity:0.35;animation:vg-pulse 1.6s ease-out infinite;"></div>`
    : "";

  let iconSvg = "";
  if (capabilityType === "BATTERY_SWAP") {
    // Battery swap cell
    iconSvg = `<svg width="${size * 0.55}" height="${size * 0.55}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="16" height="10" rx="2" ry="2"/><line x1="22" y1="11" x2="22" y2="13"/></svg>`;
  } else if (capabilityType === "CHARGING_AND_SWAP") {
    // Dual charging bolt + battery dot
    iconSvg = `<svg width="${size * 0.58}" height="${size * 0.58}" viewBox="0 0 24 24" fill="none"><path d="M11 2L3 13h5l-1 8 8-11h-5l1-8z" fill="#ffffff"/><circle cx="18" cy="18" r="4" fill="#a855f7" stroke="#ffffff" stroke-width="1.2"/></svg>`;
  } else {
    // Classic lightning bolt
    iconSvg = `<svg width="${size * 0.55}" height="${size * 0.55}" viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="#ffffff"/></svg>`;
  }

  const badgeHtml =
    capabilityType === "CHARGING_AND_SWAP"
      ? `<span style="position:absolute;bottom:-4px;right:-4px;background:#0284C7;border:1.5px solid #ffffff;border-radius:999px;font-size:8px;line-height:1;padding:1px 3px;color:#fff;font-weight:bold;box-shadow:0 1px 3px rgba(0,0,0,0.5);">⚡🔋</span>`
      : capabilityType === "BATTERY_SWAP"
      ? `<span style="position:absolute;bottom:-4px;right:-4px;background:#8B5CF6;border:1.5px solid #ffffff;border-radius:999px;font-size:8px;line-height:1;padding:1px 3px;color:#fff;font-weight:bold;box-shadow:0 1px 3px rgba(0,0,0,0.5);">🔋</span>`
      : "";

  return L.divIcon({
    className: "vg-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${glow}
        <div style="position:relative;width:${size}px;height:${size}px;border-radius:999px;background:${color};border:2.5px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;">
          ${iconSvg}
        </div>
        ${badgeHtml}
      </div>
    `,
  });
}

function userLocationIcon() {
  return L.divIcon({
    className: "vg-user-marker",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `
      <div style="position:relative;width:26px;height:26px;">
        <div style="position:absolute;inset:-10px;border-radius:999px;background:#4285F4;opacity:0.25;animation:vg-pulse 1.8s ease-out infinite;"></div>
        <div style="position:relative;width:26px;height:26px;border-radius:999px;background:#4285F4;border:3px solid #ffffff;box-shadow:0 0 0 2px rgba(66,133,244,0.4),0 2px 6px rgba(0,0,0,0.4);"></div>
      </div>
    `,
  });
}

function pinIcon(color: string) {
  return L.divIcon({
    className: "vg-pin",
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    html: `
      <div style="position:relative;width:30px;height:42px;">
        <svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 0C6.7 0 0 6.7 0 15c0 11.25 15 27 15 27s15-15.75 15-27C30 6.7 23.3 0 15 0z" fill="${color}"/>
          <circle cx="15" cy="15" r="6" fill="#ffffff"/>
        </svg>
      </div>`,
  });
}

function clusterIcon(count: number) {
  const size = count < 10 ? 34 : count < 50 ? 40 : count < 200 ? 46 : 52;

  return L.divIcon({
    className: "vg-cluster",
    iconSize: [size, size],
    html: `<div style="width:${size}px;height:${size}px;border-radius:999px;background:#4285F4;border:3px solid #ffffff;box-shadow:0 1px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-family:sans-serif;font-size:${size * 0.34}px;">${count}</div>`,
  });
}

function Fit({ points }: { points: Coordinates[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const bounds = L.latLngBounds(
      points.map((point) => [point.lat, point.lng]),
    );

    map.fitBounds(bounds.pad(0.12));
  }, [map, points]);

  return null;
}

/**
 * Recenters exactly once when browser geolocation first becomes available.
 *
 * IMPORTANT:
 * This component owns the ref instead of receiving a mutable ref through
 * props. This satisfies React's immutability lint rule.
 */
function RecenterOnFirstFix({
  position,
}: {
  position: Coordinates | null;
}) {
  const map = useMap();
  const hasRecenteredRef = useRef(false);

  useEffect(() => {
    if (!position || hasRecenteredRef.current) return;

    map.setView([position.lat, position.lng], 14);
    hasRecenteredRef.current = true;
  }, [position, map]);

  return null;
}

function RecenterButton({ position }: { position: Coordinates | null }) {
  const map = useMap();

  return (
    <button
      type="button"
      onClick={() => {
        if (position) {
          map.setView([position.lat, position.lng], 15);
        }
      }}
      disabled={!position}
      className="absolute bottom-6 right-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full border border-line bg-navy-900/90 text-ink shadow-lg backdrop-blur transition-colors hover:bg-navy-800 disabled:opacity-40"
      title="Recenter to my location"
    >
      <Locate className="h-4.5 w-4.5" />
    </button>
  );
}

// 2W / 4W / all toggle — keeps the map legible once station density jumps
// from ~50 to 1000+ points across Tamil Nadu + Bengaluru.
function VehicleFilterControl({
  value,
  onChange,
}: {
  value: VehicleFilter;
  onChange: (v: VehicleFilter) => void;
}) {
  const options: {
    id: VehicleFilter;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "all",
      label: "All",
      icon: <LayoutGrid className="h-3.5 w-3.5" />,
    },
    {
      id: "2-wheeler",
      label: "2W",
      icon: <Bike className="h-3.5 w-3.5" />,
    },
    {
      id: "4-wheeler",
      label: "4W",
      icon: <Car className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div className="absolute right-3 top-3 z-[1000] flex gap-1 rounded-lg border border-electric/20 bg-navy-900/90 p-1 shadow-lg backdrop-blur">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            value === opt.id
              ? "bg-electric/20 text-electric shadow-[0_0_12px_-4px] shadow-electric/60"
              : "text-mute hover:text-ink"
          }`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function useRoadGeometry(waypoints: Coordinates[]): Coordinates[] {
  const [roadGeometry, setRoadGeometry] = useState<Coordinates[]>([]);

  useEffect(() => {
    if (waypoints.length < 2) {
      setRoadGeometry([]);
      return;
    }

    // If waypoints already contains detailed geometry points (>5), use it directly
    // rather than sending thousands of points over the wire to OSRM.
    if (waypoints.length > 5) {
      setRoadGeometry(waypoints);
      return;
    }

    const coordsParam = waypoints
      .map((point) => `${point.lng},${point.lat}`)
      .join(";");

    const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`;

    let cancelled = false;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;

        const coords = data?.routes?.[0]?.geometry?.coordinates;

        if (Array.isArray(coords) && coords.length > 1) {
          setRoadGeometry(
            coords.map(([lng, lat]: [number, number]) => ({
              lat,
              lng,
            })),
          );
        } else {
          setRoadGeometry(waypoints);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoadGeometry(waypoints);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [waypoints]);

  return roadGeometry;
}

export function MapCanvas({
  stations,
  route,
  recommendedIds = [],
}: {
  stations: LiveStation[];
  route?: OptimizedRoute | null;
  recommendedIds?: string[];
}) {
  const rec = useMemo(
    () => new Set(recommendedIds),
    [recommendedIds],
  );

  const waypoints = useMemo(
    () => route?.geometry ?? [],
    [route],
  );

  const roadGeometry = useRoadGeometry(waypoints);
  const geo = useGeolocationContext();

  const [vehicleFilter, setVehicleFilter] =
    useState<VehicleFilter>("all");

  // Tamil Nadu + Bengaluru live coverage from Open Charge Map, merged with
  // whatever stations the page already passes in.
  const {
    stations: coverageStations,
    error: coverageError,
  } = useStationCoverage();

  const allStations = useMemo(() => {
    const seenIds = new Set(stations.map((s) => s.id));

    const extra = coverageStations.filter(
      (s) => !seenIds.has(s.id),
    );

    return [...stations, ...extra];
  }, [stations, coverageStations]);

  const filteredStations = useMemo(() => {
    if (vehicleFilter === "all") {
      return allStations;
    }

    return allStations.filter((station) => {
      const vehicleType = (
        station as { vehicleType?: string }
      ).vehicleType;

      // Stations without a known vehicle type remain visible in every
      // filter mode so the map does not become misleadingly sparse.
      return (
        !vehicleType ||
        vehicleType === "unspecified" ||
        vehicleType === "both" ||
        vehicleType === vehicleFilter
      );
    });
  }, [allStations, vehicleFilter]);

  useEffect(() => {
    geo.requestLocation();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const points = useMemo(() => {
    if (roadGeometry.length) {
      return roadGeometry;
    }

    if (waypoints.length) {
      return waypoints;
    }

    return filteredStations.map((station) => ({
      lat: station.latitude,
      lng: station.longitude,
    }));
  }, [roadGeometry, waypoints, filteredStations]);

  const recommendedStations = filteredStations.filter(
    (station) => rec.has(station.id),
  );

  const regularStations = filteredStations.filter(
    (station) => !rec.has(station.id),
  );

  const showPermissionBanner =
    geo.status === "denied" ||
    geo.status === "unavailable" ||
    geo.status === "unsupported";

  const showCoverageError = Boolean(coverageError);

  return (
    <div className="relative h-full w-full">
      {showPermissionBanner && (
        <div className="absolute left-3 right-3 top-3 z-[1000] flex items-start gap-2 rounded-lg border border-warn/30 bg-navy-900/95 p-3 text-xs text-ink shadow-lg backdrop-blur">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />

          <div>
            <p className="font-medium">{geo.errorMessage}</p>

            <p className="mt-0.5 text-mute">
              Showing Chennai as the default view. Enable
              location to find the nearest station to you.
            </p>
          </div>
        </div>
      )}

      {showCoverageError && !showPermissionBanner && (
        <div className="absolute left-3 top-3 z-[1000] rounded-lg border border-warn/30 bg-navy-900/95 px-3 py-1.5 text-xs text-warn shadow-lg backdrop-blur">
          Live station coverage unavailable — showing local
          data only.
        </div>
      )}

      <VehicleFilterControl
        value={vehicleFilter}
        onChange={setVehicleFilter}
      />

      <MapContainer
        center={[CHENNAI.lat, CHENNAI.lng]}
        zoom={11}
        className="h-full w-full rounded-xl"
        scrollWheelZoom
      >
        <style>{`
          @keyframes vg-pulse {
            0% {
              transform: scale(1);
              opacity: 0.35;
            }

            100% {
              transform: scale(1.8);
              opacity: 0;
            }
          }
        `}</style>

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Fit points={points} />

        <RecenterOnFirstFix position={geo.position} />

        <RecenterButton position={geo.position} />

        {geo.position && (
          <Marker
            position={[
              geo.position.lat,
              geo.position.lng,
            ]}
            icon={userLocationIcon()}
          >
            <Popup>You are here</Popup>
          </Marker>
        )}

        {roadGeometry.length > 1 && (
          <>
            <Polyline
              positions={roadGeometry.map((point) => [
                point.lat,
                point.lng,
              ])}
              pathOptions={{
                color: "#ffffff",
                weight: 9,
                opacity: 1,
                lineCap: "round",
                lineJoin: "round",
              }}
            />

            <Polyline
              positions={roadGeometry.map((point) => [
                point.lat,
                point.lng,
              ])}
              pathOptions={{
                color: "#4285F4",
                weight: 6,
                opacity: 1,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
        )}

        {route && (
          <>
            <Marker
              position={[
                route.origin.latitude,
                route.origin.longitude,
              ]}
              icon={pinIcon("#34A853")}
            />

            <Marker
              position={[
                route.destination.latitude,
                route.destination.longitude,
              ]}
              icon={pinIcon("#EA4335")}
            />
          </>
        )}

       <MarkerClusterGroup
  chunkedLoading
  maxClusterRadius={55}
  iconCreateFunction={(cluster: { getChildCount: () => number }) =>
    clusterIcon(cluster.getChildCount())
  }
>
          {regularStations.map((station) => {
            const color = statusColor(
              station.status,
              false,
            );
            const cap = getStationCapability(station);

            return (
              <Marker
                key={station.id}
                position={[
                  station.latitude,
                  station.longitude,
                ]}
                icon={markerIcon(color, false, cap.type)}
              >
                <StationPopup
                  s={station}
                  recommended={false}
                  userPosition={geo.position}
                />
              </Marker>
            );
          })}
        </MarkerClusterGroup>

        {recommendedStations.map((station) => {
          const color = statusColor(
            station.status,
            true,
          );
          const cap = getStationCapability(station);

          return (
            <Marker
              key={station.id}
              position={[
                station.latitude,
                station.longitude,
              ]}
              icon={markerIcon(color, true, cap.type)}
            >
              <StationPopup
                s={station}
                recommended
                userPosition={geo.position}
              />
            </Marker>
          );
        })}
      </MapContainer>

      {/* ── MODERN MAP CAPABILITY LEGEND ── */}
      <div className="absolute bottom-6 left-3 z-[1000] rounded-xl border border-line/90 bg-navy-950/95 p-3 text-xs text-ink shadow-2xl backdrop-blur max-w-[260px]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-[11px] tracking-wider uppercase text-mute">Station Capabilities</span>
          <span className="text-[10px] bg-navy-800 text-volt px-1.5 py-0.5 rounded font-medium">Legend</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs">
              ⚡
            </span>
            <div>
              <p className="font-semibold text-ink leading-none">Charging</p>
              <p className="text-[10px] text-mute leading-tight">Battery plug-in charging</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40 text-xs">
              🔋
            </span>
            <div>
              <p className="font-semibold text-ink leading-none">Battery Swap</p>
              <p className="text-[10px] text-mute leading-tight">~3–5 min pack replacement</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 text-[10px]">
              ⚡🔋
            </span>
            <div>
              <p className="font-semibold text-ink leading-none">Charging + Swap</p>
              <p className="text-[10px] text-mute leading-tight">Both services available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StationPopup({
  s,
  recommended,
  userPosition,
}: {
  s: LiveStation;
  recommended: boolean;
  userPosition: Coordinates | null;
}) {
  const cap = getStationCapability(s);
  const userDistKm = userPosition
    ? Number((haversineKm(userPosition, { lat: s.latitude, lng: s.longitude }) * 1.15).toFixed(1))
    : null;

  return (
    <Popup className="vg-popup">
      <div className="min-w-[240px] max-w-[280px] text-xs space-y-2 p-0.5">
        <div>
          <div className="flex items-start justify-between gap-1">
            <p className="font-bold text-sm text-slate-900 leading-snug">{s.name}</p>
            {recommended && (
              <span className="shrink-0 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Best Stop
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">
            {s.operator} · {s.city || "Corridor"}
          </p>
          {userDistKm !== null && (
            <p className="text-[11px] font-semibold text-blue-600 mt-0.5">
              📍 {userDistKm} km from your location
            </p>
          )}
        </div>

        {/* Explicit Station Capabilities */}
        <div className="rounded-lg bg-slate-100 p-2 space-y-1 border border-slate-200">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Available Services</p>
          <div className="flex flex-col gap-1">
            {cap.charging && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <span className="text-emerald-600">⚡</span> Charging Available ({s.powerKW} kW {s.connectorType})
              </span>
            )}
            {cap.batterySwap && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-700">
                <span className="text-purple-600">🔋</span> Battery Swap Available (~3–5 min exchange)
              </span>
            )}
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-700 border-t border-slate-200 pt-1.5">
          <div>
            <span className="text-slate-500">Status: </span>
            <span className={`font-semibold capitalize ${s.status === "available" ? "text-emerald-700" : s.status === "offline" ? "text-red-600" : "text-amber-700"}`}>
              {s.status}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Predicted: </span>
            <span className="font-semibold text-slate-900">{Math.round(s.predictedAvailability * 100)}%</span>
          </div>
          <div>
            <span className="text-slate-500">Points: </span>
            <span className="font-semibold text-slate-900">{s.availableConnectors} / {s.totalConnectors}</span>
          </div>
          <div>
            <span className="text-slate-500">Queue: </span>
            <span className="font-semibold text-slate-900">~{s.estimatedQueueMinutes}m</span>
          </div>
          {s.pricePerKWh > 0 && (
            <div className="col-span-2">
              <span className="text-slate-500">Tariff: </span>
              <span className="font-semibold text-slate-900">₹{s.pricePerKWh}/kWh</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Navigation className="h-3 w-3" /> Navigate
          </a>
          <Link
            href={`/stations/${s.id}`}
            className="text-[11px] font-semibold text-emerald-600 hover:underline"
          >
            Full Analytics →
          </Link>
        </div>
      </div>
    </Popup>
  );
}