import { describe, expect, it } from "vitest";
import { energyForDistanceKWh, estimatedRangeKm, usableEnergyKWh } from "@/lib/models/battery";
import { predictAvailability } from "@/lib/models/prediction";
import { rankStations } from "@/lib/algorithms/charging-stop";
import { dijkstra } from "@/lib/algorithms/routing";
import { snapToNode } from "@/lib/data/graph";
import { VEHICLES } from "@/lib/data/vehicles";
import { STATIONS } from "@/lib/data/stations";
import { optimizeTrip } from "@/lib/services/optimize";
import { failStation, resetSimulation } from "@/lib/store/simulation";

const ather = VEHICLES[0];

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
  it("recommends a GST charging stop for the SIH demo trip", async () => {
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
    expect(result.route.arrivalSocPercent).toBeGreaterThanOrEqual(ather.safetyReservePercent - 1);
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
    expect(first.route.chargingStops[0]?.stationId).toBe("VG-014");
    failStation("VG-014");
    const second = await optimizeTrip({
      originId: "chennai",
      destinationId: "chengalpattu",
      vehicleId: "ather-450x",
      socPercent: 68,
      preference: "fastest",
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.route.chargingStops[0]?.stationId).not.toBe("VG-014");
    expect(second.route.chargingStops[0]?.stationId).toBe("VG-021");
  });

  it("rejects an empty battery", async () => {
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
