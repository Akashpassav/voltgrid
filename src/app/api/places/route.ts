import { NextResponse } from "next/server";
import { placesQuerySchema } from "@/lib/api/schemas";
import { apiGuard, corsOptions, parseQuery, withCors } from "@/lib/api/security";
import { PLACES, searchPlaces } from "@/lib/data/places";

export async function OPTIONS(req: Request) { return corsOptions(req); }
export async function GET(req: Request) {
  const blocked = apiGuard(req);
  if (blocked) return blocked;
  const parsed = parseQuery(req, placesQuerySchema);
  if (parsed.response) return withCors(req, parsed.response);
  const q = parsed.data!.q;
  return withCors(req, NextResponse.json({ places: q ? searchPlaces(q) : PLACES }));
}
