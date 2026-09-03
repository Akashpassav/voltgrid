/**
 * State-wide routing via OSRM's public driving API.
 * Replaces the old 43-node Chennai-corridor Dijkstra graph so origin and
 * destination can be ANY coordinate (Tamil Nadu, Bengaluru, current
 * location, or anywhere else OSRM can route).
 *
 * Shape-compatible with the old RoutedPath so the rest of optimize.ts
 * (simulateWithStops, confidence scoring, API response building) needs
 * minimal changes.
 */
import type { Coordinates } from "@/lib/types";

export interface RouteWaypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  stationId?: string;
}

export interface RouteEdge {
  distanceKm: number;
  terrainFactor: number; // flat 1.0 state-wide — no elevation data source at this scope
  durationMinutes: number; // real OSRM driving duration for this leg (pre-traffic-multiplier)
}

export interface RouteLegLite {
  from: RouteWaypoint;
  to: RouteWaypoint;
  edge: RouteEdge;
}

export interface RoutedPath {
  nodes: RouteWaypoint[];
  legs: RouteLegLite[];
  distanceKm: number;
  baseMinutes: number;
  meanTerrain: number;
  meanTraffic: number;
  geometry: Coordinates[];
}

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

interface OsrmLeg {
  distance: number; // meters
  duration: number; // seconds
}

interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: { coordinates: [number, number][] };
  legs: OsrmLeg[];
}

async function fetchOSRM(url: string): Promise<Response> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch (err) {
    // One retry — public OSRM can have transient connection hiccups, and on
    // Windows a stalled IPv6 attempt can otherwise waste the whole timeout
    // budget before falling back. A short second attempt is cheap insurance.
    console.error("OSRM fetch failed, retrying once:", err);
    return fetch(url, { signal: AbortSignal.timeout(10000) });
  }
}

const OSRM_CACHE = new Map<string, { routes: OsrmRoute[]; expiresAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_SIZE = 500;

async function callOSRM(waypoints: RouteWaypoint[], alternatives = false): Promise<OsrmRoute[]> {
  if (waypoints.length < 2) return [];
  const coordsParam = waypoints.map((w) => `${w.longitude},${w.latitude}`).join(";");
  const alt = alternatives && waypoints.length === 2 ? "&alternatives=true" : "";
  const cacheKey = `${coordsParam}:${alt}`;

  const cached = OSRM_CACHE.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.routes;
  }

  const url = `${OSRM_BASE}/${coordsParam}?overview=full&geometries=geojson&steps=false${alt}`;

  const res = await fetchOSRM(url);
  if (!res.ok) {
    throw new Error(`OSRM responded with ${res.status}`);
  }
  const data = await res.json();
  const routes: OsrmRoute[] = Array.isArray(data?.routes) ? data.routes : [];
  const valid = routes.filter((route) => route && Array.isArray(route.legs) && Array.isArray(route.geometry?.coordinates));

  if (valid.length > 0) {
    if (OSRM_CACHE.size >= MAX_CACHE_SIZE) {
      const oldestKey = OSRM_CACHE.keys().next().value;
      if (oldestKey) OSRM_CACHE.delete(oldestKey);
    }
    OSRM_CACHE.set(cacheKey, { routes: valid, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  return valid;
}

function toRoutedPath(
  route: OsrmRoute,
  deduped: RouteWaypoint[],
  trafficMultiplier: number,
): RoutedPath | null {
  if (route.legs.length !== deduped.length - 1) return null;

  const legs: RouteLegLite[] = route.legs.map((osrmLeg, i) => ({
    from: deduped[i],
    to: deduped[i + 1],
    edge: {
      distanceKm: osrmLeg.distance / 1000,
      terrainFactor: 1,
      durationMinutes: osrmLeg.duration / 60,
    },
  }));

  const geometry: Coordinates[] = route.geometry.coordinates.map(([lng, lat]) => ({
    lat,
    lng,
  }));

  return {
    nodes: deduped,
    legs,
    distanceKm: Number((route.distance / 1000).toFixed(2)),
    baseMinutes: Number(((route.duration / 60) * trafficMultiplier).toFixed(1)),
    meanTerrain: 1,
    meanTraffic: trafficMultiplier,
    geometry,
  };
}

/**
 * Routes through an ordered list of waypoints (origin → stop(s) → destination)
 * in a single OSRM request, using OSRM's own per-leg breakdown so each hop
 * carries its real distance/duration.
 */
export async function routeViaWaypoints(
  waypoints: RouteWaypoint[],
  trafficMultiplier: number,
): Promise<RoutedPath | null> {
  if (waypoints.length < 2) return null;

  // De-duplicate consecutive identical points (OSRM errors on zero-distance legs).
  const deduped: RouteWaypoint[] = [waypoints[0]];
  for (let i = 1; i < waypoints.length; i++) {
    const prev = deduped[deduped.length - 1];
    const same =
      Math.abs(prev.latitude - waypoints[i].latitude) < 1e-6 &&
      Math.abs(prev.longitude - waypoints[i].longitude) < 1e-6;
    if (!same) deduped.push(waypoints[i]);
  }
  if (deduped.length < 2) return null;

  if (deduped.length === 2) {
    const routes = await callOSRM(deduped, false);
    return routes[0] ? toRoutedPath(routes[0], deduped, trafficMultiplier) : null;
  }

  // Multi-waypoint routes: route leg-by-leg.
  // This prevents OSRM's public multi-waypoint graph partitioning from
  // corrupting/snapping intermediate waypoints to distant clusters (e.g. Puducherry).
  const legPromises: Promise<RoutedPath | null>[] = [];
  for (let i = 0; i < deduped.length - 1; i++) {
    legPromises.push(routeBetween(deduped[i], deduped[i + 1], trafficMultiplier));
  }
  const legResults = await Promise.all(legPromises);
  if (legResults.some((l) => l === null)) return null;

  const validLegs = legResults as RoutedPath[];
  const allLegs: RouteLegLite[] = [];
  const allGeometry: Coordinates[] = [];
  let totalDistanceKm = 0;
  let totalMinutes = 0;

  for (let i = 0; i < validLegs.length; i++) {
    const legPath = validLegs[i];
    totalDistanceKm += legPath.distanceKm;
    totalMinutes += legPath.baseMinutes;
    if (legPath.legs.length > 0) {
      allLegs.push(...legPath.legs);
    } else {
      allLegs.push({
        from: deduped[i],
        to: deduped[i + 1],
        edge: {
          distanceKm: legPath.distanceKm,
          terrainFactor: 1,
          durationMinutes: legPath.baseMinutes / trafficMultiplier,
        },
      });
    }
    if (i === 0) {
      allGeometry.push(...legPath.geometry);
    } else {
      allGeometry.push(...legPath.geometry.slice(1));
    }
  }

  return {
    nodes: deduped,
    legs: allLegs,
    distanceKm: Number(totalDistanceKm.toFixed(2)),
    baseMinutes: Number(totalMinutes.toFixed(1)),
    meanTerrain: 1,
    meanTraffic: trafficMultiplier,
    geometry: allGeometry,
  };
}

/** Convenience wrapper for a simple two-point route. */
export async function routeBetween(
  from: RouteWaypoint,
  to: RouteWaypoint,
  trafficMultiplier: number,
): Promise<RoutedPath | null> {
  const paths = await routesBetween(from, to, trafficMultiplier);
  return paths[0] ?? null;
}

/**
 * Origin→destination OSRM paths, including public-API alternatives when they
 * exist. Near-duplicate geometries (within 3% distance and time) are dropped.
 */
export async function routesBetween(
  from: RouteWaypoint,
  to: RouteWaypoint,
  trafficMultiplier: number,
): Promise<RoutedPath[]> {
  const same =
    Math.abs(from.latitude - to.latitude) < 1e-6 && Math.abs(from.longitude - to.longitude) < 1e-6;
  if (same) return [];

  const deduped = [from, to];
  const routes = await callOSRM(deduped, true);
  const paths: RoutedPath[] = [];
  for (const route of routes) {
    const path = toRoutedPath(route, deduped, trafficMultiplier);
    if (!path) continue;
    const duplicate = paths.some(
      (existing) =>
        Math.abs(existing.distanceKm - path.distanceKm) / Math.max(existing.distanceKm, 1) < 0.03 &&
        Math.abs(existing.baseMinutes - path.baseMinutes) / Math.max(existing.baseMinutes, 1) < 0.03,
    );
    if (!duplicate) paths.push(path);
  }
  return paths;
}