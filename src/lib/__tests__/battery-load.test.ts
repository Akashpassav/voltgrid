import { describe, expect, it } from "vitest";
import { VEHICLES } from "@/lib/data/vehicles";
import { adjustedWhPerKm, energyForDistanceKWh, estimatedRangeKm, occupancyMultiplier } from "@/lib/models/battery";

const ather = VEHICLES.find((v) => v.id === "ather-450x")!;
const nexon = VEHICLES.find((v) => v.id === "tata-nexon-ev")!;
const neutral = { terrainFactor: 1, trafficFactor: 1, weatherFactor: 1 };

describe("multi-profile battery model", () => {
  it("applies the seeded 2W pillion penalty", () => {
    expect(occupancyMultiplier(ather, 1)).toBe(1);
    expect(occupancyMultiplier(ather, 2)).toBe(1.12);
    expect(adjustedWhPerKm(ather, { ...neutral, occupancyCount: 2 })).toBeCloseTo(36 * 1.12, 5);
  });

  it("shrinks range predictably when a second rider is added", () => {
    const solo = estimatedRangeKm(ather, 70, { ...neutral, occupancyCount: 1 });
    const pillion = estimatedRangeKm(ather, 70, { ...neutral, occupancyCount: 2 });
    expect(pillion).toBeCloseTo(solo / 1.12, 5);
    expect(pillion).toBeLessThan(solo);
  });

  it("scales 4W consumption with occupancy", () => {
    const driverOnly = energyForDistanceKWh(nexon, 100, { ...neutral, occupancyCount: 1 });
    const full = energyForDistanceKWh(nexon, 100, { ...neutral, occupancyCount: 5 });
    expect(full / driverOnly).toBeCloseTo(1.15, 5);
  });

  it("keeps different battery profiles distinct on the same route", () => {
    const atherRange = estimatedRangeKm(ather, 80, neutral);
    const nexonRange = estimatedRangeKm(nexon, 80, neutral);
    expect(ather.batteryProfile.chemistry).not.toBe(nexon.batteryProfile.chemistry);
    expect(atherRange).not.toBeCloseTo(nexonRange, 1);
  });
});
