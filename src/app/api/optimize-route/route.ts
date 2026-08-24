import { NextResponse } from "next/server";
import { tripRequestSchema } from "@/lib/api/schemas";
import { optimizeTrip } from "@/lib/services/optimize";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = tripRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_BATTERY",
          message: parsed.error.issues[0]?.message ?? "Invalid trip request.",
          suggestions: ["Check origin, destination, vehicle and battery percentage."],
        },
        { status: 400 },
      );
    }
    const result = await optimizeTrip(parsed.data);
    const status = result.ok ? 200 : 422;
    return NextResponse.json(result, { status });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "NO_ROUTE",
        message: "Routing failed unexpectedly. The corridor graph may be unavailable.",
        suggestions: ["Retry, or reset the simulation from the demo panel."],
      },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const originId = searchParams.get("originId");
  const destinationId = searchParams.get("destinationId");
  const vehicleId = searchParams.get("vehicleId") ?? "ather-450x";
  const socPercent = Number(searchParams.get("socPercent") ?? "68");
  const preference = (searchParams.get("preference") ?? "fastest") as
    | "fastest"
    | "efficient"
    | "reliability";
  if (!originId || !destinationId) {
    return NextResponse.json({ error: "originId and destinationId required" }, { status: 400 });
  }
  const result = await optimizeTrip({
    originId,
    destinationId,
    vehicleId,
    socPercent,
    preference,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
