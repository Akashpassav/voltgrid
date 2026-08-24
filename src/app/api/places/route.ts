import { NextResponse } from "next/server";
import { PLACES, searchPlaces } from "@/lib/data/places";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const places = q ? searchPlaces(q) : PLACES;
  return NextResponse.json({ places });
}
