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

async function callOSRM(waypoints: RouteWaypoint[]): Promise<OsrmRoute | null> {
  if (waypoints.length < 2) return null;
  const coordsParam = waypoints.map((w) => `${w.longitude},${w.latitude}`).join(";");
  const url = `${OSRM_BASE}/${coordsParam}?overview=full&geometries=geojson&steps=false`;

  const res = await fetchOSRM(url);
  if (!res.ok) {
    throw new Error(`OSRM responded with ${res.status}`);
  }
  const data = await res.json();
  const route: OsrmRoute | undefined = data?.routes?.[0];
  if (!route || !Array.isArray(route.legs)) return null;
  return route;
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

  const route = await callOSRM(deduped);
  if (!route) return null;

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

/** Convenience wrapper for a simple two-point route. */
export async function routeBetween(
  from: RouteWaypoint,
  to: RouteWaypoint,
  trafficMultiplier: number,
): Promise<RoutedPath | null> {
  return routeViaWaypoints([from, to], trafficMultiplier);
}