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

export interface RouteProjection {
  closestPoint: Coordinates;
  distanceFromRouteKm: number;
  distanceAlongRouteKm: number;
  totalRouteKm: number;
  remainingRouteKm: number;
  fraction: number;
  segmentIndex: number;
}

/**
 * Projects a point (such as live GPS position) onto a polyline road geometry.
 * Calculates exact distance from route (for off-route detection), distance
 * already traveled along the route, remaining distance, and progress fraction.
 */
export function projectPointOnPolyline(
  point: Coordinates,
  geometry: Coordinates[],
): RouteProjection {
  const totalRouteKm = polylineDistanceKm(geometry);

  if (geometry.length === 0) {
    return {
      closestPoint: point,
      distanceFromRouteKm: 0,
      distanceAlongRouteKm: 0,
      totalRouteKm: 0,
      remainingRouteKm: 0,
      fraction: 0,
      segmentIndex: -1,
    };
  }

  if (geometry.length === 1) {
    const d = haversineKm(point, geometry[0]);
    return {
      closestPoint: geometry[0],
      distanceFromRouteKm: d,
      distanceAlongRouteKm: 0,
      totalRouteKm: 0,
      remainingRouteKm: 0,
      fraction: 1,
      segmentIndex: 0,
    };
  }

  let minDistanceKm = Infinity;
  let bestClosestPoint: Coordinates = geometry[0];
  let bestDistanceAlongKm = 0;
  let bestSegmentIndex = 0;
  let cumulativeKm = 0;

  for (let i = 1; i < geometry.length; i++) {
    const a = geometry[i - 1];
    const b = geometry[i];
    const segKm = haversineKm(a, b);

    // Project point onto segment [a, b] using equirectangular projection
    const midLatRad = toRad((a.lat + b.lat) / 2);
    const cosMid = Math.cos(midLatRad);

    const dx = (b.lng - a.lng) * cosMid;
    const dy = b.lat - a.lat;
    const lenSq = dx * dx + dy * dy;

    let t = 0;
    if (lenSq > 0) {
      const px = (point.lng - a.lng) * cosMid;
      const py = point.lat - a.lat;
      t = Math.max(0, Math.min(1, (px * dx + py * dy) / lenSq));
    }

    const projectedPoint: Coordinates = {
      lat: a.lat + t * (b.lat - a.lat),
      lng: a.lng + t * (b.lng - a.lng),
    };

    const distFromSeg = haversineKm(point, projectedPoint);

    if (distFromSeg < minDistanceKm) {
      minDistanceKm = distFromSeg;
      bestClosestPoint = projectedPoint;
      bestDistanceAlongKm = cumulativeKm + haversineKm(a, projectedPoint);
      bestSegmentIndex = i - 1;
    }

    cumulativeKm += segKm;
  }

  const remainingRouteKm = Math.max(0, totalRouteKm - bestDistanceAlongKm);
  const fraction = totalRouteKm > 0 ? Math.min(1, Math.max(0, bestDistanceAlongKm / totalRouteKm)) : 0;

  return {
    closestPoint: bestClosestPoint,
    distanceFromRouteKm: Number(minDistanceKm.toFixed(3)),
    distanceAlongRouteKm: Number(bestDistanceAlongKm.toFixed(2)),
    totalRouteKm: Number(totalRouteKm.toFixed(2)),
    remainingRouteKm: Number(remainingRouteKm.toFixed(2)),
    fraction: Number(fraction.toFixed(3)),
    segmentIndex: bestSegmentIndex,
  };
}

export function isOffRoute(distanceFromRouteKm: number, thresholdMeters = 400): boolean {
  return distanceFromRouteKm * 1000 > thresholdMeters;
}

