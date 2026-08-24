import type { Coordinates, LiveStation, RouteConfidence, OptimizedRoute } from "@/lib/types";
import { haversineKm } from "@/lib/utils/geo";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function computeRouteConfidence(
  route: Pick<
    OptimizedRoute,
    | "arrivalSocPercent"
    | "minSocPercent"
    | "chargingStops"
    | "distanceKm"
    | "vehicle"
    | "startSocPercent"
  >,
  nearbyStations: LiveStation[],
  lastPoint: Coordinates,
  trafficUncertainty: number,
): RouteConfidence {
  const reserve = route.vehicle.safetyReservePercent;
  const socMargin = clamp01((route.minSocPercent - reserve) / 25);
  const arrivalMargin = clamp01((route.arrivalSocPercent - reserve) / 30);

  const stopAvail =
    route.chargingStops.length === 0
      ? 0.9
      : route.chargingStops.reduce((s, st) => s + st.predictedAvailability, 0) /
        route.chargingStops.length;

  const alternatives = nearbyStations.filter((s) => {
    if (s.status === "offline" || s.status === "maintenance") return false;
    const d = haversineKm(lastPoint, { lat: s.latitude, lng: s.longitude });
    return d <= 12;
  }).length;
  const altScore = clamp01(alternatives / 4);

  const trafficScore = clamp01(1 - (trafficUncertainty - 1) / 0.55);

  const nextChargerKm = nearestReachableKm(nearbyStations, lastPoint);
  const chargerDistanceScore = nextChargerKm === Infinity ? 0 : clamp01(1 - nextChargerKm / 20);

  const queue = route.chargingStops[0]?.queueMinutes ?? 0;
  const queueScore = clamp01(1 - queue / 25);

  const weighted =
    100 *
    (0.28 * socMargin +
      0.18 * arrivalMargin +
      0.24 * stopAvail +
      0.12 * altScore +
      0.1 * trafficScore +
      0.05 * chargerDistanceScore +
      0.03 * queueScore);

  const score = Math.round(Math.min(97, Math.max(18, weighted)));
  const level: RouteConfidence["level"] =
    score >= 80 ? "HIGH" : score >= 58 ? "MODERATE" : "LOW";

  const altNote =
    alternatives === 0
      ? "no alternative chargers nearby"
      : `${alternatives} alternative charging station${alternatives === 1 ? "" : "s"} within reach`;

  const explanation =
    level === "HIGH"
      ? `High confidence — your route keeps about ${Math.max(0, route.minSocPercent - reserve).toFixed(0)}% battery above the safety reserve and has ${altNote}.`
      : level === "MODERATE"
        ? `Moderate confidence — you can complete the trip, but the battery margin is tighter and ${altNote}. Watch the recommended stop.`
        : `Low confidence — remaining SOC is close to the ${reserve}% reserve and charger options are limited. Consider charging earlier or reducing speed.`;

  return {
    score,
    level,
    explanation,
    factors: [
      {
        name: "SOC margin vs reserve",
        score: Math.round(socMargin * 100),
        note: `Lowest predicted SOC ${route.minSocPercent.toFixed(0)}% (reserve ${reserve}%)`,
      },
      {
        name: "Charger availability at ETA",
        score: Math.round(stopAvail * 100),
        note:
          route.chargingStops.length === 0
            ? "No charging stop required"
            : `${Math.round(stopAvail * 100)}% predicted availability`,
      },
      {
        name: "Alternative chargers",
        score: Math.round(altScore * 100),
        note: altNote,
      },
      {
        name: "Traffic uncertainty",
        score: Math.round(trafficScore * 100),
        note: `Traffic multiplier ×${trafficUncertainty.toFixed(2)}`,
      },
      {
        name: "Distance to a charger",
        score: Math.round(chargerDistanceScore * 100),
        note:
          nextChargerKm === Infinity
            ? "No charger mapped nearby"
            : `Nearest usable charger ${nextChargerKm.toFixed(1)} km`,
      },
    ],
  };
}

function nearestReachableKm(stations: LiveStation[], from: Coordinates): number {
  let best = Infinity;
  for (const s of stations) {
    if (s.status === "offline" || s.status === "maintenance") continue;
    const d = haversineKm(from, { lat: s.latitude, lng: s.longitude });
    if (d < best) best = d;
  }
  return best;
}
