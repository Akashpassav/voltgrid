import { NextResponse } from "next/server";
import { simulateStatusSchema, emptyQuerySchema } from "@/lib/api/schemas";
import { apiGuard, corsOptions, parseJsonBody, parseQuery, withCors } from "@/lib/api/security";
import { failStation, getScenario, patchScenario } from "@/lib/store/simulation";
import { getChargingProvider } from "@/lib/services/charging-provider";

export const dynamic = "force-dynamic";
export async function OPTIONS(req: Request) { return corsOptions(req); }

export async function POST(req: Request) {
  const blocked = apiGuard(req, 30);
  if (blocked) return blocked;
  const parsed = await parseJsonBody(req, simulateStatusSchema);
  if (parsed.response) return withCors(req, parsed.response);
  const { stationId, action } = parsed.data!;
  if (action === "fail") failStation(stationId);
  else if (action === "restore") {
    const current = getScenario();
    patchScenario({ failedStationIds: current.failedStationIds.filter((id) => id !== stationId) });
  }
  const station = await getChargingProvider().getStationStatus(stationId);
  return withCors(req, NextResponse.json({ scenario: getScenario(), station, notice: "SIMULATED LIVE DATA — this is not a real CPO outage." }));
}

export async function GET(req: Request) {
  const blocked = apiGuard(req);
  if (blocked) return blocked;
  const parsed = parseQuery(req, emptyQuerySchema);
  if (parsed.response) return withCors(req, parsed.response);
  return withCors(req, NextResponse.json({ scenario: getScenario() }));
}
