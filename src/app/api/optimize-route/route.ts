import { NextResponse } from "next/server";
import { optimizeQuerySchema, tripRequestSchema } from "@/lib/api/schemas";
import { apiGuard, corsOptions, parseJsonBody, parseQuery, withCors } from "@/lib/api/security";
import { optimizeTrip } from "@/lib/services/optimize";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) { return corsOptions(req); }

export async function POST(req: Request) {
  const blocked = apiGuard(req);
  if (blocked) return blocked;
  const parsed = await parseJsonBody(req, tripRequestSchema);
  if (parsed.response) return withCors(req, parsed.response);
  try {
    const result = await optimizeTrip(parsed.data!);
    const status = result.ok ? 200 : 422;
    return withCors(req, NextResponse.json(result, { status }));
  } catch {
    return withCors(req, NextResponse.json({ ok: false, code: "NO_ROUTE", message: "Routing failed unexpectedly.", suggestions: ["Retry, or reset the simulation."] }, { status: 500 }));
  }
}

export async function GET(req: Request) {
  const blocked = apiGuard(req);
  if (blocked) return blocked;
  const parsed = parseQuery(req, optimizeQuerySchema);
  if (parsed.response) return withCors(req, parsed.response);
  try {
    const result = await optimizeTrip(parsed.data!);
    return withCors(req, NextResponse.json(result, { status: result.ok ? 200 : 422 }));
  } catch {
    return withCors(req, NextResponse.json({ ok: false, code: "NO_ROUTE", message: "Routing failed unexpectedly." }, { status: 500 }));
  }
}
