import { NextResponse } from "next/server";
import { emptyQuerySchema } from "@/lib/api/schemas";
import { apiGuard, corsOptions, parseQuery, withCors } from "@/lib/api/security";

let cache: { data: unknown[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface OCMConnection { ConnectionType?: { Title?: string }; PowerKW?: number }
interface OCMPoi {
  ID: number;
  AddressInfo: { Title: string; Latitude: number; Longitude: number; AddressLine1?: string; Town?: string };
  OperatorInfo?: { Title?: string };
  Connections?: OCMConnection[];
  StatusType?: { IsOperational?: boolean };
}

export async function OPTIONS(req: Request) { return corsOptions(req); }
export async function GET(req: Request) {
  const blocked = apiGuard(req, 10);
  if (blocked) return blocked;
  const parsed = parseQuery(req, emptyQuerySchema);
  if (parsed.response) return withCors(req, parsed.response);

  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return withCors(req, NextResponse.json({ stations: cache.data, cached: true }));
  }

  const apiKey = process.env.OCM_API_KEY;
  if (!apiKey) {
    return withCors(req, NextResponse.json({ stations: [], error: "Open Charge Map is not configured on the server." }, { status: 500 }));
  }

  const url = new URL("https://api.openchargemap.io/v3/poi/");
  url.searchParams.set("output", "json");
  url.searchParams.set("countrycode", "IN");
  url.searchParams.set("latitude", "11.1271");
  url.searchParams.set("longitude", "78.6569");
  url.searchParams.set("distance", "600");
  url.searchParams.set("distanceunit", "KM");
  url.searchParams.set("maxresults", "500");
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString(), { headers: { "X-API-Key": apiKey }, cache: "no-store" });
    if (!res.ok) throw new Error(`OCM responded with ${res.status}`);
    const raw: OCMPoi[] = await res.json();
    const normalized = raw
      .filter((p) => Number.isFinite(p.AddressInfo?.Latitude) && Number.isFinite(p.AddressInfo?.Longitude))
      .map((p) => {
        const bestConnection = p.Connections?.[0];
        return {
          id: `ocm-${p.ID}`,
          name: p.AddressInfo.Title || "Unnamed station",
          latitude: p.AddressInfo.Latitude,
          longitude: p.AddressInfo.Longitude,
          operator: p.OperatorInfo?.Title || "Unknown operator",
          status: p.StatusType?.IsOperational === false ? "offline" : "available",
          availableConnectors: p.Connections?.length ?? 1,
          totalConnectors: p.Connections?.length ?? 1,
          powerKW: bestConnection?.PowerKW ?? 0,
          estimatedQueueMinutes: 0,
          pricePerKWh: 0,
          predictedAvailability: p.StatusType?.IsOperational === false ? 0 : 0.8,
          source: "openchargemap" as const,
        };
      });
    cache = { data: normalized, fetchedAt: Date.now() };
    return withCors(req, NextResponse.json({ stations: normalized, cached: false }));
  } catch (err) {
    console.error("Failed to fetch Open Charge Map data:", err);
    if (cache) return withCors(req, NextResponse.json({ stations: cache.data, cached: true, stale: true }));
    return withCors(req, NextResponse.json({ stations: [], error: "Unable to reach Open Charge Map." }, { status: 502 }));
  }
}
