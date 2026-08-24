import { NextResponse } from "next/server";
import { predictSchema } from "@/lib/api/schemas";
import { predictAvailability } from "@/lib/models/prediction";
import { getChargingProvider } from "@/lib/services/charging-provider";
import { simulationNow } from "@/lib/store/simulation";
import { addMinutes } from "@/lib/utils/time";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = predictSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const station = await getChargingProvider().getStationStatus(parsed.data.stationId);
  if (!station) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }
  const eta = parsed.data.etaMinutesFromNow ?? 25;
  const now = simulationNow();
  const ist = new Date(now.getTime() + 330 * 60_000);
  const pred = predictAvailability({
    station,
    hour: ist.getHours(),
    weekday: ist.getDay(),
    etaMinutesFromNow: eta,
  });
  pred.expectedArrivalIso = addMinutes(now, eta).toISOString();
  return NextResponse.json({ prediction: pred, station });
}
