import { NextResponse } from "next/server";
import { predictSchema } from "@/lib/api/schemas";
import { apiGuard, corsOptions, parseJsonBody, withCors } from "@/lib/api/security";
import { predictAvailability } from "@/lib/models/prediction";
import { getChargingProvider } from "@/lib/services/charging-provider";
import { simulationNow } from "@/lib/store/simulation";
import { addMinutes } from "@/lib/utils/time";

export const dynamic = "force-dynamic";
export async function OPTIONS(req: Request) { return corsOptions(req); }

export async function POST(req: Request) {
  const blocked = apiGuard(req);
  if (blocked) return blocked;
  const parsed = await parseJsonBody(req, predictSchema);
  if (parsed.response) return withCors(req, parsed.response);
  const station = await getChargingProvider().getStationStatus(parsed.data!.stationId);
  if (!station) return withCors(req, NextResponse.json({ error: "Station not found" }, { status: 404 }));
  const eta = parsed.data!.etaMinutesFromNow ?? 25;
  const now = simulationNow();
  const ist = new Date(now.getTime() + 330 * 60_000);
  const pred = predictAvailability({ station, hour: ist.getHours(), weekday: ist.getDay(), etaMinutesFromNow: eta });
  pred.expectedArrivalIso = addMinutes(now, eta).toISOString();
  return withCors(req, NextResponse.json({ prediction: pred, station }));
}
