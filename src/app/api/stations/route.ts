import { NextResponse } from "next/server";
import { getChargingProvider } from "@/lib/services/charging-provider";
import { bumpTick } from "@/lib/store/simulation";

export const dynamic = "force-dynamic";

export async function GET() {
  bumpTick();
  const stations = await getChargingProvider().getStations();
  return NextResponse.json({
    count: stations.length,
    provenance: {
      locations: "REAL / STATIC DATA",
      status: "SIMULATED LIVE DATA",
    },
    stations,
  });
}
