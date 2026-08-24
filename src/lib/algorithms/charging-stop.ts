import type { ChargingStopPlan, DrivingPreference, LiveStation, StopWeights, Vehicle } from "@/lib/types";
import { DEFAULT_STOP_WEIGHTS } from "@/lib/types";
import { chargeTimeMinutes } from "@/lib/models/battery";

export interface StationCandidateInput {
  station: LiveStation;
  detourKm: number;
  detourMinutes: number;
  arriveSocPercent: number;
  distanceFromOriginKm: number;
  remainingToDestKm: number;
  predictedAvailability: number;
  preference: DrivingPreference;
  vehicle: Vehicle;
  targetDepartSoc: number;
  weights?: StopWeights;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Energy-safety peaks when the rider arrives at the charger with a healthy
 * but not excessive SOC — charging too late is risky; charging in the first
 * few kilometres is rarely necessary on this corridor.
 */
function energySafetyScore(arriveSoc: number, reserve: number): number {
  if (arriveSoc < reserve + 2) return 0.08;
  if (arriveSoc < reserve + 8) return 0.4;
  if (arriveSoc >= 22 && arriveSoc <= 42) return 1;
  if (arriveSoc > 42 && arriveSoc <= 55) return 0.72;
  if (arriveSoc > 55) return 0.5;
  return 0.62;
}

export function scoreChargingStation(input: StationCandidateInput): ChargingStopPlan {
  const weights = input.weights ?? DEFAULT_STOP_WEIGHTS;
  const s = input.station;
  const chargeMin = chargeTimeMinutes(
    input.vehicle,
    input.arriveSocPercent,
    input.targetDepartSoc,
    s.powerKW,
  );
  const queue = s.estimatedQueueMinutes;
  const totalChargeBlock = chargeMin + queue;

  const availScore = clamp01(input.predictedAvailability);
  const detourScore = 1 - clamp01(input.detourMinutes / 18);
  const chargeScore = 1 - clamp01(totalChargeBlock / 70);
  const safetyScore = energySafetyScore(input.arriveSocPercent, input.vehicle.safetyReservePercent);
  const priceScore = 1 - clamp01((s.pricePerKWh - 8) / 14);

  let w = { ...weights };
  if (input.preference === "reliability") {
    w = {
      predictedAvailability: 0.46,
      additionalTravelTime: 0.14,
      chargingTime: 0.12,
      energySafety: 0.2,
      price: 0.08,
    };
  } else if (input.preference === "efficient") {
    w = {
      predictedAvailability: 0.22,
      additionalTravelTime: 0.18,
      chargingTime: 0.18,
      energySafety: 0.28,
      price: 0.14,
    };
  }

  const score =
    100 *
    (w.predictedAvailability * availScore +
      w.additionalTravelTime * detourScore +
      w.chargingTime * chargeScore +
      w.energySafety * safetyScore +
      w.price * priceScore);

  const energyKWh =
    (input.vehicle.batteryKWh * Math.max(0, input.targetDepartSoc - input.arriveSocPercent)) /
    100;
  const cost = energyKWh * s.pricePerKWh;

  const why = buildWhy(s, input, availScore, detourScore, safetyScore, chargeMin);

  return {
    stationId: s.id,
    stationName: s.name,
    operator: s.operator,
    arriveSocPercent: Number(input.arriveSocPercent.toFixed(1)),
    departSocPercent: Number(input.targetDepartSoc.toFixed(1)),
    chargeMinutes: Math.round(chargeMin),
    queueMinutes: queue,
    energyAddedKWh: Number(energyKWh.toFixed(2)),
    costInr: Math.round(cost),
    detourKm: Number(input.detourKm.toFixed(2)),
    detourMinutes: Number(input.detourMinutes.toFixed(1)),
    predictedAvailability: input.predictedAvailability,
    score: Number(score.toFixed(1)),
    scoreBreakdown: {
      predictedAvailability: Number((availScore * 100).toFixed(1)),
      additionalTravelTime: Number((detourScore * 100).toFixed(1)),
      chargingTime: Number((chargeScore * 100).toFixed(1)),
      energySafety: Number((safetyScore * 100).toFixed(1)),
      price: Number((priceScore * 100).toFixed(1)),
    },
    whySelected: why,
    connectorType: s.connectorType,
    powerKW: s.powerKW,
    latitude: s.latitude,
    longitude: s.longitude,
    etaIso: "",
  };
}

function buildWhy(
  s: LiveStation,
  input: StationCandidateInput,
  availScore: number,
  detourScore: number,
  safetyScore: number,
  chargeMin: number,
): string {
  const detour =
    input.detourMinutes < 1.5
      ? "it sits on your GST corridor with a negligible detour"
      : `it adds only ${input.detourMinutes.toFixed(0)} min of detour`;
  const avail = `${Math.round(input.predictedAvailability * 100)}% predicted availability when you arrive`;
  const charge = `about ${Math.round(chargeMin)} min of charging`;
  return `Recommended because ${s.name} has ${avail}, ${detour}, and needs ${charge}. Energy safety at arrival is ${Math.round(safetyScore * 100)}% (SOC ${input.arriveSocPercent.toFixed(0)}%). Closest is not automatically selected — availability and charging time outrank raw proximity.`;
}

export function rankStations(inputs: StationCandidateInput[]): ChargingStopPlan[] {
  return inputs
    .map(scoreChargingStation)
    .sort((a, b) => b.score - a.score);
}
