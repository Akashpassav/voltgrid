/**
 * VoltGrid optimisation pipeline
 *
 * User trip → RoutingEngine (OSRM, state-wide)
 *           → EV energy model (SOC never below safety reserve)
 *           → Charging station query (MockChargingProvider / future OCPI)
 *           → Availability prediction (logistic regression v1)
 *           → Charging-stop scoring (configurable weights; closest is not automatic)
 *           → Route confidence → recommended route
 */
import { getPlace } from "@/lib/data/places";
import { getVehicle } from "@/lib/data/vehicles";
import { rankStations } from "@/lib/algorithms/charging-stop";
import {
  routeBetween,
  routeViaWaypoints,
  type RoutedPath,
  type RouteWaypoint,
} from "@/lib/services/osrm-routing";
import { computeRouteConfidence } from "@/lib/models/confidence";
import {
  chargeTimeMinutes,
  describeBattery,
  energyForDistanceKWh,
  socAfterEnergy,
} from "@/lib/models/battery";
import { gridHintForTrip } from "@/lib/models/grid";
import { getChargingProvider } from "@/lib/services/charging-provider";
import { getScenario, isStationOnline, simulationNow } from "@/lib/store/simulation";
import type {
  ChargingStopPlan,
  Coordinates,
  LiveStation,
  OptimizeResponse,
  OptimizedRoute,
  RouteLeg,
  TripRequest,
  Vehicle,
} from "@/lib/types";
import { addMinutes } from "@/lib/utils/time";
import { haversineKm } from "@/lib/utils/geo";

// Caps how many nearby candidate stations get their own OSRM route computed
// per request for the single-stop search. State-wide OSRM routing can
// otherwise trigger many parallel requests to OSRM's public server on a
// long trip. Candidates are spread across the route's length (see
// pickSpreadAcrossRoute) rather than picked by score alone, so long trips
// get coverage near both ends, not just wherever the highest-rated
// stations happen to sit.
const MAX_CANDIDATE_STATIONS = 18;

// findTwoStops explores s1 × s2 pairs — this must stay much smaller than
// MAX_CANDIDATE_STATIONS, since the search space grows quadratically and
// each pair needs its own OSRM calls.
const TWO_STOP_S1_LIMIT = 5;
const TWO_STOP_S2_LIMIT = 6;

interface SimLeg {
  path: RoutedPath;
  energyKWh: number;
  socStart: number;
  socEnd: number;
}

function averageTerrain(path: RoutedPath): number {
  return path.meanTerrain || 1;
}

function simulatePath(
  vehicle: Vehicle,
  path: RoutedPath,
  startSoc: number,
  weatherFactor: number,
): SimLeg {
  const energy = energyForDistanceKWh(vehicle, path.distanceKm, {
    terrainFactor: averageTerrain(path),
    trafficFactor: path.meanTraffic,
    weatherFactor,
  });
  const socEnd = socAfterEnergy(vehicle, startSoc, energy);
  return { path, energyKWh: energy, socStart: startSoc, socEnd };
}

function feasible(vehicle: Vehicle, socEnd: number): boolean {
  return socEnd >= vehicle.safetyReservePercent - 0.4;
}

function targetDepartSoc(
  vehicle: Vehicle,
  arriveSoc: number,
  remainingEnergyKWh: number,
  desiredArrival: number,
): number {
  const needPercent = (remainingEnergyKWh / vehicle.batteryKWh) * 100 + desiredArrival;
  // Charge enough to finish, but never leave a 2W rider at a trickle — 72%+ is typical.
  const want = Math.max(arriveSoc, Math.min(88, Math.max(needPercent + 10, 80)));
  return Number(want.toFixed(1));
}

function placeWaypoint(id: string, name: string, coords: Coordinates): RouteWaypoint {
  return { id, name, latitude: coords.lat, longitude: coords.lng };
}

function stationWaypoint(station: LiveStation): RouteWaypoint {
  return {
    id: `S-${station.id}`,
    name: station.name,
    latitude: station.latitude,
    longitude: station.longitude,
    stationId: station.id,
  };
}

async function pathViaStations(
  originWp: RouteWaypoint,
  destWp: RouteWaypoint,
  stations: LiveStation[],
  traffic: number,
): Promise<RoutedPath | null> {
  const waypoints = [originWp, ...stations.map(stationWaypoint), destWp];
  return routeViaWaypoints(waypoints, traffic);
}

/** Extracts one leg of a multi-waypoint OSRM route as a standalone RoutedPath,
 * so candidate scoring can reuse a single via-route's data instead of making
 * extra OSRM calls for each sub-segment. */
function subPath(via: RoutedPath, legIndex: number): RoutedPath {
  const leg = via.legs[legIndex];
  return {
    nodes: [leg.from, leg.to],
    legs: [leg],
    distanceKm: leg.edge.distanceKm,
    baseMinutes: leg.edge.durationMinutes * via.meanTraffic,
    meanTerrain: leg.edge.terrainFactor,
    meanTraffic: via.meanTraffic,
    geometry: [],
  };
}

function nearPath(station: LiveStation, geometry: Coordinates[], maxKm = 4.2): boolean {
  return geometry.some(
    (p) => haversineKm(p, { lat: station.latitude, lng: station.longitude }) <= maxKm,
  );
}

/**
 * Selects up to `limit` stations, distributed across the route's length by
 * progress-along-path (not just by score), so long trips get candidates
 * near both the start and the end — not just wherever the best-rated
 * stations happen to sit. Uses wider buckets with up to 2 picks each,
 * since a single pick-per-bucket proved fragile: if the lone highest-scored
 * station in a segment was poorly positioned for a working route, the trip
 * could look wrongly unreachable even with a decent alternative nearby.
 */
function pickSpreadAcrossRoute(
  stations: LiveStation[],
  geometry: Coordinates[],
  limit: number,
): LiveStation[] {
  if (stations.length <= limit || geometry.length === 0) return stations;

  const withProgress = stations.map((s) => {
    let bestDist = Infinity;
    let bestIndex = 0;
    geometry.forEach((p, i) => {
      const d = haversineKm(p, { lat: s.latitude, lng: s.longitude });
      if (d < bestDist) {
        bestDist = d;
        bestIndex = i;
      }
    });
    return { station: s, progress: bestIndex / Math.max(1, geometry.length - 1) };
  });

  const bucketCount = Math.max(1, Math.ceil(limit / 2));
  const picksPerBucket = 2;
  const buckets: (typeof withProgress)[] = Array.from({ length: bucketCount }, () => []);
  withProgress.forEach((entry) => {
    const bucketIdx = Math.min(bucketCount - 1, Math.floor(entry.progress * bucketCount));
    buckets[bucketIdx].push(entry);
  });

  const picked: LiveStation[] = [];
  for (const bucket of buckets) {
    if (bucket.length === 0) continue;
    bucket.sort((a, b) => b.station.predictedAvailability - a.station.predictedAvailability);
    for (const entry of bucket.slice(0, picksPerBucket)) {
      picked.push(entry.station);
    }
  }

  // Buckets can be uneven (some empty, some with several stations) — if we
  // haven't filled the limit yet, backfill with the next-best remaining
  // candidates by score.
  if (picked.length < limit) {
    const pickedIds = new Set(picked.map((s) => s.id));
    const remaining = withProgress
      .filter((e) => !pickedIds.has(e.station.id))
      .sort((a, b) => b.station.predictedAvailability - a.station.predictedAvailability);
    for (const entry of remaining) {
      if (picked.length >= limit) break;
      picked.push(entry.station);
    }
  }

  return picked.slice(0, limit);
}

function simulateWithStops(
  vehicle: Vehicle,
  path: RoutedPath,
  startSoc: number,
  weather: number,
  stops: ChargingStopPlan[],
  trafficMultiplier: number,
): { legs: RouteLeg[]; geometry: Coordinates[]; energyKWh: number; drivingMinutes: number; arrivalSoc: number; minSoc: number } {
  const remaining = [...stops];
  let socCursor = startSoc;
  let minSoc = startSoc;
  let energyKWh = 0;
  let drivingMinutes = 0;
  const routeLegs: RouteLeg[] = [];
  const geometry: Coordinates[] = [];

  const consumeStop = (nodeId: string, stationId?: string): ChargingStopPlan | undefined => {
    const idx = remaining.findIndex(
      (s) => nodeId === `S-${s.stationId}` || stationId === s.stationId,
    );
    if (idx < 0) return undefined;
    return remaining.splice(idx, 1)[0];
  };

  for (const leg of path.legs) {
    const ctx = {
      terrainFactor: leg.edge.terrainFactor,
      trafficFactor: path.meanTraffic,
      weatherFactor: weather,
    };
    const e = energyForDistanceKWh(vehicle, leg.edge.distanceKm, ctx);
    const socStart = socCursor;
    socCursor = socAfterEnergy(vehicle, socCursor, e);
    minSoc = Math.min(minSoc, socCursor);
    energyKWh += e;
    const durationMin = leg.edge.durationMinutes * trafficMultiplier;
    drivingMinutes += durationMin;
    routeLegs.push({
      fromId: leg.from.id,
      toId: leg.to.id,
      fromName: leg.from.name,
      toName: leg.to.name,
      distanceKm: Number(leg.edge.distanceKm.toFixed(2)),
      durationMin: Number(durationMin.toFixed(1)),
      energyKWh: Number(e.toFixed(3)),
      socStart: Number(socStart.toFixed(1)),
      socEnd: Number(socCursor.toFixed(1)),
      geometry: [
        { lat: leg.from.latitude, lng: leg.from.longitude },
        { lat: leg.to.latitude, lng: leg.to.longitude },
      ],
    });
    geometry.push({ lat: leg.from.latitude, lng: leg.from.longitude });

    const stop = consumeStop(leg.to.id, leg.to.stationId);
    if (stop) {
      socCursor = stop.departSocPercent;
    }
  }
  if (path.nodes.length) {
    const last = path.nodes[path.nodes.length - 1];
    geometry.push({ lat: last.latitude, lng: last.longitude });
  }

  return {
    legs: routeLegs,
    geometry,
    energyKWh,
    drivingMinutes,
    arrivalSoc: socCursor,
    minSoc,
  };
}

export async function optimizeTrip(req: TripRequest): Promise<OptimizeResponse> {
  if (req.socPercent < 1 || req.socPercent > 100) {
    return {
      ok: false,
      code: "INVALID_BATTERY",
      message: "Battery percentage must be between 1 and 100.",
      suggestions: ["Enter a value such as 68 for a typical starting charge."],
    };
  }

  const vehicle = getVehicle(req.vehicleId);
  if (!vehicle) {
    return {
      ok: false,
      code: "INVALID_VEHICLE",
      message: "That vehicle is not in the VoltGrid catalogue.",
      suggestions: ["Choose an Indian electric 2-wheeler from the list."],
    };
  }

  const origin = getPlace(req.originId);
  const destination = getPlace(req.destinationId);
  if (!origin || !destination) {
    return {
      ok: false,
      code: "INVALID_PLACES",
      message: "Start or destination could not be resolved to a location.",
      suggestions: ["Pick a place from the list, search for one, or use your current location."],
    };
  }

  if (origin.id === destination.id) {
    return {
      ok: false,
      code: "NO_ROUTE",
      message: "Start and destination are the same place.",
      suggestions: ["Choose a different destination."],
    };
  }

  const scenario = getScenario();
  const traffic = scenario.trafficMultiplier;
  const weather = req.weatherFactor ?? 1;
  const desiredArrival = req.arrivalSocPercent ?? vehicle.safetyReservePercent;
  const from: Coordinates = { lat: origin.latitude, lng: origin.longitude };
  const to: Coordinates = { lat: destination.latitude, lng: destination.longitude };

  const originWp = placeWaypoint(origin.id, origin.name, from);
  const destWp = placeWaypoint(destination.id, destination.name, to);

  let direct: RoutedPath | null;
  try {
    direct = await routeBetween(originWp, destWp, traffic);
  } catch (err) {
    console.error("OSRM routing failed for direct trip:", err);
    direct = null;
  }
  if (!direct) {
    return {
      ok: false,
      code: "NO_ROUTE",
      message: "No route could be constructed between those points.",
      suggestions: ["Check that both locations are reachable by road, or try again."],
    };
  }

  const stations = await getChargingProvider().getStations();
  const now = simulationNow();

  const battery = describeBattery(vehicle, req.socPercent, {
    terrainFactor: direct.meanTerrain,
    trafficFactor: direct.meanTraffic,
    weatherFactor: weather,
  });

  const directSim = simulatePath(vehicle, direct, req.socPercent, weather);
  let chosenStops: ChargingStopPlan[] = [];
  let chosenPath = direct;
  const warnings: string[] = [];

  if (feasible(vehicle, directSim.socEnd) && directSim.socEnd >= desiredArrival - 1) {
    chosenPath = direct;
    chosenStops = [];
  } else {
    let online = stations.filter(
      (s) => isStationOnline(s) && nearPath(s, direct.geometry, 4.5),
    );

    // Bound how many candidates we send to OSRM individually, but spread the
    // selection across the route's length rather than picking a flat top-N
    // by score — otherwise a long trip can look falsely UNREACHABLE just
    // because the highest-rated stations all happen to cluster near one end.
    if (online.length > MAX_CANDIDATE_STATIONS) {
      online = pickSpreadAcrossRoute(online, direct.geometry, MAX_CANDIDATE_STATIONS);
    }

    if (online.length === 0) {
      return {
        ok: false,
        code: "ALL_CHARGERS_DOWN",
        message:
          "All nearby chargers are offline or in maintenance. Your current battery cannot safely reach the destination.",
        suggestions: [
          "Reset the simulation from the demo panel.",
          "Start with a higher state of charge.",
        ],
      };
    }

    const candidateResults = await Promise.all(
      online.map(async (station) => {
        const stationWp = stationWaypoint(station);
        let via: RoutedPath | null;
        try {
          via = await pathViaStations(originWp, destWp, [station], traffic);
        } catch (err) {
          console.error(`OSRM routing failed for candidate station ${station.id}:`, err);
          return null;
        }
        // Single OSRM call already gives us both legs' distance/duration —
        // no need for two extra network round-trips per candidate.
        if (!via || via.legs.length < 2) return null;
        const toStation = subPath(via, 0);
        const toDest = subPath(via, 1);

        const arrive = simulatePath(vehicle, toStation, req.socPercent, weather);
        if (!feasible(vehicle, arrive.socEnd)) return null;
        const remainingEnergy = energyForDistanceKWh(vehicle, toDest.distanceKm, {
          terrainFactor: toDest.meanTerrain,
          trafficFactor: toDest.meanTraffic,
          weatherFactor: weather,
        });
        const depart = targetDepartSoc(vehicle, arrive.socEnd, remainingEnergy, desiredArrival);
        const after = simulatePath(vehicle, toDest, depart, weather);
        if (!feasible(vehicle, after.socEnd)) return null;
        const detourKm = Math.max(0, via.distanceKm - direct.distanceKm);
        const detourMinutes = Math.max(0, via.baseMinutes - direct.baseMinutes);
        return {
          via,
          candidate: {
            station,
            detourKm,
            detourMinutes,
            arriveSocPercent: arrive.socEnd,
            distanceFromOriginKm: toStation.distanceKm,
            remainingToDestKm: toDest.distanceKm,
            predictedAvailability: station.predictedAvailability,
            preference: req.preference,
            vehicle,
            targetDepartSoc: depart,
          },
        };
      }),
    );

    const candidates = candidateResults
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .map((x) => x.candidate);
    const viaByStationId = new Map(
      candidateResults
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .map((x) => [x.candidate.station.id, x.via]),
    );

    const ranked = rankStations(candidates);
    const best = ranked[0];

    if (best) {
      const via = viaByStationId.get(best.stationId) ?? null;
      if (via) {
        chosenPath = via;
        chosenStops = [best];
        if (ranked.length > 1) {
          warnings.push(
            `Also considered ${ranked.length - 1} other reachable chargers. Next best: ${ranked[1].stationName} (score ${ranked[1].score}).`,
          );
        }
      }
    } else {
      const twoStop = await findTwoStops(
        vehicle,
        originWp,
        destWp,
        from,
        to,
        online,
        req,
        traffic,
        weather,
        desiredArrival,
        direct,
      );
      if (!twoStop) {
        return {
          ok: false,
          code: "UNREACHABLE",
          message:
            "Your current battery level cannot safely reach the destination. We found no reachable charger within the available range.",
          suggestions: [
            `Charge locally before starting — usable range is about ${battery.estimatedRangeKm.toFixed(0)} km.`,
            "Pick a closer destination.",
            "Choose a vehicle with a larger pack (Simple One / Ola S1 Pro).",
          ],
        };
      }
      chosenPath = twoStop.path;
      chosenStops = twoStop.stops;
      warnings.push("This trip needs two charging stops at the current battery level.");
    }
  }

  const simulated = simulateWithStops(
    vehicle,
    chosenPath,
    req.socPercent,
    weather,
    chosenStops,
    traffic,
  );
  const { legs: routeLegs, energyKWh, drivingMinutes, arrivalSoc, minSoc } = simulated;

  let elapsed = 0;
  const filledStops: ChargingStopPlan[] = [];
  for (const stop of chosenStops) {
    let toStop: RoutedPath | null = null;
    try {
      toStop = await routeBetween(originWp, stationWaypoint(stop as unknown as LiveStation), traffic);
    } catch (err) {
      console.error("OSRM routing failed while computing stop ETA:", err);
    }
    const driveMin = toStop?.baseMinutes ?? stop.detourMinutes;
    elapsed += driveMin;
    const eta = addMinutes(now, elapsed);
    const chargeMin = chargeTimeMinutes(vehicle, stop.arriveSocPercent, stop.departSocPercent, stop.powerKW);
    filledStops.push({
      ...stop,
      chargeMinutes: Math.round(chargeMin),
      etaIso: eta.toISOString(),
    });
    elapsed += chargeMin + stop.queueMinutes;
  }

  const chargingMinutes = filledStops.reduce((s, x) => s + x.chargeMinutes, 0);
  const queueMinutes = filledStops.reduce((s, x) => s + x.queueMinutes, 0);
  const totalMinutes = drivingMinutes + chargingMinutes + queueMinutes;
  const arrival = addMinutes(now, totalMinutes);

  const confidence = computeRouteConfidence(
    {
      arrivalSocPercent: arrivalSoc,
      minSocPercent: minSoc,
      chargingStops: filledStops,
      distanceKm: chosenPath.distanceKm,
      vehicle,
      startSocPercent: req.socPercent,
    },
    stations,
    to,
    chosenPath.meanTraffic,
  );

  if (filledStops.length === 0 && battery.estimatedRangeKm < chosenPath.distanceKm * 1.05) {
    warnings.push("You are close to the range limit. A charger on the route remains a useful safety net.");
  }

  const route: OptimizedRoute = {
    origin,
    destination,
    vehicle,
    preference: req.preference,
    distanceKm: Number(chosenPath.distanceKm.toFixed(1)),
    drivingMinutes: Math.round(drivingMinutes),
    chargingMinutes: Math.round(chargingMinutes),
    queueMinutes: Math.round(queueMinutes),
    totalMinutes: Math.round(totalMinutes),
    etaIso: arrival.toISOString(),
    energyKWh: Number(energyKWh.toFixed(2)),
    startSocPercent: req.socPercent,
    arrivalSocPercent: Number(arrivalSoc.toFixed(1)),
    minSocPercent: Number(minSoc.toFixed(1)),
    chargingStops: filledStops,
    legs: routeLegs,
    geometry: chosenPath.geometry,
    confidence,
    battery,
    alternativesConsidered: stations.filter((s) => isStationOnline(s)).length,
    gridHint: gridHintForTrip(new Date(now.getTime() + 330 * 60_000).getHours()),
    warnings,
    nodePath: chosenPath.nodes.map((n) => n.id),
  };

  return {
    ok: true,
    route,
    stations,
    recommendedStationIds: filledStops.map((s) => s.stationId),
    dataLabels: {
      stations: "REAL / STATIC DATA — Tamil Nadu + Bengaluru corridor (Open Charge Map)",
      status: "SIMULATED LIVE DATA — occupancy, queues and failures",
      routing: "OSRM live driving routes (state-wide)",
      prediction: "Logistic regression v1 — ML-ready feature schema",
      grid: "Grid Intelligence — Prototype Simulation (no live DISCOM feed)",
    },
  };
}

async function findTwoStops(
  vehicle: Vehicle,
  originWp: RouteWaypoint,
  destWp: RouteWaypoint,
  from: Coordinates,
  to: Coordinates,
  online: LiveStation[],
  req: TripRequest,
  traffic: number,
  weather: number,
  desiredArrival: number,
  direct: RoutedPath,
): Promise<{ path: RoutedPath; stops: ChargingStopPlan[] } | null> {
  const reachableChecks = await Promise.all(
    online.map(async (station) => {
      let p: RoutedPath | null;
      try {
        p = await routeBetween(originWp, stationWaypoint(station), traffic);
      } catch {
        p = null;
      }
      if (!p) return null;
      const sim = simulatePath(vehicle, p, req.socPercent, weather);
      return feasible(vehicle, sim.socEnd) ? { station, path: p } : null;
    }),
  );
  const originReachable = reachableChecks
    .filter((x): x is { station: LiveStation; path: RoutedPath } => x !== null)
    .sort(
      (a, b) =>
        b.station.predictedAvailability * b.station.reliabilityScore -
        a.station.predictedAvailability * a.station.reliabilityScore,
    )
    .slice(0, TWO_STOP_S1_LIMIT);

  const s2Candidates = online.slice(0, TWO_STOP_S2_LIMIT);

  for (const { station: s1, path: p1 } of originReachable) {
    const s1Wp = stationWaypoint(s1);
    const a1 = simulatePath(vehicle, p1, req.socPercent, weather);
    const d1 = targetDepartSoc(vehicle, a1.socEnd, vehicle.batteryKWh * 0.45, 40);

    // All s2 candidates for this s1 are checked in parallel, instead of one
    // at a time — this is what made the search take minutes at higher
    // candidate counts.
    const pairResults = await Promise.all(
      s2Candidates
        .filter((s2) => s2.id !== s1.id)
        .map(async (s2) => {
          const s2Wp = stationWaypoint(s2);
          let p2: RoutedPath | null;
          let p3: RoutedPath | null;
          try {
            [p2, p3] = await Promise.all([
              routeBetween(s1Wp, s2Wp, traffic),
              routeBetween(s2Wp, destWp, traffic),
            ]);
          } catch {
            return null;
          }
          if (!p2 || !p3) return null;

          const a2 = simulatePath(vehicle, p2, d1, weather);
          if (!feasible(vehicle, a2.socEnd)) return null;

          const remain = energyForDistanceKWh(vehicle, p3.distanceKm, {
            terrainFactor: p3.meanTerrain,
            trafficFactor: p3.meanTraffic,
            weatherFactor: weather,
          });
          const d2 = targetDepartSoc(vehicle, a2.socEnd, remain, desiredArrival);
          const a3 = simulatePath(vehicle, p3, d2, weather);
          if (!feasible(vehicle, a3.socEnd)) return null;

          let via: RoutedPath | null;
          try {
            via = await pathViaStations(originWp, destWp, [s1, s2], traffic);
          } catch {
            via = null;
          }
          if (!via) return null;

          return { s1, s2, p1, p2, p3, a1, a2, d1, d2, via };
        }),
    );

    const found = pairResults.find((r): r is NonNullable<typeof r> => r !== null);
    if (found) {
      const { s1: fs1, s2: fs2, p1: fp1, p2: fp2, p3: fp3, a1: fa1, a2: fa2, d1: fd1, d2: fd2, via } = found;
      const stop1 = rankStations([
        {
          station: fs1,
          detourKm: Math.max(0, via.distanceKm - direct.distanceKm) / 2,
          detourMinutes: 3,
          arriveSocPercent: fa1.socEnd,
          distanceFromOriginKm: fp1.distanceKm,
          remainingToDestKm: fp2.distanceKm + fp3.distanceKm,
          predictedAvailability: fs1.predictedAvailability,
          preference: req.preference,
          vehicle,
          targetDepartSoc: fd1,
        },
      ])[0];
      const stop2 = rankStations([
        {
          station: fs2,
          detourKm: 0.4,
          detourMinutes: 2,
          arriveSocPercent: fa2.socEnd,
          distanceFromOriginKm: fp1.distanceKm + fp2.distanceKm,
          remainingToDestKm: fp3.distanceKm,
          predictedAvailability: fs2.predictedAvailability,
          preference: req.preference,
          vehicle,
          targetDepartSoc: fd2,
        },
      ])[0];
      return { path: via, stops: [stop1, stop2] };
    }
  }
  return null;
}

export async function rerouteTrip(
  req: TripRequest,
  failedStationId?: string,
): Promise<OptimizeResponse> {
  const result = await optimizeTrip(req);
  if (!result.ok) return result;
  if (failedStationId) {
    result.route.warnings = [
      `⚠ Charger ${failedStationId} became unavailable.`,
      "🔄 Route recalculated.",
      ...result.route.warnings,
    ];
  }
  return result;
}