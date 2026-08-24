import { NextResponse } from "next/server";
import { rerouteSchema } from "@/lib/api/schemas";
import { DEMO_PRIMARY_STATION } from "@/lib/data/stations";
import { rerouteTrip } from "@/lib/services/optimize";
import { failStation } from "@/lib/store/simulation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = rerouteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reroute payload" }, { status: 400 });
  }
  const failed = parsed.data.failedStationId ?? DEMO_PRIMARY_STATION;
  failStation(failed);
  const result = await rerouteTrip(parsed.data.trip, failed);
  return NextResponse.json(
    {
      ...result,
      notification: result.ok
        ? {
            title: `⚠ Charger ${failed} became unavailable.`,
            body: result.route.chargingStops[0]
              ? `🔄 Route recalculated. New charging stop: ${result.route.chargingStops[0].stationId}. Route confidence: ${result.route.confidence.score}%.`
              : "🔄 Route recalculated without a charging stop.",
          }
        : undefined,
    },
    { status: result.ok ? 200 : 422 },
  );
}
