/**
 * Overnight stay lookup for the "trip unreachable" fallback.
 *
 * When a trip can't be completed today (no reachable charger within
 * range), we look for hotels/guest houses/motels near the furthest
 * point the vehicle can actually reach, so the driver can charge
 * overnight and continue the next day — instead of hitting a dead end.
 *
 * Uses OSM's Overpass API, the same free OSM family as our existing
 * OSRM routing and Nominatim search, so no new API key is required.
 */
import type { Coordinates, LiveStation, OvernightStay } from "@/lib/types";
import { haversineKm } from "@/lib/utils/geo";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// How far around the reachable point to search for stays. Wide enough to
// catch a nearby town's hotels without pulling in results from too far off.
const SEARCH_RADIUS_M = 8000;

// A stay is treated as "at a charger" if a station is within this distance —
// close enough to walk or make a short final hop on low remaining charge.
const NEAREST_STATION_RADIUS_KM = 6;

// Cap results so the UI stays scannable and we don't over-fetch from the
// shared public Overpass instance.
const MAX_STAYS = 8;

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

type StayKind = OvernightStay["kind"];

function stayKindFromTags(tags: Record<string, string> | undefined): StayKind | null {
  const tourism = tags?.tourism;
  if (tourism === "hotel" || tourism === "guest_house" || tourism === "motel") {
    return tourism;
  }
  return null;
}

function nearestOnlineStation(
  point: Coordinates,
  stations: LiveStation[],
): OvernightStay["nearestStation"] {
  let best: OvernightStay["nearestStation"];
  for (const station of stations) {
    const distanceKm = haversineKm(point, { lat: station.latitude, lng: station.longitude });
    if (distanceKm > NEAREST_STATION_RADIUS_KM) continue;
    if (!best || distanceKm < best.distanceKm) {
      best = { id: station.id, name: station.name, distanceKm: Number(distanceKm.toFixed(2)) };
    }
  }
  return best;
}

/**
 * Finds hotels/guest houses/motels near `point` (the furthest reachable
 * point on the current route), ranking stays near a charger first so the
 * top results are ones the driver can actually plug in at overnight.
 *
 * Returns an empty array — never throws — on any lookup failure, so a
 * flaky Overpass response degrades to "no stays found" rather than
 * breaking the whole optimize response.
 */
export async function findOvernightStays(
  point: Coordinates,
  nearbyStations: LiveStation[],
): Promise<OvernightStay[]> {
  const query = `
    [out:json][timeout:10];
    (
      node["tourism"~"^(hotel|guest_house|motel)$"](around:${SEARCH_RADIUS_M},${point.lat},${point.lng});
      way["tourism"~"^(hotel|guest_house|motel)$"](around:${SEARCH_RADIUS_M},${point.lat},${point.lng});
    );
    out center ${MAX_STAYS * 4};
  `;

  let elements: OverpassElement[] = [];
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: query,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Overpass responded with ${res.status}`);
    const data = await res.json();
    elements = Array.isArray(data?.elements) ? data.elements : [];
  } catch (err) {
    console.error("Overnight stay lookup failed (Overpass):", err);
    return [];
  }

  const stays: OvernightStay[] = [];
  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    const kind = stayKindFromTags(el.tags);
    if (lat === undefined || lng === undefined || !kind) continue;

    const distanceFromReachablePointKm = haversineKm(point, { lat, lng });
    stays.push({
      id: `stay-${el.id}`,
      name: el.tags?.name ?? "Unnamed stay",
      kind,
      latitude: lat,
      longitude: lng,
      distanceFromReachablePointKm: Number(distanceFromReachablePointKm.toFixed(2)),
      nearestStation: nearestOnlineStation({ lat, lng }, nearbyStations),
    });
  }

  // Stays near a charger first (the actual point of this feature), then by
  // proximity to the furthest-reachable point.
  stays.sort((a, b) => {
    const aHasCharger = a.nearestStation ? 0 : 1;
    const bHasCharger = b.nearestStation ? 0 : 1;
    if (aHasCharger !== bHasCharger) return aHasCharger - bHasCharger;
    return a.distanceFromReachablePointKm - b.distanceFromReachablePointKm;
  });

  return stays.slice(0, MAX_STAYS);
}
