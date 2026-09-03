import { NextResponse } from "next/server";
import { emptyQuerySchema } from "@/lib/api/schemas";
import { apiGuard, corsOptions, parseQuery, withCors } from "@/lib/api/security";
import { recommendedChargingWindows } from "@/lib/models/grid";
import { getChargingProvider } from "@/lib/services/charging-provider";
import { simulationNow } from "@/lib/store/simulation";

export const dynamic = "force-dynamic";
export async function OPTIONS(req: Request) { return corsOptions(req); }
export async function GET(req: Request) {
  const blocked = apiGuard(req);
  if (blocked) return blocked;
  const parsed = parseQuery(req, emptyQuerySchema);
  if (parsed.response) return withCors(req, parsed.response);
  const stations = await getChargingProvider().getStations();
  const hour = new Date(simulationNow().getTime() + 330 * 60_000).getHours();
  return withCors(req, NextResponse.json({ layer: "Grid Intelligence — Prototype Simulation", disclaimer: "No live DISCOM SCADA or renewable feed is connected.", windows: recommendedChargingWindows(stations, hour) }));
}
