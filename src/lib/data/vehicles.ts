import type { BatteryProfile, Vehicle } from "@/lib/types";

/**
 * Seed values are transparent planning assumptions, not OEM BMS limits.
 * Chemistry can vary by model year/variant, so treat these as prototype data.
 */
const NMC_2W = (capacity: number, whPerKm: number, desiredChargePercent = 82): BatteryProfile => ({
  chemistry: "NMC",
  ratedCapacityKWh: capacity,
  nominalWhPerKm: whPerKm,
  safeMinSocPercent: 15,
  safeMaxSocPercent: 90,
  desiredChargePercent,
  occupancyConsumptionCurve: [
    { occupants: 1, consumptionMultiplier: 1 },
    { occupants: 2, consumptionMultiplier: 1.12 },
  ],
});

const NMC_2W_LOW_RANGE = (capacity: number, whPerKm: number): BatteryProfile => ({
  ...NMC_2W(capacity, whPerKm, 80),
  safeMinSocPercent: 18,
  safeMaxSocPercent: 88,
});

const NMC_4W = (capacity: number, whPerKm: number, desiredChargePercent = 86): BatteryProfile => ({
  chemistry: "NMC",
  ratedCapacityKWh: capacity,
  nominalWhPerKm: whPerKm,
  safeMinSocPercent: 12,
  safeMaxSocPercent: 92,
  desiredChargePercent,
  occupancyConsumptionCurve: [
    { occupants: 1, consumptionMultiplier: 1 },
    { occupants: 2, consumptionMultiplier: 1.035 },
    { occupants: 3, consumptionMultiplier: 1.07 },
    { occupants: 4, consumptionMultiplier: 1.11 },
    { occupants: 5, consumptionMultiplier: 1.15 },
  ],
});

const LFP_4W = (capacity: number, whPerKm: number, desiredChargePercent = 90): BatteryProfile => ({
  chemistry: "LFP",
  ratedCapacityKWh: capacity,
  nominalWhPerKm: whPerKm,
  safeMinSocPercent: 10,
  safeMaxSocPercent: 95,
  desiredChargePercent,
  occupancyConsumptionCurve: [
    { occupants: 1, consumptionMultiplier: 1 },
    { occupants: 2, consumptionMultiplier: 1.035 },
    { occupants: 3, consumptionMultiplier: 1.07 },
    { occupants: 4, consumptionMultiplier: 1.11 },
    { occupants: 5, consumptionMultiplier: 1.15 },
  ],
});

export const CARGO_PENALTY_WH_PER_100KG = 2.5;

export const VEHICLES: Vehicle[] = [
  { id: "ather-450x", name: "Ather 450X", brand: "Ather", class: "2W", batteryKWh: 3.7, baseConsumptionWhPerKm: 36, claimedRangeKm: 105, maxChargeKW: 3.3, connectorType: "15A Socket", safetyReservePercent: 15, chargeEfficiency: 0.9, weightKg: 111, batteryProfile: NMC_2W(3.7, 36, 82) },
  { id: "ola-s1-pro", name: "Ola S1 Pro", brand: "Ola Electric", class: "2W", batteryKWh: 3.97, baseConsumptionWhPerKm: 38, claimedRangeKm: 121, maxChargeKW: 3.3, connectorType: "15A Socket", safetyReservePercent: 15, chargeEfficiency: 0.88, weightKg: 125, batteryProfile: NMC_2W(3.97, 38, 82) },
  { id: "tvs-iqube", name: "TVS iQube S", brand: "TVS", class: "2W", batteryKWh: 3.4, baseConsumptionWhPerKm: 37, claimedRangeKm: 100, maxChargeKW: 3.3, connectorType: "15A Socket", safetyReservePercent: 15, chargeEfficiency: 0.9, weightKg: 118, batteryProfile: NMC_2W(3.4, 37, 84) },
  { id: "bajaj-chetak", name: "Bajaj Chetak Premium", brand: "Bajaj", class: "2W", batteryKWh: 3.0, baseConsumptionWhPerKm: 34, claimedRangeKm: 90, maxChargeKW: 3.3, connectorType: "Bharat AC-001", safetyReservePercent: 15, chargeEfficiency: 0.9, weightKg: 102, batteryProfile: NMC_2W(3.0, 34, 86) },
  { id: "simple-one", name: "Simple One", brand: "Simple Energy", class: "2W", batteryKWh: 4.8, baseConsumptionWhPerKm: 40, claimedRangeKm: 127, maxChargeKW: 3.3, connectorType: "Type 2", safetyReservePercent: 12, chargeEfficiency: 0.91, weightKg: 158, batteryProfile: NMC_2W(4.8, 40, 84) },
  { id: "hero-optima", name: "Hero Electric Optima CX", brand: "Hero Electric", class: "2W", batteryKWh: 1.92, baseConsumptionWhPerKm: 28, claimedRangeKm: 82, maxChargeKW: 0.8, connectorType: "15A Socket", safetyReservePercent: 18, chargeEfficiency: 0.86, weightKg: 73, batteryProfile: NMC_2W_LOW_RANGE(1.92, 28) },
  { id: "tata-nexon-ev", name: "Tata Nexon EV (Long Range)", brand: "Tata", class: "4W", batteryKWh: 40.5, baseConsumptionWhPerKm: 146, claimedRangeKm: 275, maxChargeKW: 50, connectorType: "CCS2", safetyReservePercent: 12, chargeEfficiency: 0.92, weightKg: 1400, batteryProfile: LFP_4W(40.5, 146, 90) },
  { id: "tata-tiago-ev", name: "Tata Tiago EV", brand: "Tata", class: "4W", batteryKWh: 24, baseConsumptionWhPerKm: 115, claimedRangeKm: 250, maxChargeKW: 25, connectorType: "CCS2", safetyReservePercent: 12, chargeEfficiency: 0.91, weightKg: 1235, batteryProfile: LFP_4W(24, 115, 90) },
  { id: "mg-zs-ev", name: "MG ZS EV", brand: "MG Motor", class: "4W", batteryKWh: 50.3, baseConsumptionWhPerKm: 155, claimedRangeKm: 461, maxChargeKW: 76, connectorType: "CCS2", safetyReservePercent: 10, chargeEfficiency: 0.93, weightKg: 1620, batteryProfile: NMC_4W(50.3, 155, 85) },
  { id: "hyundai-kona", name: "Hyundai Kona Electric", brand: "Hyundai", class: "4W", batteryKWh: 39.2, baseConsumptionWhPerKm: 140, claimedRangeKm: 452, maxChargeKW: 50, connectorType: "CCS2", safetyReservePercent: 10, chargeEfficiency: 0.93, weightKg: 1490, batteryProfile: NMC_4W(39.2, 140, 85) },
  { id: "mahindra-xuv400", name: "Mahindra XUV400", brand: "Mahindra", class: "4W", batteryKWh: 39.4, baseConsumptionWhPerKm: 148, claimedRangeKm: 375, maxChargeKW: 50, connectorType: "CCS2", safetyReservePercent: 12, chargeEfficiency: 0.92, weightKg: 1580, batteryProfile: NMC_4W(39.4, 148, 86) },
];

export function getVehicle(id: string): Vehicle | undefined {
  return VEHICLES.find((v) => v.id === id);
}

export const DEFAULT_VEHICLE_ID = "ather-450x";
