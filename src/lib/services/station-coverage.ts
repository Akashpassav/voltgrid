import { promises as fs } from "fs";
import path from "path";

// Approximate real-world bounding boxes — used to filter OCM's radius
// results down to genuinely-in-region points (radius search alone spills
// into neighbouring states).
const TAMIL_NADU_BOUNDS = { minLat: 8.0, maxLat: 13.6, minLng: 76.2, maxLng: 80.5 };
const BENGALURU_BOUNDS = { minLat: 12.75, maxLat: 13.15, minLng: 77.35, maxLng: 77.85 };

const TAMIL_NADU_CENTER = { lat: 11.1271, lng: 78.6569, radiusKm: 400 };
const BENGALURU_CENTER = { lat: 12.9716, lng: 77.5946, radiusKm: 60 };

const CACHE_DIR = path.join(process.cwd(), ".data");
const CACHE_FILE = path.join(CACHE_DIR, "station-coverage.json");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type VehicleCompatibility = "2-wheeler" | "4-wheeler" | "both" | "unspecified";

export interface CoverageStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  operator: string;
  status: "available" | "offline" | "busy" | "limited" | "maintenance";
  connectorTypes: string[];
  vehicleType: VehicleCompatibility;
  powerKW: number;
  availableConnectors: number;
  totalConnectors: number;
  estimatedQueueMinutes: number;
  pricePerKWh: number;
  predictedAvailability: number;
  reliabilityScore: number;
  region: "tamil-nadu" | "bengaluru";
  source: "openchargemap";
}

interface OCMConnection {
  ConnectionType?: { Title?: string };
  PowerKW?: number;
}

interface OCMPoi {
  ID: number;
  AddressInfo: {
    Title: string;
    Latitude: number;
    Longitude: number;
    AddressLine1?: string;
    Town?: string;
  };
  OperatorInfo?: { Title?: string };
  UsageType?: { Title?: string };
  Connections?: OCMConnection[];
  StatusType?: { IsOperational?: boolean };
}

function withinBounds(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
): boolean {
  return lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng;
}

/**
 * Infers 2W/4W/both compatibility from connector types, since OCM has no
 * direct vehicle-class field. Bharat AC-001 is India's 2W/3W standard;
 * CCS/CHAdeMO/Type 1/Type 2/Tesla are 4W+ standards. When neither signal is
 * present, we default to "unspecified" rather than guess.
 */
function inferVehicleType(connections: OCMConnection[] | undefined): VehicleCompatibility {
  if (!connections || connections.length === 0) return "unspecified";
  const titles = connections
    .map((c) => c.ConnectionType?.Title?.toLowerCase() ?? "")
    .filter(Boolean);

  const has2W = titles.some((t) => t.includes("bharat ac") || t.includes("bharat dc") || t.includes("2 wheel"));
  const has4W = titles.some(
    (t) =>
      t.includes("ccs") ||
      t.includes("chademo") ||
      t.includes("type 1") ||
      t.includes("type 2") ||
      t.includes("tesla") ||
      t.includes("gb/t"),
  );

  if (has2W && has4W) return "both";
  if (has2W) return "2-wheeler";
  if (has4W) return "4-wheeler";
  return "unspecified";
}

function normalizePoi(poi: OCMPoi, region: CoverageStation["region"]): CoverageStation | null {
  if (!poi.AddressInfo?.Latitude || !poi.AddressInfo?.Longitude) return null;

  const connections = poi.Connections ?? [];
  const connectorTypes = Array.from(
    new Set(connections.map((c) => c.ConnectionType?.Title).filter((t): t is string => Boolean(t))),
  );
  const bestPower = connections.reduce((max, c) => Math.max(max, c.PowerKW ?? 0), 0);
  const isOperational = poi.StatusType?.IsOperational !== false;
  const addressParts = [poi.AddressInfo.AddressLine1, poi.AddressInfo.Town].filter(Boolean);

  return {
    id: `ocm-${poi.ID}`,
    name: poi.AddressInfo.Title || "Unnamed station",
    latitude: poi.AddressInfo.Latitude,
    longitude: poi.AddressInfo.Longitude,
    address: addressParts.join(", ") || poi.AddressInfo.Title || "Address unavailable",
    operator: poi.OperatorInfo?.Title || "Unknown operator",
    status: isOperational ? "available" : "offline",
    connectorTypes,
    vehicleType: inferVehicleType(connections),
    powerKW: bestPower,
    availableConnectors: connections.length || 1,
    totalConnectors: connections.length || 1,
    estimatedQueueMinutes: 0,
    pricePerKWh: 0,
    predictedAvailability: isOperational ? 0.8 : 0,
    reliabilityScore: isOperational ? 0.75 : 0.2,
    region,
    source: "openchargemap",
  };
}

async function fetchRegion(
  center: { lat: number; lng: number; radiusKm: number },
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  region: CoverageStation["region"],
  apiKey: string,
): Promise<CoverageStation[]> {
  const url = new URL("https://api.openchargemap.io/v3/poi/");
  url.searchParams.set("output", "json");
  url.searchParams.set("countrycode", "IN");
  url.searchParams.set("latitude", String(center.lat));
  url.searchParams.set("longitude", String(center.lng));
  url.searchParams.set("distance", String(center.radiusKm));
  url.searchParams.set("distanceunit", "KM");
  url.searchParams.set("maxresults", "2000");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), {
    headers: { "X-API-Key": apiKey },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`OCM responded with ${res.status} for ${region}`);
  }

  const raw: OCMPoi[] = await res.json();
  const normalized = raw
    .map((poi) => normalizePoi(poi, region))
    .filter((s): s is CoverageStation => s !== null)
    .filter((s) => withinBounds(s.latitude, s.longitude, bounds));

  return normalized;
}

async function fetchFresh(): Promise<CoverageStation[]> {
  const apiKey = process.env.OCM_API_KEY;
  if (!apiKey) {
    throw new Error("OCM_API_KEY is not configured on the server.");
  }

  const [tamilNadu, bengaluru] = await Promise.all([
    fetchRegion(TAMIL_NADU_CENTER, TAMIL_NADU_BOUNDS, "tamil-nadu", apiKey),
    fetchRegion(BENGALURU_CENTER, BENGALURU_BOUNDS, "bengaluru", apiKey),
  ]);

  // De-dupe by id in case of any overlap between the two queries.
  const byId = new Map<string, CoverageStation>();
  for (const s of [...tamilNadu, ...bengaluru]) {
    byId.set(s.id, s);
  }
  return Array.from(byId.values());
}

async function readCache(): Promise<{ stations: CoverageStation[]; fetchedAt: number } | null> {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeCache(stations: CoverageStation[]): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(
      CACHE_FILE,
      JSON.stringify({ stations, fetchedAt: Date.now() }, null, 2),
      "utf-8",
    );
  } catch (err) {
    console.error("Failed to write station coverage cache:", err);
  }
}

/**
 * Returns the cached Tamil Nadu + Bengaluru station dataset, refreshing it
 * from Open Charge Map only when the on-disk cache is missing or stale.
 * Survives dev-server restarts, unlike a purely in-memory cache.
 */
export async function getStationCoverage(): Promise<{
  stations: CoverageStation[];
  stale: boolean;
  error: string | null;
}> {
  const cached = await readCache();
  const isFresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

  if (isFresh) {
    return { stations: cached!.stations, stale: false, error: null };
  }

  try {
    const stations = await fetchFresh();
    await writeCache(stations);
    return { stations, stale: false, error: null };
  } catch (err) {
    console.error("Failed to fetch fresh station coverage:", err);
    if (cached) {
      // Serve stale data rather than nothing.
      return { stations: cached.stations, stale: true, error: (err as Error).message };
    }
    return { stations: [], stale: true, error: (err as Error).message };
  }
}