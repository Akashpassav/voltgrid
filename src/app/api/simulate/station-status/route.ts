import { NextResponse } from "next/server";
import { simulateStatusSchema } from "@/lib/api/schemas";
import { failStation, getScenario, patchScenario } from "@/lib/store/simulation";
import { getChargingProvider } from "@/lib/services/charging-provider";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = simulateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { stationId, action } = parsed.data;
  if (action === "fail") {
    failStation(stationId);
  } else if (action === "restore") {
    const current = getScenario();
    patchScenario({
      failedStationIds: current.failedStationIds.filter((id) => id !== stationId),
    });
  }
  const station = await getChargingProvider().getStationStatus(stationId);
  return NextResponse.json({
    scenario: getScenario(),
    station,
    notice: "SIMULATED LIVE DATA — this is not a real CPO outage.",
  });
}
