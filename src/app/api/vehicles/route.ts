import { NextResponse } from "next/server";
import { emptyQuerySchema } from "@/lib/api/schemas";
import { apiGuard, corsOptions, parseQuery, withCors } from "@/lib/api/security";
import { VEHICLES } from "@/lib/data/vehicles";

export async function OPTIONS(req: Request) { return corsOptions(req); }
export async function GET(req: Request) {
  const blocked = apiGuard(req);
  if (blocked) return blocked;
  const parsed = parseQuery(req, emptyQuerySchema);
  if (parsed.response) return withCors(req, parsed.response);
  return withCors(req, NextResponse.json({ vehicles: VEHICLES }));
}
