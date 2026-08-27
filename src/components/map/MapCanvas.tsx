"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinates, LiveStation, OptimizedRoute } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const CHENNAI: Coordinates = { lat: 12.92, lng: 80.12 };

function statusColor(status: LiveStation["status"], recommended: boolean): string {
  if (recommended) return "#4285F4";
  if (status === "available") return "#34A853";
  if (status === "busy" || status === "limited") return "#FBBC05";
  if (status === "offline") return "#EA4335";
  return "#6b7c93";
}

// Station icon: a charging bolt inside a colored circle.
// Recommended stops get a larger size + a soft glow ring so they stand out.
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

// Small cluster bubble showing how many stations are grouped at this zoom level.
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

  const points = useMemo(() => {
    if (roadGeometry.length) return roadGeometry;
    if (waypoints.length) return waypoints;
    return stations.map((s) => ({ lat: s.latitude, lng: s.longitude }));
  }, [roadGeometry, waypoints, stations]);

  // Recommended stations render outside the cluster group so they're always
  // visible on their own, never swallowed into a "+N" bubble.
  const recommendedStations = stations.filter((s) => rec.has(s.id));
  const regularStations = stations.filter((s) => !rec.has(s.id));

  return (
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

      {/* Regular stations get clustered when zoomed out */}
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={(cluster: any) => clusterIcon(cluster.getChildCount())}
      >
        {regularStations.map((s) => {
          const color = statusColor(s.status, false);
          return (
            <Marker key={s.id} position={[s.latitude, s.longitude]} icon={markerIcon(color, false)}>
              <StationPopup s={s} recommended={false} />
            </Marker>
          );
        })}
      </MarkerClusterGroup>

      {/* Recommended stations always render on top, never clustered */}
      {recommendedStations.map((s) => {
        const color = statusColor(s.status, true);
        return (
          <Marker key={s.id} position={[s.latitude, s.longitude]} icon={markerIcon(color, true)}>
            <StationPopup s={s} recommended={true} />
          </Marker>
        );
      })}
    </MapContainer>
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
          <dd>
            {s.availableConnectors} / {s.totalConnectors}
          </dd>
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