import { NextResponse } from "next/server";
import { scenarioSchema, emptyQuerySchema } from "@/lib/api/schemas";
import { apiGuard, corsOptions, parseJsonBody, parseQuery, withCors } from "@/lib/api/security";
import { DEMO_PRIMARY_STATION } from "@/lib/data/stations";
import { optimizeTrip, rerouteTrip } from "@/lib/services/optimize";
import { failStation, getScenario, patchScenario, resetSimulation } from "@/lib/store/simulation";

export const dynamic = "force-dynamic";
export async function OPTIONS(req: Request) { return corsOptions(req); }

export async function POST(req: Request) {
  const blocked = apiGuard(req, 30);
  if (blocked) return blocked;
  const parsed = await parseJsonBody(req, scenarioSchema);
  if (parsed.response) return withCors(req, parsed.response);
  const { action, stationId, trip } = parsed.data!;
  let message = "";
  switch (action) {
    case "reset": resetSimulation(); message = "Simulation reset. Demo clock 3:40 PM IST. All chargers restored."; break;
    case "fail-recommended":
    case "fail-station": {
      const id = stationId ?? DEMO_PRIMARY_STATION;
      failStation(id); message = `Simulated failure: ${id} is now OFFLINE.`;
      if (trip) return withCors(req, NextResponse.json({ scenario: getScenario(), message, result: await rerouteTrip(trip, id) }));
      break;
    }
    case "high-demand": patchScenario({ highDemand: true, demandMultiplier: 1.45, label: "High demand" }); message = "High-demand evening pattern applied. Queues and occupancy rise."; break;
    case "traffic": patchScenario({ trafficMultiplier: 1.35, label: "Traffic increase" }); message = "Traffic multiplier raised to 1.35× on the corridor graph."; break;
    case "demo-clock": patchScenario({ demoClockMinutes: 15 * 60 + 40, label: "SIH demo clock 3:40 PM IST" }); message = "Demo clock frozen at 3:40 PM IST for a reproducible presentation."; break;
    case "live-clock": patchScenario({ demoClockMinutes: null, label: "Live IST clock" }); message = "Using the live Asia/Kolkata clock."; break;
  }
  const result = trip ? await optimizeTrip(trip) : undefined;
  return withCors(req, NextResponse.json({ scenario: getScenario(), message, result }));
}

export async function GET(req: Request) {
  const blocked = apiGuard(req);
  if (blocked) return blocked;
  const parsed = parseQuery(req, emptyQuerySchema);
  if (parsed.response) return withCors(req, parsed.response);
  return withCors(req, NextResponse.json({ scenario: getScenario() }));
}
