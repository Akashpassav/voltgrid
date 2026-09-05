import { describe, expect, it } from "vitest";
import { getStationCapability } from "@/lib/models/station-capability";
import { projectPointOnPolyline, isOffRoute } from "@/lib/utils/geo";
import { getBatteryCondition, findNearestEmergencyHelp } from "@/lib/services/navigation";
import type { ChargingStation, Coordinates, LiveStation } from "@/lib/types";

describe("Station Capability Classification", () => {
  it("classifies standard plug-in charging station correctly", () => {
    const station: Partial<ChargingStation> = {
      name: "Guindy Industrial Fast Hub",
      operator: "Tata Power",
      connectorType: "CCS2",
      powerKW: 60,
    };
    const cap = getStationCapability(station);
    expect(cap.type).toBe("CHARGING");
    expect(cap.charging).toBe(true);
    expect(cap.batterySwap).toBe(false);
  });

  it("classifies dedicated battery swapping station correctly", () => {
    const station: Partial<ChargingStation> = {
      name: "Silk Board Swap Hub",
      operator: "Sun Mobility",
      connectorType: "GB/T Swap",
      powerKW: 10,
    };
    const cap = getStationCapability(station);
    expect(cap.type).toBe("BATTERY_SWAP");
    expect(cap.charging).toBe(false);
    expect(cap.batterySwap).toBe(true);
  });

  it("classifies dual charging and swapping hub correctly", () => {
    const station: Partial<ChargingStation> = {
      name: "Indiranagar 100ft Energy Plaza",
      operator: "Tata Power & Sun Mobility",
      connectorType: "CCS2",
      powerKW: 50,
      capabilities: {
        charging: true,
        batterySwap: true,
      },
    };
    const cap = getStationCapability(station);
    expect(cap.type).toBe("CHARGING_AND_SWAP");
    expect(cap.charging).toBe(true);
    expect(cap.batterySwap).toBe(true);
  });
});

describe("Route Progress and Geometric Projection", () => {
  const lineGeometry: Coordinates[] = [
    { lat: 13.0, lng: 80.0 },
    { lat: 13.0, lng: 80.5 },
    { lat: 13.0, lng: 81.0 },
  ];

  it("calculates progress correctly for point along route", () => {
    const userPos: Coordinates = { lat: 13.0, lng: 80.25 }; // halfway along first segment
    const proj = projectPointOnPolyline(userPos, lineGeometry);

    expect(proj.distanceFromRouteKm).toBeCloseTo(0, 2);
    expect(proj.fraction).toBeGreaterThan(0.2);
    expect(proj.fraction).toBeLessThan(0.3);
    expect(proj.remainingRouteKm).toBeGreaterThan(0);
    expect(proj.distanceAlongRouteKm).toBeGreaterThan(0);
  });

  it("detects off-route movement when distance exceeds threshold", () => {
    const onRoutePos: Coordinates = { lat: 13.001, lng: 80.25 };
    const projOn = projectPointOnPolyline(onRoutePos, lineGeometry);
    expect(isOffRoute(projOn.distanceFromRouteKm, 400)).toBe(false);

    const offRoutePos: Coordinates = { lat: 13.01, lng: 80.25 }; // ~1.1 km away
    const projOff = projectPointOnPolyline(offRoutePos, lineGeometry);
    expect(isOffRoute(projOff.distanceFromRouteKm, 400)).toBe(true);
  });
});

describe("Battery Condition and Stranded EV Evaluation", () => {
  it("returns NORMAL when battery is healthy", () => {
    expect(getBatteryCondition(75, 110, 45)).toBe("NORMAL");
  });

  it("returns LOW_BATTERY when SoC is under 25% or remaining range is insufficient", () => {
    expect(getBatteryCondition(22, 35, 20)).toBe("LOW_BATTERY");
    expect(getBatteryCondition(40, 25, 60)).toBe("LOW_BATTERY");
  });

  it("returns CRITICAL_BATTERY when SoC is 15% or range is under 15 km", () => {
    expect(getBatteryCondition(14, 20, 50)).toBe("CRITICAL_BATTERY");
    expect(getBatteryCondition(30, 12, 50)).toBe("CRITICAL_BATTERY");
  });

  it("returns STRANDED when battery is 5% or 0 reachable stations", () => {
    expect(getBatteryCondition(4, 5, 50)).toBe("STRANDED");
    expect(getBatteryCondition(10, 8, 50, 0)).toBe("STRANDED");
  });
});

describe("Nearest Emergency Assistance Priority Ordering", () => {
  const dummyStations: LiveStation[] = [
    {
      id: "S1",
      name: "Fast Charge Plaza",
      latitude: 12.93,
      longitude: 80.12,
      operator: "Tata Power",
      connectorType: "CCS2",
      powerKW: 50,
      totalConnectors: 4,
      seedAvailableConnectors: 3,
      availableConnectors: 3,
      status: "available",
      seedStatus: "available",
      pricePerKWh: 18,
      estimatedQueueMinutes: 4,
      demandProfile: "transit",
      reliabilityScore: 0.9,
      amenity: "",
      address: "",
      city: "Chennai",
      highway: "",
      provenance: "static_seed",
      occupancyRatio: 0.25,
      lastUpdated: new Date().toISOString(),
      predictedAvailability: 0.88,
      predictionConfidence: "HIGH",
      predictionFactors: [],
      dataSourceLabel: "Seed",
      capabilities: { charging: true, batterySwap: false },
    },
    {
      id: "S2",
      name: "Quick Swap Hub",
      latitude: 12.925,
      longitude: 80.11,
      operator: "Sun Mobility",
      connectorType: "GB/T Swap",
      powerKW: 10,
      totalConnectors: 8,
      seedAvailableConnectors: 6,
      availableConnectors: 6,
      status: "available",
      seedStatus: "available",
      pricePerKWh: 10,
      estimatedQueueMinutes: 2,
      demandProfile: "transit",
      reliabilityScore: 0.95,
      amenity: "",
      address: "",
      city: "Chennai",
      highway: "",
      provenance: "static_seed",
      occupancyRatio: 0.2,
      lastUpdated: new Date().toISOString(),
      predictedAvailability: 0.92,
      predictionConfidence: "HIGH",
      predictionFactors: [],
      dataSourceLabel: "Seed",
      capabilities: { charging: false, batterySwap: true },
    },
  ];

  it("prioritizes charging and swapping services and includes verified emergency helpline", () => {
    const userPos = { lat: 12.92, lng: 80.1 };
    const help = findNearestEmergencyHelp(userPos, dummyStations, "CRITICAL_BATTERY", 15);

    expect(help.condition).toBe("CRITICAL_BATTERY");
    expect(help.priority1_charging.length).toBeGreaterThan(0);
    expect(help.priority2_swapping.length).toBeGreaterThan(0);
    expect(help.helpline.primaryNumber).toBe("1033");
    expect(help.priority4_roadside.length).toBeGreaterThan(0);
  });
});