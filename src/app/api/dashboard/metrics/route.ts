import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/services/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const metrics = await getDashboardMetrics();
  return NextResponse.json({
    metrics,
    labels: {
      status: "SIMULATED LIVE DATA",
      stations: "REAL / STATIC DATA",
      grid: "Grid Intelligence — Prototype Simulation",
    },
  });
}
