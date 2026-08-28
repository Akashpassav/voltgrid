"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinates, LiveStation, OptimizedRoute } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { Locate, AlertTriangle } from "lucide-react";
import { useTamilNaduStations } from "@/lib/hooks/useTamilNaduStations";

const CHENNAI: Coordinates = { lat: 12.92, lng: 80.12 };

function statusColor(status: LiveStation["status"], recommended: boolean): string {
  if (recommended) return "#4285F4";
  if (status === "available") return "#34A853";
  if (status === "busy" || status === "limited") return "#FBBC05";
  if (status === "offline") return "#EA4335";
  return "#6b7c93";
}

function markerIcon(color: string, recommended: boolean) {
  const size = recommended ? 34 : 24;
  const glow = recommended
    ? `<div style="position:absolute;inset:-6px;border-radius:999px;background:${color};opacity:0.25;animation:vg-pulse 1.6s ease-out infinite;"></div>`
    : "";
  return L.divIcon({
    className: "vg-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${glow}
        <div style="position:relative;width:${size}px;height:${size}px;border-radius:999px;background:${color};border:3px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
          <svg width="${size * 0.55}" height="${size * 0.55}" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="#ffffff"/>
          </svg>
        </div>
      </div>
    `,
  });
}

// "You are here" — blue pulsing dot, distinct from station markers
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
  const size = count < 10 ? 34 : count < 25 ? 40 : 46;
  return L.divIcon({
    className: "vg-cluster",
    iconSize: [size, size],
    html: `<div style="width:${size}px;height:${size}px;border-radius:999px;background:#4285F4;border:3px solid #ffffff;box-shadow:0 1px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-family:sans-serif;font-size:${size * 0.36}px;">${count}</div>`,
  });
}

function Fit({ points }: { points: Coordinates[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const b = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(b.pad(0.12));
  }, [map, points]);
  return null;
}

// Pans the map to the user's position once, on first fix only.
function RecenterOnFirstFix({ position, hasRecentered }: { position: Coordinates | null; hasRecentered: React.MutableRefObject<boolean> }) {
  const map = useMap();
  useEffect(() => {
    if (position && !hasRecentered.current) {
      map.setView([position.lat, position.lng], 14);
      hasRecentered.current = true;
    }
  }, [position, map, hasRecentered]);
  return null;
}

// Imperative recenter button — needs access to the map instance.
function RecenterButton({ position }: { position: Coordinates | null }) {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={() => {
        if (position) map.setView([position.lat, position.lng], 15);
      }}
      disabled={!position}
      className="absolute bottom-6 right-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full border border-line bg-navy-900/90 text-ink shadow-lg backdrop-blur transition-colors hover:bg-navy-800 disabled:opacity-40"
      title="Recenter to my location"
    >
      <Locate className="h-4.5 w-4.5" />
    </button>
  );
}

function useRoadGeometry(waypoints: Coordinates[]): Coordinates[] {
  const [roadGeometry, setRoadGeometry] = useState<Coordinates[]>([]);

  useEffect(() => {
    if (waypoints.length < 2) {
      setRoadGeometry([]);
      return;
    }
    const coordsParam = waypoints.map((p) => `${p.lng},${p.lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`;
    let cancelled = false;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        if (Array.isArray(coords) && coords.length > 1) {
          setRoadGeometry(coords.map(([lng, lat]: [number, number]) => ({ lat, lng })));
        } else {
          setRoadGeometry(waypoints);
        }
      })
      .catch(() => {
        if (!cancelled) setRoadGeometry(waypoints);
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
  const rec = useMemo(() => new Set(recommendedIds), [recommendedIds]);
  const waypoints = useMemo(() => route?.geometry ?? [], [route]);
  const roadGeometry = useRoadGeometry(waypoints);
  const geo = useGeolocation();
  const hasRecentered = useMemo(() => ({ current: false }), []);

  // Live Tamil Nadu charging stations from Open Charge Map, merged in
  // automatically so no page needs to fetch or pass these separately.
  const { stations: tnStations, error: tnError } = useTamilNaduStations();
  const allStations = useMemo(() => {
    const seenIds = new Set(stations.map((s) => s.id));
    const extra = tnStations.filter((s) => !seenIds.has(s.id));
    return [...stations, ...extra];
  }, [stations, tnStations]);

  useEffect(() => {
    geo.start();
    return () => geo.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const points = useMemo(() => {
    if (roadGeometry.length) return roadGeometry;
    if (waypoints.length) return waypoints;
    return allStations.map((s) => ({ lat: s.latitude, lng: s.longitude }));
  }, [roadGeometry, waypoints, allStations]);

  const recommendedStations = allStations.filter((s) => rec.has(s.id));
  const regularStations = allStations.filter((s) => !rec.has(s.id));

  const showPermissionBanner = geo.status === "denied" || geo.status === "unavailable" || geo.status === "unsupported";
  const showTnError = Boolean(tnError);

  return (
    <div className="relative h-full w-full">
      {showPermissionBanner && (
        <div className="absolute left-3 right-3 top-3 z-[1000] flex items-start gap-2 rounded-lg border border-warn/30 bg-navy-900/95 p-3 text-xs text-ink shadow-lg backdrop-blur">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
          <div>
            <p className="font-medium">{geo.errorMessage}</p>
            <p className="mt-0.5 text-mute">Showing Chennai as the default view. Enable location to find the nearest station to you.</p>
          </div>
        </div>
      )}

      {showTnError && (
        <div className="absolute left-3 top-3 z-[1000] rounded-lg border border-warn/30 bg-navy-900/95 px-3 py-1.5 text-xs text-warn shadow-lg backdrop-blur">
          Live Tamil Nadu station data unavailable — showing local data only.
        </div>
      )}

      <MapContainer
        center={[CHENNAI.lat, CHENNAI.lng]}
        zoom={11}
        className="h-full w-full rounded-xl"
        scrollWheelZoom
      >
        <style>{`
          @keyframes vg-pulse {
            0% { transform: scale(1); opacity: 0.35; }
            100% { transform: scale(1.8); opacity: 0; }
          }
        `}</style>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Fit points={points} />
        <RecenterOnFirstFix position={geo.position} hasRecentered={hasRecentered} />
        <RecenterButton position={geo.position} />

        {geo.position && (
          <Marker position={[geo.position.lat, geo.position.lng]} icon={userLocationIcon()}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {roadGeometry.length > 1 && (
          <>
            <Polyline
              positions={roadGeometry.map((p) => [p.lat, p.lng])}
              pathOptions={{ color: "#ffffff", weight: 9, opacity: 1, lineCap: "round", lineJoin: "round" }}
            />
            <Polyline
              positions={roadGeometry.map((p) => [p.lat, p.lng])}
              pathOptions={{ color: "#4285F4", weight: 6, opacity: 1, lineCap: "round", lineJoin: "round" }}
            />
          </>
        )}

        {route && (
          <>
            <Marker position={[route.origin.latitude, route.origin.longitude]} icon={pinIcon("#34A853")} />
            <Marker position={[route.destination.latitude, route.destination.longitude]} icon={pinIcon("#EA4335")} />
          </>
        )}

        <MarkerClusterGroup chunkedLoading iconCreateFunction={(cluster: any) => clusterIcon(cluster.getChildCount())}>
          {regularStations.map((s) => {
            const color = statusColor(s.status, false);
            return (
              <Marker key={s.id} position={[s.latitude, s.longitude]} icon={markerIcon(color, false)}>
                <StationPopup s={s} recommended={false} />
              </Marker>
            );
          })}
        </MarkerClusterGroup>

        {recommendedStations.map((s) => {
          const color = statusColor(s.status, true);
          return (
            <Marker key={s.id} position={[s.latitude, s.longitude]} icon={markerIcon(color, true)}>
              <StationPopup s={s} recommended={true} />
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

function StationPopup({ s, recommended }: { s: LiveStation; recommended: boolean }) {
  return (
    <Popup className="vg-popup">
      <div className="min-w-[220px] text-sm">
        <p className="font-semibold">{s.name}</p>
        <p className="text-xs opacity-70">
          {s.id} · {s.operator}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <Badge tone={s.status === "available" ? "green" : s.status === "offline" ? "red" : s.status === "maintenance" ? "mute" : "amber"}>
            {s.status}
          </Badge>
          {recommended && <Badge tone="blue">Recommended</Badge>}
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <dt>Connectors</dt>
          <dd>{s.availableConnectors} / {s.totalConnectors}</dd>
          <dt>Power</dt>
          <dd>{s.powerKW} kW</dd>
          <dt>Queue</dt>
          <dd>~{s.estimatedQueueMinutes} min</dd>
          <dt>Price</dt>
          <dd>₹{s.pricePerKWh}/kWh</dd>
          <dt>Predicted</dt>
          <dd>{Math.round(s.predictedAvailability * 100)}%</dd>
        </dl>
        <Link href={`/stations/${s.id}`} className="mt-2 inline-block text-xs text-[#3ddc97]">
          Full intelligence →
        </Link>
      </div>
    </Popup>
  );
}