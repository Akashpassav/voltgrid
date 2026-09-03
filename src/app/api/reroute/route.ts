import { NextResponse } from "next/server";
import { rerouteSchema } from "@/lib/api/schemas";
import { apiGuard, corsOptions, parseJsonBody, withCors } from "@/lib/api/security";
import { DEMO_PRIMARY_STATION } from "@/lib/data/stations";
import { rerouteTrip } from "@/lib/services/optimize";
import { failStation } from "@/lib/store/simulation";

export const dynamic = "force-dynamic";
export async function OPTIONS(req: Request) { return corsOptions(req); }

export async function POST(req: Request) {
  const blocked = apiGuard(req, 30);
  if (blocked) return blocked;
  const parsed = await parseJsonBody(req, rerouteSchema);
  if (parsed.response) return withCors(req, parsed.response);
  const failed = parsed.data!.failedStationId ?? DEMO_PRIMARY_STATION;
  failStation(failed);
  const result = await rerouteTrip(parsed.data!.trip, failed);
  return withCors(req, NextResponse.json({ ...result, notification: result.ok ? { title: `⚠ Charger ${failed} became unavailable.`, body: result.route.chargingStops[0] ? `🔄 Route recalculated. New charging stop: ${result.route.chargingStops[0].stationId}. Route confidence: ${result.route.confidence.score}%.` : "🔄 Route recalculated without a charging stop." } : undefined }, { status: result.ok ? 200 : 422 }));
}
