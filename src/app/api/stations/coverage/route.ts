import { NextResponse } from "next/server";
import { getStationCoverage } from "@/lib/services/station-coverage";

export const dynamic = "force-dynamic";

export async function GET() {
  const { stations, stale, error } = await getStationCoverage();
  return NextResponse.json({ stations, stale, error });
}