import { afterEach, describe, expect, it, vi } from "vitest";

import {
  energyForDistanceKWh,
  estimatedRangeKm,
  usableEnergyKWh,
} from "@/lib/models/battery";
import { predictAvailability } from "@/lib/models/prediction";
import { rankStations } from "@/lib/algorithms/charging-stop";
import { dijkstra } from "@/lib/algorithms/routing";
import { snapToNode } from "@/lib/data/graph";
import { VEHICLES } from "@/lib/data/vehicles";
import { STATIONS } from "@/lib/data/stations";
import { optimizeTrip } from "@/lib/services/optimize";
import { failStation, resetSimulation } from "@/lib/store/simulation";

/*
 * The production routing service uses the public OSRM API.
 *
 * Unit/integration tests should not depend on the internet because:
 * - OSRM may be slow or unavailable.
 * - Public API requests can time out.
 * - Test results should be deterministic.
 *
 * Instead, we intercept fetch() for OSRM requests and generate an
 * OSRM-compatible response using the project's existing deterministic
 * corridor graph/Dijkstra implementation.
 *
 * Overpass is also intercepted and returns an empty result. The optimizer
 * can therefore exercise its overnight-stay fallback without depending on
 * the public Overpass service.
 */

const ather = VEHICLES[0];

function mockFetch(input: RequestInfo | URL): Promise<Response> {
  const url = String(input);

  // ------------------------------------------------------------
  // Mock OSRM
  // ------------------------------------------------------------
  if (url.startsWith("https://router.project-osrm.org/route/v1/driving/")) {
    const withoutBase = url.replace(
      "https://router.project-osrm.org/route/v1/driving/",
      "",
    );

    const [coordsPart] = withoutBase.split("?");

    const coordinates = coordsPart.split(";").map((value) => {
      const [lng, lat] = value.split(",").map(Number);

      return {
        lat,
        lng,
      };
    });

    if (
      coordinates.length < 2 ||
      coordinates.some(
        (point) => !Number.isFinite(point.lat) || !Number.isFinite(point.lng),
      )
    ) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            code: "InvalidQuery",
            message: "Invalid mock OSRM coordinates",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );
    }

    const legs: Array<{
      distance: number;
      duration: number;
    }> = [];

    const geometry: Array<[number, number]> = [];

    let totalDistanceKm = 0;
    let totalDurationMinutes = 0;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const from = coordinates[i];
      const to = coordinates[i + 1];

      const fromNode = snapToNode(from.lat, from.lng);
      const toNode = snapToNode(to.lat, to.lng);

      const path = dijkstra(fromNode.id, toNode.id, 1, "fastest");

      if (!path) {
        /*
         * If two arbitrary coordinates cannot be connected by the
         * deterministic corridor graph, fall back to a simple straight-line
         * distance. This keeps the test network deterministic.
         */
        const distanceKm = haversineKm(from, to);
        const durationMinutes =
          distanceKm > 0 ? (distanceKm / 40) * 60 : 0;

        legs.push({
          distance: distanceKm * 1000,
          duration: durationMinutes * 60,
        });

        totalDistanceKm += distanceKm;
        totalDurationMinutes += durationMinutes;

        geometry.push(
          [from.lng, from.lat],
          [to.lng, to.lat],
        );

        continue;
      }

      const distanceKm = path.distanceKm;
      const durationMinutes = path.baseMinutes;

      legs.push({
        distance: distanceKm * 1000,
        duration: durationMinutes * 60,
      });

      totalDistanceKm += distanceKm;
      totalDurationMinutes += durationMinutes;

      for (const point of path.geometry) {
        const coordinate: [number, number] = [point.lng, point.lat];

        const previous = geometry[geometry.length - 1];

        if (
          !previous ||
          previous[0] !== coordinate[0] ||
          previous[1] !== coordinate[1]
        ) {
          geometry.push(coordinate);
        }
      }
    }

    return Promise.resolve(
      new Response(
        JSON.stringify({
          code: "Ok",
          routes: [
            {
              distance: totalDistanceKm * 1000,
              duration: totalDurationMinutes * 60,
              geometry: {
                coordinates: geometry,
              },
              legs,
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
  }

  // ------------------------------------------------------------
  // Mock Overpass
  // ------------------------------------------------------------
  if (url.startsWith("https://overpass-api.de/api/interpreter")) {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          version: 0.6,
          generator: "VoltGrid Vitest Mock",
          elements: [],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
  }

  // ------------------------------------------------------------
  // Fail unexpected external requests
  // ------------------------------------------------------------
  return Promise.reject(
    new Error(`Unexpected network request in test: ${url}`),
  );
}

vi.stubGlobal("fetch", mockFetch);

afterEach(() => {
  resetSimulation();
});

describe("battery model", () => {
  it("keeps a safety reserve out of usable energy", () => {
    const usable = usableEnergyKWh(ather, 70, 15);

    expect(usable).toBeCloseTo(ather.batteryKWh * 0.55, 5);
  });

  it("estimates range from adjusted consumption", () => {
    const range = estimatedRangeKm(ather, 70, {
      terrainFactor: 1.1,
      trafficFactor: 1.08,
      weatherFactor: 1,
      safetyReservePercent: 15,
    });

    const energy = ather.batteryKWh * 0.55;
    const kwhPerKm = (36 * 1.1 * 1.08) / 1000;

    expect(range).toBeCloseTo(energy / kwhPerKm, 5);
  });

  it("consumes more energy on steeper terrain", () => {
    const flat = energyForDistanceKWh(ather, 10, {
      terrainFactor: 1,
      trafficFactor: 1,
      weatherFactor: 1,
    });

    const hill = energyForDistanceKWh(ather, 10, {
      terrainFactor: 1.2,
      trafficFactor: 1,
      weatherFactor: 1,
    });

    expect(hill).toBeGreaterThan(flat);
  });
});

describe("predictive availability", () => {
  it("returns a probability in (0, 1)", () => {
    const pred = predictAvailability({
      station: {
        id: "VG-014",
        occupancyRatio: 0.25,
        estimatedQueueMinutes: 5,
        totalConnectors: 4,
        powerKW: 7.2,
        reliabilityScore: 0.93,
        demandProfile: "transit",
        status: "available",
      },
      hour: 15,
      weekday: 1,
      etaMinutesFromNow: 28,
    });

    expect(pred.probability).toBeGreaterThan(0.7);
    expect(pred.probability).toBeLessThan(0.98);
    expect(pred.factors.length).toBeGreaterThan(3);
  });

  it("collapses when the station is offline", () => {
    const pred = predictAvailability({
      station: {
        id: "VG-014",
        occupancyRatio: 1,
        estimatedQueueMinutes: 0,
        totalConnectors: 4,
        powerKW: 7.2,
        reliabilityScore: 0.93,
        demandProfile: "transit",
        status: "offline",
      },
      hour: 15,
      weekday: 1,
      etaMinutesFromNow: 20,
    });

    expect(pred.probability).toBeLessThan(0.05);
  });
});

describe("charging-stop scoring", () => {
  it("prefers a reliable detour over a close unreliable station", () => {
    const vehicle = ather;

    const reliable = rankStations([
      {
        station: {
          ...liveStub("A", 0.95, 4, "available", 0.2),
        },
        detourKm: 2,
        detourMinutes: 6,
        arriveSocPercent: 32,
        distanceFromOriginKm: 22,
        remainingToDestKm: 34,
        predictedAvailability: 0.95,
        preference: "reliability" as const,
        vehicle,
        targetDepartSoc: 80,
      },
      {
        station: {
          ...liveStub("B", 0.35, 40, "busy", 0.8),
        },
        detourKm: 0.5,
        detourMinutes: 2,
        arriveSocPercent: 33,
        distanceFromOriginKm: 21,
        remainingToDestKm: 35,
        predictedAvailability: 0.35,
        preference: "reliability" as const,
        vehicle,
        targetDepartSoc: 80,
      },
    ]);

    expect(reliable[0].stationId).toBe("A");
  });
});

describe("corridor Dijkstra", () => {
  it("finds a Chennai → Chengalpattu path", () => {
    const a = snapToNode(13.0524, 80.2501);
    const b = snapToNode(12.6819, 79.9832);

    const path = dijkstra(a.id, b.id, 1, "fastest");

    expect(path).not.toBeNull();
    expect(path!.distanceKm).toBeGreaterThan(40);
    expect(path!.distanceKm).toBeLessThan(80);
  });
});

describe("end-to-end optimizer + reroute", () => {
  it("recommends a charging stop for the SIH demo trip", async () => {
    resetSimulation();

    const result = await optimizeTrip({
      originId: "chennai",
      destinationId: "chengalpattu",
      vehicleId: "ather-450x",
      socPercent: 68,
      preference: "fastest",
    });

    expect(result.ok).toBe(true);

    if (!result.ok) return;

    expect(result.route.chargingStops.length).toBeGreaterThan(0);

    expect(result.route.confidence.score).toBeGreaterThanOrEqual(50);

    expect(result.route.arrivalSocPercent).toBeGreaterThanOrEqual(
      ather.safetyReservePercent - 1,
    );
  });

  it("reroutes when the recommended charger fails", async () => {
    resetSimulation();

    const first = await optimizeTrip({
      originId: "chennai",
      destinationId: "chengalpattu",
      vehicleId: "ather-450x",
      socPercent: 68,
      preference: "fastest",
    });

    expect(first.ok).toBe(true);

    if (!first.ok) return;

    const firstStopId = first.route.chargingStops[0]?.stationId;

    expect(firstStopId).toBeDefined();

    if (!firstStopId) return;

    /*
     * Fail whichever station the optimizer actually selected.
     *
     * We intentionally do not hard-code VG-014 or VG-003 because station
     * ranking can legitimately change when routing, prediction, battery
     * models, or station data changes.
     */
    failStation(firstStopId);

    const second = await optimizeTrip({
      originId: "chennai",
      destinationId: "chengalpattu",
      vehicleId: "ather-450x",
      socPercent: 68,
      preference: "fastest",
    });

    expect(second.ok).toBe(true);

    if (!second.ok) return;

    const secondStopId = second.route.chargingStops[0]?.stationId;

    expect(secondStopId).toBeDefined();

    expect(secondStopId).not.toBe(firstStopId);
  });

  it("rejects an empty battery", async () => {
    resetSimulation();

    const result = await optimizeTrip({
      originId: "chennai",
      destinationId: "chengalpattu",
      vehicleId: "ather-450x",
      socPercent: 4,
      preference: "fastest",
    });

    expect(result.ok).toBe(false);
  });
});

function liveStub(
  id: string,
  predicted: number,
  queue: number,
  status: "available" | "busy",
  occupancy: number,
) {
  const seed = STATIONS[0];

  return {
    ...seed,
    id,
    name: id === "A" ? "Reliable plaza" : "Closest unreliable",
    status,
    availableConnectors: status === "available" ? 3 : 0,
    occupancyRatio: occupancy,
    estimatedQueueMinutes: queue,
    lastUpdated: new Date().toISOString(),
    predictedAvailability: predicted,
    predictionConfidence: "HIGH" as const,
    predictionFactors: [],
    dataSourceLabel: "SIMULATED LIVE DATA",
    reliabilityScore: predicted,
    pricePerKWh: 12,
    powerKW: 7.2,
    totalConnectors: 4,
  };
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const earthRadiusKm = 6371;

  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);

  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);

  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  );
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}