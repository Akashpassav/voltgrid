import { describe, expect, it } from "vitest";
import { VEHICLES } from "@/lib/data/vehicles";
import { desiredChargePercent } from "@/lib/models/battery";

const ather = VEHICLES.find((v) => v.id === "ather-450x")!;
const nexon = VEHICLES.find((v) => v.id === "tata-nexon-ev")!;

describe("per-model desired battery level", () => {
  it("uses different model defaults", () => {
    expect(desiredChargePercent(ather)).toBe(82);
    expect(desiredChargePercent(nexon)).toBe(90);
  });

  it("keeps the target inside each profile's safe operating window", () => {
    for (const vehicle of VEHICLES) {
      const target = desiredChargePercent(vehicle);
      expect(target).toBeGreaterThanOrEqual(vehicle.batteryProfile.safeMinSocPercent + 5);
      expect(target).toBeLessThanOrEqual(vehicle.batteryProfile.safeMaxSocPercent);
    }
  });
});
