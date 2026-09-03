import { NextResponse } from "next/server";
import { emptyQuerySchema } from "@/lib/api/schemas";
import { apiGuard, corsOptions, parseQuery, withCors } from "@/lib/api/security";
import { getDashboardMetrics } from "@/lib/services/dashboard";

export const dynamic = "force-dynamic";
export async function OPTIONS(req: Request) { return corsOptions(req); }
export async function GET(req: Request) {
  const blocked = apiGuard(req);
  if (blocked) return blocked;
  const parsed = parseQuery(req, emptyQuerySchema);
  if (parsed.response) return withCors(req, parsed.response);
  const metrics = await getDashboardMetrics();
  return withCors(req, NextResponse.json({ metrics, labels: { status: "SIMULATED LIVE DATA", stations: "REAL / STATIC DATA", grid: "Grid Intelligence — Prototype Simulation" } }));
}
