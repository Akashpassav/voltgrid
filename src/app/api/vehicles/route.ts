import { NextResponse } from "next/server";
import { VEHICLES } from "@/lib/data/vehicles";

export async function GET() {
  return NextResponse.json({ vehicles: VEHICLES });
}
