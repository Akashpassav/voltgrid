import { NextResponse } from "next/server";
import { recommendedChargingWindows } from "@/lib/models/grid";
import { getChargingProvider } from "@/lib/services/charging-provider";
import { simulationNow } from "@/lib/store/simulation";

export const dynamic = "force-dynamic";

export async function GET() {
  const stations = await getChargingProvider().getStations();
  const hour = new Date(simulationNow().getTime() + 330 * 60_000).getHours();
  return NextResponse.json({
    layer: "Grid Intelligence — Prototype Simulation",
    disclaimer: "No live DISCOM SCADA or renewable feed is connected.",
    windows: recommendedChargingWindows(stations, hour),
  });
}
