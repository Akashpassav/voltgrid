import { NextResponse } from "next/server";
import { emptyQuerySchema } from "@/lib/api/schemas";
import { apiGuard, corsOptions, parseQuery, withCors } from "@/lib/api/security";
import { getChargingProvider } from "@/lib/services/charging-provider";
import { bumpTick } from "@/lib/store/simulation";

export const dynamic = "force-dynamic";
export async function OPTIONS(req: Request) { return corsOptions(req); }
export async function GET(req: Request) {
  const blocked = apiGuard(req);
  if (blocked) return blocked;
  const parsed = parseQuery(req, emptyQuerySchema);
  if (parsed.response) return withCors(req, parsed.response);
  bumpTick();
  const stations = await getChargingProvider().getStations();
  return withCors(req, NextResponse.json({ count: stations.length, provenance: { locations: "REAL / STATIC DATA", status: "SIMULATED LIVE DATA" }, stations }));
}
