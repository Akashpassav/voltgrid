import { NextResponse } from "next/server";
import { scenarioSchema } from "@/lib/api/schemas";
import { DEMO_PRIMARY_STATION } from "@/lib/data/stations";
import { optimizeTrip, rerouteTrip } from "@/lib/services/optimize";
import {
  failStation,
  getScenario,
  patchScenario,
  resetSimulation,
} from "@/lib/store/simulation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = scenarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid scenario action" }, { status: 400 });
  }

  const { action, stationId, trip } = parsed.data;
  let message = "";

  switch (action) {
    case "reset":
      resetSimulation();
      message = "Simulation reset. Demo clock 3:40 PM IST. All chargers restored.";
      break;
    case "fail-recommended":
    case "fail-station": {
      const id = stationId ?? DEMO_PRIMARY_STATION;
      failStation(id);
      message = `Simulated failure: ${id} is now OFFLINE.`;
      if (trip) {
        const result = await rerouteTrip(trip, id);
        return NextResponse.json({
          scenario: getScenario(),
          message,
          result,
        });
      }
      break;
    }
    case "high-demand":
      patchScenario({ highDemand: true, demandMultiplier: 1.45, label: "High demand" });
      message = "High-demand evening pattern applied. Queues and occupancy rise.";
      break;
    case "traffic":
      patchScenario({ trafficMultiplier: 1.35, label: "Traffic increase" });
      message = "Traffic multiplier raised to 1.35× on the corridor graph.";
      break;
    case "demo-clock":
      patchScenario({ demoClockMinutes: 15 * 60 + 40, label: "SIH demo clock 3:40 PM IST" });
      message = "Demo clock frozen at 3:40 PM IST for a reproducible presentation.";
      break;
    case "live-clock":
      patchScenario({ demoClockMinutes: null, label: "Live IST clock" });
      message = "Using the live Asia/Kolkata clock.";
      break;
    default:
      break;
  }

  const result = trip ? await optimizeTrip(trip) : undefined;
  return NextResponse.json({
    scenario: getScenario(),
    message,
    result,
  });
}

export async function GET() {
  return NextResponse.json({ scenario: getScenario() });
}
