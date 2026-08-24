import type { Coordinates } from "@/lib/types";

const EARTH_KM = 6371;

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function interpolate(a: Coordinates, b: Coordinates, t: number): Coordinates {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

export function densifyPath(points: Coordinates[], maxSegmentKm = 1.4): Coordinates[] {
  if (points.length < 2) return points;
  const out: Coordinates[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const next = points[i];
    const d = haversineKm(prev, next);
    const steps = Math.max(1, Math.ceil(d / maxSegmentKm));
    for (let s = 1; s <= steps; s++) {
      out.push(interpolate(prev, next, s / steps));
    }
  }
  return out;
}

export function polylineDistanceKm(points: Coordinates[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += haversineKm(points[i - 1], points[i]);
  return d;
}
