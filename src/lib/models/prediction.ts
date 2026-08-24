import type {
  AvailabilityPrediction,
  DemandProfile,
  LiveStation,
  PredictionFactor,
} from "@/lib/types";
import { occupancyBiasByHour } from "@/lib/utils/time";

/**
 * Lightweight, explainable availability model (logistic regression v1).
 *
 * Features are production-shaped so a future sklearn / LSTM time-series
 * model can replace `predictAvailability` without changing the API.
 *
 * P(available at ETA) = σ(w · x + b)
 */
const WEIGHTS = {
  intercept: -0.35,
  vacancy: 1.35,
  reliability: 1.45,
  offPeak: 0.72,
  queue: 0.55,
  capacity: 0.18,
  power: 0.12,
  weekendMall: -0.28,
  etaFar: -0.15,
};

function sigmoid(z: number): number {
  if (z < -12) return 0;
  if (z > 12) return 1;
  return 1 / (1 + Math.exp(-z));
}

function offPeakScore(hour: number): number {
  if (hour >= 10 && hour < 16) return 1;
  if (hour >= 21 || hour < 7) return 0.85;
  if (hour >= 16 && hour < 17) return 0.35;
  return 0.05;
}

function profileHourOccupancy(profile: DemandProfile, hour: number): number {
  const peak = occupancyBiasByHour(hour);
  const base: Record<DemandProfile, number> = {
    transit: 0.48,
    highway: 0.36,
    mall: 0.42,
    office: 0.4,
    residential: 0.28,
    campus: 0.34,
  };
  return Math.min(0.95, Math.max(0.05, base[profile] + peak));
}

export function historicalOccupancy(profile: DemandProfile, hour: number): number {
  return profileHourOccupancy(profile, hour);
}

export interface PredictInput {
  station: Pick<
    LiveStation,
    | "id"
    | "occupancyRatio"
    | "estimatedQueueMinutes"
    | "totalConnectors"
    | "powerKW"
    | "reliabilityScore"
    | "demandProfile"
    | "status"
  >;
  hour: number;
  weekday: number;
  etaMinutesFromNow: number;
}

export function predictAvailability(input: PredictInput): AvailabilityPrediction {
  const { station, hour, weekday, etaMinutesFromNow } = input;

  if (station.status === "offline" || station.status === "maintenance") {
    return {
      stationId: station.id,
      probability: 0.02,
      expectedArrivalIso: "",
      expectedQueueMinutes: [0, 0],
      confidence: "HIGH",
      factors: [
        {
          name: "Station is offline / in maintenance",
          value: 1,
          contribution: -1,
          direction: "down",
        },
      ],
      model: "logistic_regression_v1",
    };
  }

  const vacancy = 1 - station.occupancyRatio;
  const offPeak = offPeakScore(hour);
  const queueFactor = 1 - Math.min(1, station.estimatedQueueMinutes / 30);
  const capacity = Math.min(1, station.totalConnectors / 6);
  const power = Math.min(1, station.powerKW / 22);
  const weekendMall =
    (weekday === 0 || weekday === 6) && station.demandProfile === "mall" ? 1 : 0;
  const etaFar = Math.min(1, etaMinutesFromNow / 90);

  const terms: PredictionFactor[] = [
    {
      name: "Current vacancy",
      value: vacancy,
      contribution: WEIGHTS.vacancy * vacancy,
      direction: vacancy >= 0.5 ? "up" : "down",
    },
    {
      name: "Historical reliability",
      value: station.reliabilityScore,
      contribution: WEIGHTS.reliability * station.reliabilityScore,
      direction: "up",
    },
    {
      name: "Time of day (off-peak)",
      value: offPeak,
      contribution: WEIGHTS.offPeak * offPeak,
      direction: offPeak > 0.4 ? "up" : "down",
    },
    {
      name: "Queue length",
      value: station.estimatedQueueMinutes,
      contribution: WEIGHTS.queue * queueFactor,
      direction: station.estimatedQueueMinutes <= 8 ? "up" : "down",
    },
    {
      name: "Connector capacity",
      value: station.totalConnectors,
      contribution: WEIGHTS.capacity * capacity,
      direction: "up",
    },
    {
      name: "Charger power",
      value: station.powerKW,
      contribution: WEIGHTS.power * power,
      direction: "up",
    },
    {
      name: "Weekend mall demand",
      value: weekendMall,
      contribution: WEIGHTS.weekendMall * weekendMall,
      direction: weekendMall ? "down" : "up",
    },
    {
      name: "ETA uncertainty",
      value: etaMinutesFromNow,
      contribution: WEIGHTS.etaFar * (1 - etaFar),
      direction: etaMinutesFromNow < 40 ? "up" : "down",
    },
  ];

  const z =
    WEIGHTS.intercept + terms.reduce((sum, t) => sum + t.contribution, 0);
  let probability = sigmoid(z);

  if (station.status === "busy") {
    probability *= 0.72;
    terms.push({
      name: "Currently busy",
      value: 1,
      contribution: -0.4,
      direction: "down",
    });
  } else if (station.status === "limited") {
    probability *= 0.88;
  }

  probability = Math.min(0.97, Math.max(0.03, probability));

  const confidence: AvailabilityPrediction["confidence"] =
    etaMinutesFromNow <= 25 && station.totalConnectors >= 3
      ? "HIGH"
      : etaMinutesFromNow <= 55
        ? "MODERATE"
        : "LOW";

  const q = station.estimatedQueueMinutes;
  return {
    stationId: station.id,
    probability: Number(probability.toFixed(3)),
    expectedArrivalIso: "",
    expectedQueueMinutes: [Math.max(0, q - 3), q + 4] as [number, number],
    confidence,
    factors: terms.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
    model: "logistic_regression_v1",
  };
}

export function utilizationByHour(profile: DemandProfile): number[] {
  return Array.from({ length: 24 }, (_, hour) =>
    Number(profileHourOccupancy(profile, hour).toFixed(3)),
  );
}
