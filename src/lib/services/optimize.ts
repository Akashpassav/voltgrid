/**
 * VoltGrid optimisation pipeline
 *
 * User trip → RoutingEngine (OSRM, state-wide)
 *           → EV energy model (SOC never below safety reserve)
 *           → Charging station query (MockChargingProvider / future OCPI)
 *           → Availability prediction (logistic regression v1)
 *           → Charging-stop scoring (configurable weights; closest is not automatic)
 *           → Route confidence → recommended route
 *
 * Long-route algorithm:
 *   1. Try direct route (no charge stop). If arrival SOC ≥ desiredArrival → done.
 *   2. Otherwise, iteratively find reachable charging stops from current position,
 *      pick the best, charge, continue from there — up to MAX_CHARGE_STOPS times.
 *   3. If destination unreachable even after MAX_CHARGE_STOPS, suggest overnight
 *      stay near the furthest reachable point.
 *
 * The two-stop search is preserved for backward-compat test stability, but the
 * iterative planner supersedes it as the primary long-route solver.
 */
import { getPlace } from "@/lib/data/places";
import { getVehicle } from "@/lib/data/vehicles";
import { rankStations } from "@/lib/algorithms/charging-stop";
import {
  routeBetween,
  routesBetween,
  routeViaWaypoints,
  type RoutedPath,
  type RouteWaypoint,
} from "@/lib/services/osrm-routing";
import { computeRouteConfidence } from "@/lib/models/confidence";
import {
  chargeTimeMinutes,
  describeBattery,
  desiredChargePercent,
  energyForDistanceKWh,
  socAfterEnergy,
} from "@/lib/models/battery";
import { gridHintForTrip } from "@/lib/models/grid";
import { getChargingProvider } from "@/lib/services/charging-provider";
import { findOvernightStays } from "@/lib/services/stays";
import { recommendVehicleIfBetter } from "@/lib/services/vehicle-recommendation";
import { getScenario, isStationOnline, simulationNow } from "@/lib/store/simulation";
import type {
  ChargingStopPlan,
  Coordinates,
  LiveStation,
  OptimizeResponse,
  OptimizedRoute,
  OvernightPlan,
  RouteAlternative,
  RouteLeg,
  TripRequest,
  Vehicle,
} from "@/lib/types";
import { addMinutes } from "@/lib/utils/time";
import { haversineKm, pointAtDistanceKm } from "@/lib/utils/geo";

// Maximum number of charging stops the iterative planner will attempt.
// Covers routes needing 3–5 stops (e.g. 2W on a 400 km TN/KA trip).
const MAX_CHARGE_STOPS = 5;

// Corridor radius used when searching for stations along the route geometry.
const CORRIDOR_KM = 28;

// Threshold above which overnight stay recommendations are offered for
// trips that are still completable today (purely a convenience feature).
const OVERNIGHT_STAY_DISTANCE_KM = 200;

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
  occupancyCount = 1,
  cargoLoadKg = 0,
): SimLeg {
  const energy = energyForDistanceKWh(vehicle, path.distanceKm, {
    terrainFactor: averageTerrain(path),
    trafficFactor: path.meanTraffic,
    weatherFactor,
    occupancyCount,
    cargoLoadKg,
  });
  const socEnd = socAfterEnergy(vehicle, startSoc, energy);
  return { path, energyKWh: energy, socStart: startSoc, socEnd };
}

function meetsMinSoc(socEnd: number, minSocPercent: number): boolean {
  return socEnd >= minSocPercent - 0.4;
}

/**
 * User-requested destination floor. Blank → vehicle safety reserve.
 * An explicit 0 means "arrive with at least 0%", not "charge to 0%".
 */
function requiredArrivalPercent(vehicle: Vehicle, requested?: number): number {
  if (requested === undefined) return vehicle.safetyReservePercent;
  return requested;
}

function targetDepartSoc(
  vehicle: Vehicle,
  arriveSoc: number,
  remainingEnergyKWh: number,
  desiredArrival: number,
): number {
  const needPercent = (remainingEnergyKWh / vehicle.batteryKWh) * 100 + desiredArrival;
  // Model-specific target replaces the old global 80–88% heuristic. We still
  // charge enough to finish the remaining leg plus a small planning buffer.
  const modelTarget = desiredChargePercent(vehicle);
  const maxTarget = vehicle.batteryProfile.safeMaxSocPercent;
  const want = Math.max(arriveSoc, Math.min(maxTarget, Math.max(needPercent + 10, modelTarget)));
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

function distToSegmentKm(p: Coordinates, a: Coordinates, b: Coordinates): number {
  const dAB = haversineKm(a, b);
  if (dAB < 0.1) return haversineKm(p, a);
  const midLatRad = ((a.lat + b.lat) * Math.PI) / 360;
  const dx = (b.lng - a.lng) * Math.cos(midLatRad);
  const dy = b.lat - a.lat;
  const px = (p.lng - a.lng) * Math.cos(midLatRad);
  const py = p.lat - a.lat;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return haversineKm(p, a);
  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / lenSq));
  const proj = { lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng) };
  return haversineKm(p, proj);
}

function nearPath(station: LiveStation, geometry: Coordinates[], maxKm = CORRIDOR_KM): boolean {
  const sCoords = { lat: station.latitude, lng: station.longitude };
  if (geometry.length === 0) return false;
  if (geometry.length === 1) return haversineKm(geometry[0], sCoords) <= maxKm;
  const maxDeg = (maxKm / 111) * 1.5;
  for (let i = 0; i < geometry.length - 1; i++) {
    const a = geometry[i];
    const b = geometry[i + 1];
    const minLat = Math.min(a.lat, b.lat) - maxDeg;
    const maxLat = Math.max(a.lat, b.lat) + maxDeg;
    const minLng = Math.min(a.lng, b.lng) - maxDeg;
    const maxLng = Math.max(a.lng, b.lng) + maxDeg;
    if (
      sCoords.lat >= minLat &&
      sCoords.lat <= maxLat &&
      sCoords.lng >= minLng &&
      sCoords.lng <= maxLng
    ) {
      if (distToSegmentKm(sCoords, a, b) <= maxKm) {
        return true;
      }
    }
  }
  return false;
}

/**
 * A station with no compatibility data (older seed entries) or one marked
 * "both"/"unspecified" is treated as usable by any vehicle class. Only a
 * station explicitly inferred as 2-wheeler-only or 4-wheeler-only (from OCM
 * connector data — see station-coverage.ts) excludes the other class, so a
 * 4W trip isn't routed to a bike-only 15A socket and vice versa.
 */
function isVehicleCompatible(vehicle: Vehicle, station: LiveStation): boolean {
  const compat = station.vehicleCompatibility;
  if (!compat || compat === "both" || compat === "unspecified") return true;
  if (compat === "4-wheeler") return vehicle.class === "4W";
  return vehicle.class !== "4W"; // "2-wheeler"-only stations serve 2W and 3W
}

function simulateWithStops(
  vehicle: Vehicle,
  path: RoutedPath,
  startSoc: number,
  weather: number,
  stops: ChargingStopPlan[],
  trafficMultiplier: number,
  occupancyCount = 1,
  cargoLoadKg = 0,
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
      occupancyCount,
      cargoLoadKg,
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

/**
 * Returns reachable, online, compatible stations along the route corridor that
 * make forward progress toward the destination from the current position.
 */
function filterReachableStations(
  currentPos: Coordinates,
  destPos: Coordinates,
  currentRangeKm: number,
  routeGeometry: Coordinates[],
  allStations: LiveStation[],
  vehicle: Vehicle,
  visitedIds: Set<string> = new Set(),
): LiveStation[] {
  const currentDistToDest = haversineKm(currentPos, destPos);
  // Search radius scaled to 92% of estimated range to account for road winding
  const searchRadiusKm = currentRangeKm * 0.92;

  const reachable = allStations.filter((s) => {
    if (visitedIds.has(s.id)) return false;
    if (!isStationOnline(s) || !isVehicleCompatible(vehicle, s)) return false;

    const sCoords = { lat: s.latitude, lng: s.longitude };
    const distFromCurrent = haversineKm(currentPos, sCoords);
    if (distFromCurrent > searchRadiusKm || distFromCurrent < 1.0) return false;

    // Must make forward progress toward destination (closer to dest than currentPos)
    const distToDest = haversineKm(sCoords, destPos);
    if (distToDest >= currentDistToDest - 1.0) return false;

    // Must be along the highway corridor or near the current route segment
    const alongCorridor = nearPath(s, routeGeometry, CORRIDOR_KM);
    const nearCurrent = distFromCurrent <= Math.min(35, currentRangeKm * 0.5);
    return alongCorridor || nearCurrent;
  });

  // Heuristic ranking to pick candidates that maximize forward progress
  // while considering station availability and minimizing corridor detour.
  reachable.sort((a, b) => {
    const aCoords = { lat: a.latitude, lng: a.longitude };
    const bCoords = { lat: b.latitude, lng: b.longitude };

    const progA = currentDistToDest - haversineKm(aCoords, destPos);
    const progB = currentDistToDest - haversineKm(bCoords, destPos);

    const scoreA = (progA / Math.max(1, currentRangeKm)) * 0.65 + a.predictedAvailability * 0.35;
    const scoreB = (progB / Math.max(1, currentRangeKm)) * 0.65 + b.predictedAvailability * 0.35;
    return scoreB - scoreA;
  });

  // Return top candidates for detailed OSRM evaluation
  return reachable.slice(0, 6);
}

/**
 * Iterative multi-stop progressive planner.
 *
 * Progresses forward from current position along the corridor:
 * 1. Checks if the destination is reachable directly.
 * 2. If not, identifies candidate stations within safe range that make forward progress.
 * 3. Evaluates top candidate stations via OSRM and simulates battery state.
 * 4. Advances to the best charger, charges to target SOC, and recurses.
 */
async function findMultiStop(
  vehicle: Vehicle,
  currentWp: RouteWaypoint,
  destWp: RouteWaypoint,
  currentSoc: number,
  allStations: LiveStation[],
  req: TripRequest,
  traffic: number,
  weather: number,
  desiredArrival: number,
  directGeometry: Coordinates[],
  stopsLeft: number,
  accumulatedStops: ChargingStopPlan[],
  visitedIds: Set<string> = new Set(),
): Promise<{ stops: ChargingStopPlan[]; finalPath: RoutedPath } | null> {
  if (stopsLeft <= 0) return null;

  const currentPos: Coordinates = { lat: currentWp.latitude, lng: currentWp.longitude };
  const destPos: Coordinates = { lat: destWp.latitude, lng: destWp.longitude };

  // Calculate unit energy consumption for current driving conditions
  const unitEnergy = energyForDistanceKWh(vehicle, 1, {
    terrainFactor: 1,
    trafficFactor: traffic,
    weatherFactor: weather,
    occupancyCount: req.passengerCount ?? 1,
    cargoLoadKg: req.cargoLoadKg ?? 0,
  });

  // Estimate safe range from current position at current SOC
  const safeSocRange = Math.max(0, currentSoc - vehicle.safetyReservePercent);
  const rangeKm = (vehicle.batteryKWh * (safeSocRange / 100)) / unitEnergy;
  const straightDistToDest = haversineKm(currentPos, destPos);

  // Can we reach the destination directly from here?
  if (straightDistToDest <= rangeKm * 1.15) {
    let directToDest: RoutedPath | null = null;
    try {
      directToDest = await routeBetween(currentWp, destWp, traffic);
    } catch {
      directToDest = null;
    }

    if (directToDest) {
      const directSim = simulatePath(
        vehicle,
        directToDest,
        currentSoc,
        weather,
        req.passengerCount ?? 1,
        req.cargoLoadKg ?? 0,
      );
      if (meetsMinSoc(directSim.socEnd, desiredArrival)) {
        return { stops: accumulatedStops, finalPath: directToDest };
      }
    }
  }

  // Destination not reachable directly — find candidate chargers along corridor
  const candidates = filterReachableStations(
    currentPos,
    destPos,
    rangeKm,
    directGeometry,
    allStations,
    vehicle,
    visitedIds,
  );

  if (candidates.length === 0) return null;

  // Evaluate candidate stations with detailed OSRM routing
  const candidateResults = await Promise.all(
    candidates.map(async (station) => {
      let via: RoutedPath | null;
      try {
        via = await routeBetween(currentWp, stationWaypoint(station), traffic);
      } catch {
        return null;
      }
      if (!via) return null;

      const arrSim = simulatePath(
        vehicle,
        via,
        currentSoc,
        weather,
        req.passengerCount ?? 1,
        req.cargoLoadKg ?? 0,
      );
      if (!meetsMinSoc(arrSim.socEnd, vehicle.safetyReservePercent)) return null;

      const stationCoords = { lat: station.latitude, lng: station.longitude };
      const stationToDest = haversineKm(stationCoords, destPos);
      const energyToDest = energyForDistanceKWh(vehicle, stationToDest * 1.15, {
        terrainFactor: 1,
        trafficFactor: traffic,
        weatherFactor: weather,
        occupancyCount: req.passengerCount ?? 1,
        cargoLoadKg: req.cargoLoadKg ?? 0,
      });
      const depart = targetDepartSoc(vehicle, arrSim.socEnd, energyToDest, desiredArrival);

      const stopCandidateInput = {
        station,
        detourKm: Math.max(0, via.distanceKm - straightDistToDest),
        detourMinutes: 0,
        arriveSocPercent: arrSim.socEnd,
        distanceFromOriginKm: via.distanceKm,
        remainingToDestKm: stationToDest * 1.15,
        predictedAvailability: station.predictedAvailability,
        preference: req.preference,
        vehicle,
        targetDepartSoc: depart,
      };
      const scoredStop = rankStations([stopCandidateInput])[0];

      return {
        station,
        path: via,
        arriveSoc: arrSim.socEnd,
        departSoc: depart,
        scoredStop,
      };
    }),
  );

  const valid = candidateResults.filter((x): x is NonNullable<typeof x> => x !== null);
  if (valid.length === 0) return null;

  // Try the best candidate, recursing forward
  for (const best of valid) {
    const nextVisited = new Set(visitedIds);
    nextVisited.add(best.station.id);

    const sub = await findMultiStop(
      vehicle,
      stationWaypoint(best.station),
      destWp,
      best.departSoc,
      allStations,
      req,
      traffic,
      weather,
      desiredArrival,
      directGeometry,
      stopsLeft - 1,
      [...accumulatedStops, best.scoredStop],
      nextVisited,
    );

    if (sub !== null) return sub;
  }

  return null;
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
      suggestions: ["Choose an Indian electric vehicle from the list."],
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
  const desiredArrival = requiredArrivalPercent(vehicle, req.arrivalSocPercent);
  const occupancyCount = req.passengerCount ?? 1;
  const cargoLoadKg = req.cargoLoadKg ?? 0;
  const from: Coordinates = { lat: origin.latitude, lng: origin.longitude };
  const to: Coordinates = { lat: destination.latitude, lng: destination.longitude };

  const originWp = placeWaypoint(origin.id, origin.name, from);
  const destWp = placeWaypoint(destination.id, destination.name, to);

  let direct: RoutedPath | null;
  let directOptions: RoutedPath[] = [];
  try {
    directOptions = await routesBetween(originWp, destWp, traffic);
    direct = directOptions[0] ?? null;
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
    occupancyCount,
    cargoLoadKg,
  });

  const directSims = (directOptions.length ? directOptions : [direct]).map((path) => ({
    path,
    sim: simulatePath(vehicle, path, req.socPercent, weather, occupancyCount, cargoLoadKg),
  }));
  const feasibleDirects = directSims.filter((entry) => meetsMinSoc(entry.sim.socEnd, desiredArrival));

  let chosenStops: ChargingStopPlan[] = [];
  let chosenPath = direct;
  const warnings: string[] = [];
  const routeAlternatives: RouteAlternative[] = [];

  if (feasibleDirects.length > 0) {
    // ── Direct route is feasible — no charging required ────────────────────
    const rankedDirects = [...feasibleDirects].sort((a, b) => {
      if (req.preference === "efficient") return a.sim.energyKWh - b.sim.energyKWh;
      if (req.preference === "reliability") return b.sim.socEnd - a.sim.socEnd;
      return a.path.baseMinutes - b.path.baseMinutes;
    });
    chosenPath = rankedDirects[0].path;
    chosenStops = [];
    for (const entry of rankedDirects.slice(1, 3)) {
      const label =
        entry.path.distanceKm + 0.5 < rankedDirects[0].path.distanceKm
          ? "Shorter distance"
          : entry.sim.energyKWh + 0.05 < rankedDirects[0].sim.energyKWh
            ? "Lower energy"
            : "Alternative driving path";
      routeAlternatives.push({
        label,
        distanceKm: Number(entry.path.distanceKm.toFixed(1)),
        drivingMinutes: Math.round(entry.path.baseMinutes),
        energyKWh: Number(entry.sim.energyKWh.toFixed(2)),
        arrivalSocPercent: Number(entry.sim.socEnd.toFixed(1)),
        chargingStops: 0,
      });
    }
  } else {
    // ── Charging required — run the iterative multi-stop planner ──────────
    //
    // First filter stations along the full route corridor. This set is reused
    // by findMultiStop for every iteration so we avoid re-querying all 900+
    // stations on each recursive call.
    const corridorStations = stations.filter((s) => {
      if (!isStationOnline(s) || !isVehicleCompatible(vehicle, s)) return false;
      return nearPath(s, direct!.geometry, CORRIDOR_KM);
    });

    // Include any station reachable from the origin within a short radius even if slightly
    // outside the corridor (helpful for urban starting points).
    const originRangeKm = Math.min(35, battery.estimatedRangeKm);
    const extraFromOrigin = stations.filter((s) => {
      if (!isStationOnline(s) || !isVehicleCompatible(vehicle, s)) return false;
      if (corridorStations.some((c) => c.id === s.id)) return false;
      return haversineKm(from, { lat: s.latitude, lng: s.longitude }) <= originRangeKm;
    });

    const online = [...corridorStations, ...extraFromOrigin];

    if (online.length === 0) {
      // No online stations found at all along the route
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

    // ── Try single-stop ───────────────────────────────────────────────────
    // Calculate full safe range from a charging station at targetDepartSoc:
    const fullRangeKm =
      (vehicle.batteryKWh * (vehicle.batteryProfile.safeMaxSocPercent - vehicle.safetyReservePercent)) /
      100 /
      (energyForDistanceKWh(vehicle, 1, {
        terrainFactor: 1,
        trafficFactor: traffic,
        weatherFactor: weather,
        occupancyCount,
        cargoLoadKg,
      }));

    // For a single stop to work, origin->station must be reachable AND station->dest must be reachable
    const singleStopFeasible = online.filter((station) => {
      const dFrom = haversineKm(from, { lat: station.latitude, lng: station.longitude });
      const dTo = haversineKm({ lat: station.latitude, lng: station.longitude }, to);
      return dFrom <= battery.estimatedRangeKm * 0.92 && dTo <= fullRangeKm * 0.92;
    });

    let best: ReturnType<typeof rankStations>[0] | undefined;
    let singleViaPath: RoutedPath | null = null;

    if (singleStopFeasible.length > 0) {
      // Prioritize chargers near the route midpoint so both legs are well within range
      const midDist = haversineKm(from, to) / 2;
      const sortedCandidates = [...singleStopFeasible].sort((a, b) => {
        const distA = Math.abs(haversineKm(from, { lat: a.latitude, lng: a.longitude }) - midDist);
        const distB = Math.abs(haversineKm(from, { lat: b.latitude, lng: b.longitude }) - midDist);
        return distA - distB;
      });
      const candidatesToTest = sortedCandidates.slice(0, 5);
      const candidateResults = await Promise.all(
        candidatesToTest.map(async (station) => {
          let via: RoutedPath | null;
          try {
            via = await pathViaStations(originWp, destWp, [station], traffic);
          } catch (err) {
            console.error(`OSRM routing failed for candidate station ${station.id}:`, err);
            return null;
          }
          if (!via || via.legs.length < 2) return null;
          const toStation = subPath(via, 0);
          const toDest = subPath(via, 1);

          const arrive = simulatePath(vehicle, toStation, req.socPercent, weather, occupancyCount, cargoLoadKg);
          if (!meetsMinSoc(arrive.socEnd, vehicle.safetyReservePercent)) return null;
          const remainingEnergy = energyForDistanceKWh(vehicle, toDest.distanceKm, {
            terrainFactor: toDest.meanTerrain,
            trafficFactor: toDest.meanTraffic,
            weatherFactor: weather,
            occupancyCount,
            cargoLoadKg,
          });
          const depart = targetDepartSoc(vehicle, arrive.socEnd, remainingEnergy, desiredArrival);
          const after = simulatePath(vehicle, toDest, depart, weather, occupancyCount, cargoLoadKg);
          if (!meetsMinSoc(after.socEnd, desiredArrival)) return null;
          const detourKm = Math.max(0, via.distanceKm - direct!.distanceKm);
          const detourMinutes = Math.max(0, via.baseMinutes - direct!.baseMinutes);
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

      const validCandidates = candidateResults.filter((x): x is NonNullable<typeof x> => x !== null);
      if (validCandidates.length > 0) {
        const ranked = rankStations(validCandidates.map((x) => x.candidate));
        best = ranked[0];
        if (best) {
          const matched = validCandidates.find((x) => x.candidate.station.id === best!.stationId);
          if (matched) {
            singleViaPath = matched.via;
          }
        }
      }
    }

    if (best && singleViaPath) {
      // Single-stop found
      chosenPath = singleViaPath;
      chosenStops = [best];
    } else {
      // ── No viable single stop → try iterative multi-stop planner ─────────
      const multiResult = await findMultiStop(
        vehicle,
        originWp,
        destWp,
        req.socPercent,
        online,
        req,
        traffic,
        weather,
        desiredArrival,
        direct.geometry,
        MAX_CHARGE_STOPS,
        [],
      );

      if (multiResult && multiResult.stops.length > 0) {
        // Build the full via-waypoints path for all collected stops
        const stopStations = multiResult.stops.map((stop) => {
          const s = online.find((st) => st.id === stop.stationId);
          return s!;
        }).filter(Boolean);

        let viaPath: RoutedPath | null = null;
        try {
          viaPath = await pathViaStations(originWp, destWp, stopStations, traffic);
        } catch {
          viaPath = null;
        }

        if (viaPath) {
          chosenPath = viaPath;
          chosenStops = multiResult.stops;
          warnings.push(
            `This trip needs ${multiResult.stops.length} charging stop${multiResult.stops.length > 1 ? "s" : ""} at the current battery level.`,
          );
        } else {
          // Via-path construction failed — fall through to UNREACHABLE
          chosenStops = [];
        }
      }

      if (chosenStops.length === 0) {
        // Genuinely unreachable — suggest overnight stay near furthest reachable point
        const reachablePoint =
          pointAtDistanceKm(direct.geometry, battery.estimatedRangeKm) ?? from;
        let stays: Awaited<ReturnType<typeof findOvernightStays>> = [];
        if (direct.distanceKm > OVERNIGHT_STAY_DISTANCE_KM) {
          try {
            stays = await findOvernightStays(reachablePoint, online);
          } catch (err) {
            console.error("Overnight stay lookup failed:", err);
          }
        }

        const suggestions = [
          `Charge locally before starting — usable range is about ${battery.estimatedRangeKm.toFixed(0)} km.`,
          "Pick a closer destination.",
          "Choose a vehicle with a larger battery pack.",
        ];
        if (stays.length > 0) {
          suggestions.unshift(
            "Or stop for the night near a charger and continue the trip tomorrow — see recommended stays below.",
          );
        }

        const vehicleRecommendation = recommendVehicleIfBetter({
          vehicle,
          distanceKm: direct.distanceKm,
          chargingStopsCount: 0,
          totalMinutes: null,
          unreachable: true,
        });

        // Distinguish: stations exist but none reachable, vs all stations offline
        const anyOnlineExists = stations.some(
          (s) => isStationOnline(s) && isVehicleCompatible(vehicle, s),
        );
        const message = anyOnlineExists
          ? "Your current battery level cannot safely reach the destination. No reachable charging station was found along the route within your current range."
          : "Your current battery level cannot safely reach the destination. We found no reachable charger within the available range.";

        return {
          ok: false,
          code: "UNREACHABLE",
          message,
          suggestions,
          overnightPlan:
            stays.length > 0
              ? {
                  reachablePoint,
                  reachableDistanceKm: Number(battery.estimatedRangeKm.toFixed(1)),
                  stays,
                }
              : undefined,
          vehicleRecommendation,
        };
      }
    }
  }

  if (!chosenPath) {
    return {
      ok: false,
      code: "NO_ROUTE",
      message: "No route could be constructed between those points.",
      suggestions: ["Check that both locations are reachable by road, or try again."],
    };
  }

  const simulated = simulateWithStops(
    vehicle,
    chosenPath,
    req.socPercent,
    weather,
    chosenStops,
    traffic,
    occupancyCount,
    cargoLoadKg,
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

  const vehicleRecommendation = recommendVehicleIfBetter({
    vehicle,
    distanceKm: chosenPath.distanceKm,
    chargingStopsCount: filledStops.length,
    totalMinutes,
    unreachable: false,
  });

  // For trips above OVERNIGHT_STAY_DISTANCE_KM, suggest overnight stays near a
  // suitable mid-point — purely a convenience suggestion; the trip is still
  // fully reachable today. The threshold is distance-based (not time-based)
  // so a fast 4W on a 250 km trip also gets the suggestion even if it takes
  // only 3.5 hours.
  let overnightPlan: OvernightPlan | undefined;
  if (chosenPath.distanceKm > OVERNIGHT_STAY_DISTANCE_KM) {
    const midKm = chosenPath.distanceKm / 2;
    const restPoint = pointAtDistanceKm(chosenPath.geometry, midKm);
    if (restPoint) {
      try {
        const stays = await findOvernightStays(restPoint, stations);
        if (stays.length > 0) {
          overnightPlan = {
            reachablePoint: restPoint,
            reachableDistanceKm: Number(midKm.toFixed(1)),
            stays,
          };
        }
      } catch (err) {
        console.error("Overnight stay lookup failed for long-trip suggestion:", err);
      }
    }
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
    routeAlternatives,
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
    vehicleRecommendation,
    overnightPlan,
  };
}

const TWO_STOP_S1_LIMIT = 5;
const TWO_STOP_S2_LIMIT = 6;

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
      const sim = simulatePath(vehicle, p, req.socPercent, weather, req.passengerCount ?? 1, req.cargoLoadKg ?? 0);
      return meetsMinSoc(sim.socEnd, vehicle.safetyReservePercent) ? { station, path: p } : null;
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
    const a1 = simulatePath(vehicle, p1, req.socPercent, weather, req.passengerCount ?? 1, req.cargoLoadKg ?? 0);
    const d1 = targetDepartSoc(
      vehicle,
      a1.socEnd,
      vehicle.batteryKWh * 0.45,
      Math.max(vehicle.batteryProfile.safeMinSocPercent, desiredChargePercent(vehicle) - 15),
    );

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

          const a2 = simulatePath(vehicle, p2, d1, weather, req.passengerCount ?? 1, req.cargoLoadKg ?? 0);
          if (!meetsMinSoc(a2.socEnd, vehicle.safetyReservePercent)) return null;

          const remain = energyForDistanceKWh(vehicle, p3.distanceKm, {
            terrainFactor: p3.meanTerrain,
            trafficFactor: p3.meanTraffic,
            weatherFactor: weather,
            occupancyCount: req.passengerCount ?? 1,
            cargoLoadKg: req.cargoLoadKg ?? 0,
          });
          const d2 = targetDepartSoc(vehicle, a2.socEnd, remain, desiredArrival);
          const a3 = simulatePath(vehicle, p3, d2, weather, req.passengerCount ?? 1, req.cargoLoadKg ?? 0);
          if (!meetsMinSoc(a3.socEnd, desiredArrival)) return null;

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

// Keep findTwoStops exported so any external callers or future tests can use it.
export { findTwoStops };

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