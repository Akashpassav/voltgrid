"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import type { Coordinates, LiveStation, OptimizedRoute } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const CHENNAI: Coordinates = { lat: 12.92, lng: 80.12 };

function statusColor(status: LiveStation["status"], recommended: boolean): string {
  if (recommended) return "#4c8dff";
  if (status === "available") return "#3ddc97";
  if (status === "busy" || status === "limited") return "#f5a524";
  if (status === "offline") return "#f04343";
  return "#6b7c93";
}

function markerIcon(color: string, recommended: boolean) {
  const size = recommended ? 22 : 16;
  return L.divIcon({
    className: "vg-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:999px;background:${color};border:2px solid #070b14;box-shadow:0 0 0 2px ${color}55"></div>`,
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
  const points = useMemo(() => {
    const g = route?.geometry ?? [];
    if (g.length) return g;
    return stations.map((s) => ({ lat: s.latitude, lng: s.longitude }));
  }, [route, stations]);

  return (
    <MapContainer
      center={[CHENNAI.lat, CHENNAI.lng]}
      zoom={11}
      className="h-full w-full rounded-xl"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · CARTO'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <Fit points={points} />
      {route && route.geometry.length > 1 && (
        <Polyline
          positions={route.geometry.map((p) => [p.lat, p.lng])}
          pathOptions={{ color: "#3ddc97", weight: 5, opacity: 0.9 }}
        />
      )}
      {route && (
        <>
          <CircleMarker
            center={[route.origin.latitude, route.origin.longitude]}
            radius={8}
            pathOptions={{ color: "#e8eef8", fillColor: "#e8eef8", fillOpacity: 1 }}
          />
          <CircleMarker
            center={[route.destination.latitude, route.destination.longitude]}
            radius={8}
            pathOptions={{ color: "#4c8dff", fillColor: "#4c8dff", fillOpacity: 1 }}
          />
        </>
      )}
      {stations.map((s) => {
        const recommended = rec.has(s.id);
        const color = statusColor(s.status, recommended);
        return (
          <Marker
            key={s.id}
            position={[s.latitude, s.longitude]}
            icon={markerIcon(color, recommended)}
          >
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
          </Marker>
        );
      })}
    </MapContainer>
  );
}
