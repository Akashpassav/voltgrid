import { NextResponse } from "next/server";
import { getChargingProvider } from "@/lib/services/charging-provider";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const station = await getChargingProvider().getStationStatus(id);
  if (!station) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }
  return NextResponse.json({ station });
}
