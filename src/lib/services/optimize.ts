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
// per request. Corridor routing kept this small implicitly (short corridor,
// few nearby stations); state-wide OSRM routing can otherwise trigger dozens
// of parallel requests to OSRM's public server on a long trip. Nearest-by-
// availability heuristic keeps candidate quality reasonable while bounding
// API load.
const MAX_CANDIDATE_STATIONS = 15;

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

function nearPath(station: LiveStation, geometry: Coordinates[], maxKm = 4.2): boolean {
  return geometry.some(
    (p) => haversineKm(p, { lat: station.latitude, lng: station.longitude }) <= maxKm,
  );
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

    // Bound how many candidates we send to OSRM individually — see
    // MAX_CANDIDATE_STATIONS comment above.
    if (online.length > MAX_CANDIDATE_STATIONS) {
      online = [...online]
        .sort((a, b) => b.predictedAvailability - a.predictedAvailability)
        .slice(0, MAX_CANDIDATE_STATIONS);
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
        let toStation: RoutedPath | null;
        let toDest: RoutedPath | null;
        try {
          [via, toStation, toDest] = await Promise.all([
            pathViaStations(originWp, destWp, [station], traffic),
            routeViaWaypoints([originWp, stationWp], traffic),
            routeViaWaypoints([stationWp, destWp], traffic),
          ]);
        } catch (err) {
          console.error(`OSRM routing failed for candidate station ${station.id}:`, err);
          return null;
        }
        if (!via || !toStation || !toDest) return null;

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
      return feasible(vehicle, sim.socEnd) ? station : null;
    }),
  );
  const originReachable = reachableChecks
    .filter((s): s is LiveStation => s !== null)
    .sort(
      (a, b) => b.predictedAvailability * b.reliabilityScore - a.predictedAvailability * a.reliabilityScore,
    );

  for (const s1 of originReachable.slice(0, 8)) {
    const s1Wp = stationWaypoint(s1);
    let p1: RoutedPath | null;
    try {
      p1 = await routeBetween(originWp, s1Wp, traffic);
    } catch {
      p1 = null;
    }
    if (!p1) continue;
    const a1 = simulatePath(vehicle, p1, req.socPercent, weather);
    const d1 = targetDepartSoc(vehicle, a1.socEnd, vehicle.batteryKWh * 0.45, 40);

    for (const s2 of online) {
      if (s2.id === s1.id) continue;
      const s2Wp = stationWaypoint(s2);
      let p2: RoutedPath | null;
      try {
        p2 = await routeBetween(s1Wp, s2Wp, traffic);
      } catch {
        p2 = null;
      }
      if (!p2) continue;
      const a2 = simulatePath(vehicle, p2, d1, weather);
      if (!feasible(vehicle, a2.socEnd)) continue;

      let p3: RoutedPath | null;
      try {
        p3 = await routeBetween(s2Wp, destWp, traffic);
      } catch {
        p3 = null;
      }
      if (!p3) continue;
      const remain = energyForDistanceKWh(vehicle, p3.distanceKm, {
        terrainFactor: p3.meanTerrain,
        trafficFactor: p3.meanTraffic,
        weatherFactor: weather,
      });
      const d2 = targetDepartSoc(vehicle, a2.socEnd, remain, desiredArrival);
      const a3 = simulatePath(vehicle, p3, d2, weather);
      if (!feasible(vehicle, a3.socEnd)) continue;

      let via: RoutedPath | null;
      try {
        via = await pathViaStations(originWp, destWp, [s1, s2], traffic);
      } catch {
        via = null;
      }
      if (!via) continue;

      const stop1 = rankStations([
        {
          station: s1,
          detourKm: Math.max(0, via.distanceKm - direct.distanceKm) / 2,
          detourMinutes: 3,
          arriveSocPercent: a1.socEnd,
          distanceFromOriginKm: p1.distanceKm,
          remainingToDestKm: p2.distanceKm + p3.distanceKm,
          predictedAvailability: s1.predictedAvailability,
          preference: req.preference,
          vehicle,
          targetDepartSoc: d1,
        },
      ])[0];
      const stop2 = rankStations([
        {
          station: s2,
          detourKm: 0.4,
          detourMinutes: 2,
          arriveSocPercent: a2.socEnd,
          distanceFromOriginKm: p1.distanceKm + p2.distanceKm,
          remainingToDestKm: p3.distanceKm,
          predictedAvailability: s2.predictedAvailability,
          preference: req.preference,
          vehicle,
          targetDepartSoc: d2,
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