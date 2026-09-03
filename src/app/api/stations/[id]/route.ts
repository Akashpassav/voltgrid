import { NextResponse } from "next/server";
import { stationIdPathSchema } from "@/lib/api/schemas";
import { apiGuard, corsOptions, withCors } from "@/lib/api/security";
import { getChargingProvider } from "@/lib/services/charging-provider";

export const dynamic = "force-dynamic";
export async function OPTIONS(req: Request) { return corsOptions(req); }
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const blocked = apiGuard(req);
  if (blocked) return blocked;
  const raw = await ctx.params;
  const parsed = stationIdPathSchema.safeParse(raw);
  if (!parsed.success) return withCors(req, NextResponse.json({ error: "Invalid station id" }, { status: 400 }));
  const station = await getChargingProvider().getStationStatus(parsed.data.id);
  if (!station) return withCors(req, NextResponse.json({ error: "Station not found" }, { status: 404 }));
  return withCors(req, NextResponse.json({ station }));
}
