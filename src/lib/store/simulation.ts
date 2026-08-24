import { STATIONS } from "@/lib/data/stations";
import { predictAvailability } from "@/lib/models/prediction";
import type { LiveStation, SimulationScenario, StationStatus } from "@/lib/types";
import { occupancyBiasByHour } from "@/lib/utils/time";

const DEFAULT_SCENARIO: SimulationScenario = {
  demandMultiplier: 1,
  trafficMultiplier: 1,
  failedStationIds: [],
  demoClockMinutes: 15 * 60 + 40,
  highDemand: false,
  label: "SIH demo clock 3:40 PM IST",
};

interface StoreState {
  scenario: SimulationScenario;
  tick: number;
  lastTickAt: number;
  startedAt: number;
}

const globalKey = "__voltgrid_sim_store__";

function blank(): StoreState {
  return {
    scenario: { ...DEFAULT_SCENARIO, failedStationIds: [] },
    tick: 0,
    lastTickAt: Date.now(),
    startedAt: Date.now(),
  };
}

export function getStore(): StoreState {
  const g = globalThis as unknown as Record<string, StoreState>;
  if (!g[globalKey]) {
    g[globalKey] = blank();
  }
  return g[globalKey];
}

export function resetSimulation(): SimulationScenario {
  const store = getStore();
  store.scenario = { ...DEFAULT_SCENARIO, failedStationIds: [] };
  store.tick = 0;
  store.lastTickAt = Date.now();
  return getScenario();
}

export function getScenario(): SimulationScenario {
  const s = getStore().scenario;
  return { ...s, failedStationIds: [...s.failedStationIds] };
}

export function patchScenario(patch: Partial<SimulationScenario>): SimulationScenario {
  const store = getStore();
  store.scenario = {
    ...store.scenario,
    ...patch,
    failedStationIds: patch.failedStationIds
      ? [...patch.failedStationIds]
      : [...store.scenario.failedStationIds],
  };
  return getScenario();
}

export function failStation(stationId: string): SimulationScenario {
  const store = getStore();
  if (!store.scenario.failedStationIds.includes(stationId)) {
    store.scenario.failedStationIds = [...store.scenario.failedStationIds, stationId];
  }
  return getScenario();
}

export function bumpTick(): void {
  const store = getStore();
  store.tick += 1;
  store.lastTickAt = Date.now();
}

export function simulationNow(): Date {
  const { demoClockMinutes } = getStore().scenario;
  if (demoClockMinutes == null) return new Date();
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60_000;
  const ist = new Date(utc + 330 * 60_000);
  ist.setHours(Math.floor(demoClockMinutes / 60), demoClockMinutes % 60, 0, 0);
  return new Date(ist.getTime() - 330 * 60_000);
}

function hash(id: string, tick: number): number {
  let h = 0;
  const s = `${id}:${tick}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

function liveStatusFor(seedStatus: StationStatus, occupancy: number, failed: boolean): StationStatus {
  if (failed) return "offline";
  if (seedStatus === "offline" || seedStatus === "maintenance") return seedStatus;
  if (occupancy >= 0.95) return "busy";
  if (occupancy >= 0.65) return "limited";
  if (occupancy >= 0.5 && seedStatus === "busy") return "busy";
  return "available";
}

export function materializeStation(
  id: string,
  etaMinutesFromNow = 25,
): LiveStation | undefined {
  const raw = STATIONS.find((s) => s.id === id);
  if (!raw) return undefined;
  const all = materializeAll(etaMinutesFromNow);
  return all.find((s) => s.id === id);
}

export function materializeAll(etaMinutesFromNow = 25): LiveStation[] {
  const store = getStore();
  const scenario = store.scenario;
  const now = simulationNow();
  const hour = new Date(now.getTime() + 330 * 60_000).getHours();
  const weekday = new Date(now.getTime() + 330 * 60_000).getDay();
  const tick = store.tick;

  return STATIONS.map((s) => {
    const failed = scenario.failedStationIds.includes(s.id);
    const bias = occupancyBiasByHour(hour);
    const jitter = (hash(s.id, Math.floor(tick / 2)) - 0.5) * 0.12;
    let occupancy = 1 - s.seedAvailableConnectors / Math.max(1, s.totalConnectors);
    occupancy += bias * 0.55 * scenario.demandMultiplier;
    occupancy += jitter;
    if (scenario.highDemand) occupancy += 0.22;
    occupancy = Math.min(0.98, Math.max(0.04, occupancy));

    let available = Math.round((1 - occupancy) * s.totalConnectors);
    available = Math.max(0, Math.min(s.totalConnectors, available));
    if (failed || s.seedStatus === "offline") {
      available = 0;
      occupancy = 1;
    }
    if (s.seedStatus === "maintenance") {
      available = 0;
      occupancy = 1;
    }

    const status = liveStatusFor(s.seedStatus, occupancy, failed);
    const queueBase = s.estimatedQueueMinutes;
    const queue = failed
      ? 0
      : Math.max(
          0,
          Math.round(
            (queueBase + occupancy * 14 * scenario.demandMultiplier + (scenario.highDemand ? 10 : 0)) *
              (status === "busy" ? 1.25 : 1),
          ),
        );

    const lastUpdated = now.toISOString();
    const partial = {
      ...s,
      availableConnectors: available,
      status,
      occupancyRatio: Number(occupancy.toFixed(3)),
      estimatedQueueMinutes: queue,
      lastUpdated,
      predictedAvailability: 0,
      predictionConfidence: "MODERATE" as const,
      predictionFactors: [],
      dataSourceLabel: "SIMULATED LIVE DATA",
    };

    const pred = predictAvailability({
      station: partial,
      hour,
      weekday,
      etaMinutesFromNow,
    });
    pred.expectedArrivalIso = lastUpdated;

    return {
      ...partial,
      predictedAvailability: pred.probability,
      predictionConfidence: pred.confidence,
      predictionFactors: pred.factors,
    };
  });
}

export function usableStation(s: LiveStation): boolean {
  return s.status !== "offline" && s.status !== "maintenance" && s.availableConnectors > 0
    ? true
    : s.status !== "offline" && s.status !== "maintenance";
}

export function isStationOnline(s: LiveStation): boolean {
  return s.status !== "offline" && s.status !== "maintenance";
}
