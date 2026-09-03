import type { BatteryProfile, Vehicle } from "@/lib/types";

/**
 * Seed values are transparent planning assumptions, not OEM BMS limits.
 * Chemistry can vary by model year/variant, so treat these as prototype data.
 *
 * Values marked [EST] are estimates derived from publicly available
 * specifications and should NOT be presented as manufacturer data.
 */
const NMC_2W = (capacity: number, whPerKm: number, desiredChargePercent = 82): BatteryProfile => ({
  chemistry: "NMC",
  ratedCapacityKWh: capacity,
  nominalWhPerKm: whPerKm,
  safeMinSocPercent: 15,
  safeMaxSocPercent: 95,
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

/** LFP variant for 2-wheelers (some newer budget models use LFP chemistry) */
const LFP_2W = (capacity: number, whPerKm: number, desiredChargePercent = 88): BatteryProfile => ({
  chemistry: "LFP",
  ratedCapacityKWh: capacity,
  nominalWhPerKm: whPerKm,
  safeMinSocPercent: 10,
  safeMaxSocPercent: 95,
  desiredChargePercent,
  occupancyConsumptionCurve: [
    { occupants: 1, consumptionMultiplier: 1 },
    { occupants: 2, consumptionMultiplier: 1.12 },
  ],
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
  // ─────────────────────────────────────────────────────────────────────────
  // 2-WHEELERS
  // ─────────────────────────────────────────────────────────────────────────

  // ── Ather ─────────────────────────────────────────────────────────────────
  {
    id: "ather-450x",
    name: "Ather 450X",
    brand: "Ather",
    class: "2W",
    batteryKWh: 3.7,
    baseConsumptionWhPerKm: 36,
    claimedRangeKm: 105,
    maxChargeKW: 3.3,
    connectorType: "15A Socket",
    safetyReservePercent: 15,
    chargeEfficiency: 0.9,
    weightKg: 111,
    batteryProfile: NMC_2W(3.7, 36, 82),
  },
  {
    id: "ather-450s",
    name: "Ather 450S",
    brand: "Ather",
    class: "2W",
    batteryKWh: 3.7,
    baseConsumptionWhPerKm: 37, // [EST] slightly higher than 450X due to lower efficiency profile
    claimedRangeKm: 115,
    maxChargeKW: 3.3,
    connectorType: "15A Socket",
    safetyReservePercent: 15,
    chargeEfficiency: 0.9,
    weightKg: 108,
    batteryProfile: NMC_2W(3.7, 37, 82),
  },

  // ── Ola Electric ──────────────────────────────────────────────────────────
  {
    id: "ola-s1-pro",
    name: "Ola S1 Pro",
    brand: "Ola Electric",
    class: "2W",
    batteryKWh: 3.97,
    baseConsumptionWhPerKm: 38,
    claimedRangeKm: 121,
    maxChargeKW: 3.3,
    connectorType: "15A Socket",
    safetyReservePercent: 15,
    chargeEfficiency: 0.88,
    weightKg: 125,
    batteryProfile: NMC_2W(3.97, 38, 82),
  },
  {
    id: "ola-s1-air",
    name: "Ola S1 Air",
    brand: "Ola Electric",
    class: "2W",
    batteryKWh: 2.5,
    baseConsumptionWhPerKm: 33, // [EST]
    claimedRangeKm: 101,
    maxChargeKW: 3.3,
    connectorType: "15A Socket",
    safetyReservePercent: 15,
    chargeEfficiency: 0.88,
    weightKg: 99,
    batteryProfile: NMC_2W(2.5, 33, 80),
  },
  {
    id: "ola-s1-x-plus",
    name: "Ola S1 X+",
    brand: "Ola Electric",
    class: "2W",
    batteryKWh: 3.97,
    baseConsumptionWhPerKm: 37, // [EST]
    claimedRangeKm: 151,
    maxChargeKW: 3.3,
    connectorType: "15A Socket",
    safetyReservePercent: 15,
    chargeEfficiency: 0.88,
    weightKg: 108,
    batteryProfile: NMC_2W(3.97, 37, 82),
  },

  // ── TVS ───────────────────────────────────────────────────────────────────
  {
    id: "tvs-iqube",
    name: "TVS iQube S",
    brand: "TVS",
    class: "2W",
    batteryKWh: 3.4,
    baseConsumptionWhPerKm: 37,
    claimedRangeKm: 100,
    maxChargeKW: 3.3,
    connectorType: "15A Socket",
    safetyReservePercent: 15,
    chargeEfficiency: 0.9,
    weightKg: 118,
    batteryProfile: NMC_2W(3.4, 37, 84),
  },
  {
    id: "tvs-iqube-st",
    name: "TVS iQube ST",
    brand: "TVS",
    class: "2W",
    batteryKWh: 5.1,
    baseConsumptionWhPerKm: 40, // [EST] larger pack, slightly heavier
    claimedRangeKm: 145,
    maxChargeKW: 3.3,
    connectorType: "15A Socket",
    safetyReservePercent: 15,
    chargeEfficiency: 0.9,
    weightKg: 132,
    batteryProfile: NMC_2W(5.1, 40, 84),
  },

  // ── Bajaj ─────────────────────────────────────────────────────────────────
  {
    id: "bajaj-chetak",
    name: "Bajaj Chetak Premium",
    brand: "Bajaj",
    class: "2W",
    batteryKWh: 3.0,
    baseConsumptionWhPerKm: 34,
    claimedRangeKm: 90,
    maxChargeKW: 3.3,
    connectorType: "Bharat AC-001",
    safetyReservePercent: 15,
    chargeEfficiency: 0.9,
    weightKg: 102,
    batteryProfile: NMC_2W(3.0, 34, 86),
  },
  {
    id: "bajaj-chetak-35",
    name: "Bajaj Chetak 35 Series",
    brand: "Bajaj",
    class: "2W",
    batteryKWh: 3.2,
    baseConsumptionWhPerKm: 33, // [EST]
    claimedRangeKm: 123,
    maxChargeKW: 3.3,
    connectorType: "Bharat AC-001",
    safetyReservePercent: 15,
    chargeEfficiency: 0.9,
    weightKg: 105,
    batteryProfile: NMC_2W(3.2, 33, 86),
  },

  // ── Simple Energy ─────────────────────────────────────────────────────────
  {
    id: "simple-one",
    name: "Simple One",
    brand: "Simple Energy",
    class: "2W",
    batteryKWh: 4.8,
    baseConsumptionWhPerKm: 40,
    claimedRangeKm: 127,
    maxChargeKW: 3.3,
    connectorType: "Type 2",
    safetyReservePercent: 12,
    chargeEfficiency: 0.91,
    weightKg: 158,
    batteryProfile: NMC_2W(4.8, 40, 84),
  },

  // ── Hero Electric ─────────────────────────────────────────────────────────
  {
    id: "hero-optima",
    name: "Hero Electric Optima CX",
    brand: "Hero Electric",
    class: "2W",
    batteryKWh: 1.92,
    baseConsumptionWhPerKm: 28,
    claimedRangeKm: 82,
    maxChargeKW: 0.8,
    connectorType: "15A Socket",
    safetyReservePercent: 18,
    chargeEfficiency: 0.86,
    weightKg: 73,
    batteryProfile: NMC_2W_LOW_RANGE(1.92, 28),
  },

  // ── Hero Vida ─────────────────────────────────────────────────────────────
  {
    id: "hero-vida-v1-pro",
    name: "Hero Vida V1 Pro",
    brand: "Hero MotoCorp",
    class: "2W",
    batteryKWh: 3.44,
    baseConsumptionWhPerKm: 35, // [EST]
    claimedRangeKm: 143,
    maxChargeKW: 3.3,
    connectorType: "15A Socket",
    safetyReservePercent: 15,
    chargeEfficiency: 0.9,
    weightKg: 117,
    batteryProfile: NMC_2W(3.44, 35, 84),
  },

  // ── Revolt ────────────────────────────────────────────────────────────────
  {
    id: "revolt-rv400",
    name: "Revolt RV400",
    brand: "Revolt Motors",
    class: "2W",
    batteryKWh: 3.24,
    baseConsumptionWhPerKm: 33, // [EST]
    claimedRangeKm: 150,
    maxChargeKW: 3.3,
    connectorType: "15A Socket",
    safetyReservePercent: 15,
    chargeEfficiency: 0.88,
    weightKg: 108,
    batteryProfile: NMC_2W(3.24, 33, 82),
  },

  // ── Ampere ────────────────────────────────────────────────────────────────
  {
    id: "ampere-magnus-ex",
    name: "Ampere Magnus EX",
    brand: "Ampere",
    class: "2W",
    batteryKWh: 1.92,
    baseConsumptionWhPerKm: 26, // [EST]
    claimedRangeKm: 75,
    maxChargeKW: 0.8,
    connectorType: "15A Socket",
    safetyReservePercent: 18,
    chargeEfficiency: 0.86,
    weightKg: 68,
    batteryProfile: LFP_2W(1.92, 26, 85),
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4-WHEELERS
  // ─────────────────────────────────────────────────────────────────────────

  // ── Tata Motors ───────────────────────────────────────────────────────────
  {
    id: "tata-nexon-ev",
    name: "Tata Nexon EV (Long Range)",
    brand: "Tata",
    class: "4W",
    batteryKWh: 40.5,
    baseConsumptionWhPerKm: 146,
    claimedRangeKm: 275,
    maxChargeKW: 50,
    connectorType: "CCS2",
    safetyReservePercent: 12,
    chargeEfficiency: 0.92,
    weightKg: 1400,
    batteryProfile: LFP_4W(40.5, 146, 90),
  },
  {
    id: "tata-tiago-ev",
    name: "Tata Tiago EV",
    brand: "Tata",
    class: "4W",
    batteryKWh: 24,
    baseConsumptionWhPerKm: 115,
    claimedRangeKm: 250,
    maxChargeKW: 25,
    connectorType: "CCS2",
    safetyReservePercent: 12,
    chargeEfficiency: 0.91,
    weightKg: 1235,
    batteryProfile: LFP_4W(24, 115, 90),
  },
  {
    id: "tata-punch-ev",
    name: "Tata Punch EV",
    brand: "Tata",
    class: "4W",
    batteryKWh: 25,
    baseConsumptionWhPerKm: 118, // [EST]
    claimedRangeKm: 350,
    maxChargeKW: 25,
    connectorType: "CCS2",
    safetyReservePercent: 12,
    chargeEfficiency: 0.91,
    weightKg: 1270,
    batteryProfile: LFP_4W(25, 118, 90),
  },
  {
    id: "tata-curvv-ev",
    name: "Tata Curvv EV",
    brand: "Tata",
    class: "4W",
    batteryKWh: 55,
    baseConsumptionWhPerKm: 155, // [EST]
    claimedRangeKm: 502,
    maxChargeKW: 70,
    connectorType: "CCS2",
    safetyReservePercent: 10,
    chargeEfficiency: 0.92,
    weightKg: 1680,
    batteryProfile: LFP_4W(55, 155, 90),
  },

  // ── Mahindra ──────────────────────────────────────────────────────────────
  {
    id: "mahindra-xuv400",
    name: "Mahindra XUV400",
    brand: "Mahindra",
    class: "4W",
    batteryKWh: 39.4,
    baseConsumptionWhPerKm: 148,
    claimedRangeKm: 375,
    maxChargeKW: 50,
    connectorType: "CCS2",
    safetyReservePercent: 12,
    chargeEfficiency: 0.92,
    weightKg: 1580,
    batteryProfile: NMC_4W(39.4, 148, 86),
  },
  {
    id: "mahindra-xuv3xo-ev",
    name: "Mahindra XUV 3XO EV",
    brand: "Mahindra",
    class: "4W",
    batteryKWh: 34.5, // [EST] based on XUV400 platform with smaller pack
    baseConsumptionWhPerKm: 140, // [EST] lighter SUV variant
    claimedRangeKm: 350, // [EST]
    maxChargeKW: 50,
    connectorType: "CCS2",
    safetyReservePercent: 12,
    chargeEfficiency: 0.91,
    weightKg: 1500, // [EST]
    batteryProfile: NMC_4W(34.5, 140, 86),
  },
  {
    id: "mahindra-be6",
    name: "Mahindra BE 6",
    brand: "Mahindra",
    class: "4W",
    batteryKWh: 59,
    baseConsumptionWhPerKm: 158, // [EST]
    claimedRangeKm: 535,
    maxChargeKW: 175,
    connectorType: "CCS2",
    safetyReservePercent: 10,
    chargeEfficiency: 0.93,
    weightKg: 1900,
    batteryProfile: NMC_4W(59, 158, 86),
  },

  // ── MG Motor ──────────────────────────────────────────────────────────────
  {
    id: "mg-zs-ev",
    name: "MG ZS EV",
    brand: "MG Motor",
    class: "4W",
    batteryKWh: 50.3,
    baseConsumptionWhPerKm: 155,
    claimedRangeKm: 461,
    maxChargeKW: 76,
    connectorType: "CCS2",
    safetyReservePercent: 10,
    chargeEfficiency: 0.93,
    weightKg: 1620,
    batteryProfile: NMC_4W(50.3, 155, 85),
  },

  // ── Hyundai ───────────────────────────────────────────────────────────────
  {
    id: "hyundai-kona",
    name: "Hyundai Kona Electric",
    brand: "Hyundai",
    class: "4W",
    batteryKWh: 39.2,
    baseConsumptionWhPerKm: 140,
    claimedRangeKm: 452,
    maxChargeKW: 50,
    connectorType: "CCS2",
    safetyReservePercent: 10,
    chargeEfficiency: 0.93,
    weightKg: 1490,
    batteryProfile: NMC_4W(39.2, 140, 85),
  },

  // ── Kia ───────────────────────────────────────────────────────────────────
  {
    id: "kia-ev6",
    name: "Kia EV6",
    brand: "Kia",
    class: "4W",
    batteryKWh: 77.4,
    baseConsumptionWhPerKm: 165, // [EST] WLTP consumption adjusted for Indian conditions
    claimedRangeKm: 708,
    maxChargeKW: 233,
    connectorType: "CCS2",
    safetyReservePercent: 10,
    chargeEfficiency: 0.94,
    weightKg: 2015,
    batteryProfile: NMC_4W(77.4, 165, 85),
  },

  // ── BYD ───────────────────────────────────────────────────────────────────
  {
    id: "byd-seal",
    name: "BYD Seal",
    brand: "BYD",
    class: "4W",
    batteryKWh: 82.56,
    baseConsumptionWhPerKm: 168, // [EST]
    claimedRangeKm: 650,
    maxChargeKW: 150,
    connectorType: "CCS2",
    safetyReservePercent: 10,
    chargeEfficiency: 0.93,
    weightKg: 2150,
    batteryProfile: LFP_4W(82.56, 168, 90),
  },

  // ── Maruti Suzuki ─────────────────────────────────────────────────────────
  {
    id: "maruti-e-vitara",
    name: "Maruti Suzuki e Vitara",
    brand: "Maruti Suzuki",
    class: "4W",
    batteryKWh: 61, // [EST] based on Toyota/Suzuki BEV platform
    baseConsumptionWhPerKm: 152, // [EST]
    claimedRangeKm: 500, // [EST]
    maxChargeKW: 150, // [EST]
    connectorType: "CCS2",
    safetyReservePercent: 10,
    chargeEfficiency: 0.92,
    weightKg: 1700, // [EST]
    batteryProfile: LFP_4W(61, 152, 90),
  },
];

export function getVehicle(id: string): Vehicle | undefined {
  return VEHICLES.find((v) => v.id === id);
}

export const DEFAULT_VEHICLE_ID = "ather-450x";
