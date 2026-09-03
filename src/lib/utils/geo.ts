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

/**
 * Walks a route's geometry and returns the coordinate at approximately
 * `targetKm` of cumulative distance from the start. Used to locate the
 * furthest point a vehicle can actually reach on its remaining range,
 * so we can search for overnight stays near there rather than near the
 * (unreachable) destination. Clamped to the end of the path if
 * `targetKm` exceeds the route's total length.
 */
export function pointAtDistanceKm(geometry: Coordinates[], targetKm: number): Coordinates | null {
  if (geometry.length === 0) return null;
  if (geometry.length === 1 || targetKm <= 0) return geometry[0];

  let covered = 0;
  for (let i = 1; i < geometry.length; i++) {
    const segKm = haversineKm(geometry[i - 1], geometry[i]);
    if (covered + segKm >= targetKm) {
      const t = segKm === 0 ? 0 : (targetKm - covered) / segKm;
      return interpolate(geometry[i - 1], geometry[i], Math.max(0, Math.min(1, t)));
    }
    covered += segKm;
  }
  return geometry[geometry.length - 1];
}
