import { STATIONS, getStation } from "@/lib/data/stations";
import { materializeAll, materializeStation } from "@/lib/store/simulation";
import { getStationCoverage, type CoverageStation } from "@/lib/services/station-coverage";
import type { ConnectorType, LiveStation } from "@/lib/types";

/**
 * CPO integration port. Production can add StatiqProvider, TataPowerProvider,
 * or a generic OCPIProvider without changing route optimisation.
 */
export interface ChargingProvider {
  id: string;
  getStations(): Promise<LiveStation[]>;
  getStationStatus(id: string): Promise<LiveStation | undefined>;
  getConnectorStatus(id: string): Promise<{
    total: number;
    available: number;
    type: string;
    powerKW: number;
  } | undefined>;
  getAvailability(id: string): Promise<number | undefined>;
}

export class MockChargingProvider implements ChargingProvider {
  id = "mock-cpo";

  async getStations(): Promise<LiveStation[]> {
    return materializeAll();
  }

  async getStationStatus(id: string): Promise<LiveStation | undefined> {
    return materializeStation(id);
  }

  async getConnectorStatus(id: string) {
    const live = materializeStation(id);
    const seed = getStation(id);
    if (!live || !seed) return undefined;
    return {
      total: live.totalConnectors,
      available: live.availableConnectors,
      type: live.connectorType,
      powerKW: live.powerKW,
    };
  }

  async getAvailability(id: string): Promise<number | undefined> {
    const live = materializeStation(id);
    return live?.predictedAvailability;
  }
}

function mapConnectorType(types: string[]): ConnectorType {
  const joined = types.join(" ").toLowerCase();
  if (joined.includes("ccs")) return "CCS2";
  if (joined.includes("type 2")) return "Type 2";
  if (joined.includes("bharat")) return "Bharat AC-001";
  if (joined.includes("gb/t")) return "GB/T Swap";
  if (joined.includes("15a") || joined.includes("socket")) return "15A Socket";
  return "CCS2";
}

function coverageToLiveStation(s: CoverageStation): LiveStation {
  return {
    id: s.id,
    name: s.name,
    latitude: s.latitude,
    longitude: s.longitude,
    operator: s.operator,
    connectorType: mapConnectorType(s.connectorTypes),
    powerKW: s.powerKW,
    totalConnectors: s.totalConnectors,
    seedAvailableConnectors: s.availableConnectors,
    seedStatus: s.status,
    pricePerKWh: s.pricePerKWh,
    estimatedQueueMinutes: s.estimatedQueueMinutes,
    demandProfile: "highway",
    reliabilityScore: s.reliabilityScore,
    amenity: "",
    address: s.address,
    city: s.region === "bengaluru" ? "Bengaluru" : "Tamil Nadu",
    highway: "",
    provenance: "static_seed",
    availableConnectors: s.availableConnectors,
    status: s.status,
    occupancyRatio: s.status === "offline" ? 1 : 0.2,
    lastUpdated: new Date().toISOString(),
    predictedAvailability: s.predictedAvailability,
    predictionConfidence: "LOW",
    predictionFactors: [],
    dataSourceLabel: "Open Charge Map — Tamil Nadu / Bengaluru coverage",
  };
}

/**
 * Real Open Charge Map station data for Tamil Nadu + Bengaluru, backed by
 * the persisted coverage cache from station-coverage.ts. Unlike
 * MockChargingProvider, these stations have no live occupancy simulation —
 * status reflects OCM's last-known operational state, clearly labelled via
 * dataSourceLabel and provenance.
 */
export class OpenChargeMapProvider implements ChargingProvider {
  id = "open-charge-map";

  async getStations(): Promise<LiveStation[]> {
    const { stations } = await getStationCoverage();
    return stations.map(coverageToLiveStation);
  }

  async getStationStatus(id: string): Promise<LiveStation | undefined> {
    const stations = await this.getStations();
    return stations.find((s) => s.id === id);
  }

  async getConnectorStatus(id: string) {
    const live = await this.getStationStatus(id);
    if (!live) return undefined;
    return {
      total: live.totalConnectors,
      available: live.availableConnectors,
      type: live.connectorType,
      powerKW: live.powerKW,
    };
  }

  async getAvailability(id: string): Promise<number | undefined> {
    const live = await this.getStationStatus(id);
    return live?.predictedAvailability;
  }
}

/**
 * Merges the simulated Chennai-corridor demo fleet (MockChargingProvider —
 * keeps DemoControls' fail/restore/scenario features working exactly as
 * before) with real, state-wide Open Charge Map coverage, so trip
 * optimisation has genuine candidates anywhere in Tamil Nadu + Bengaluru,
 * not just the original 42-station corridor.
 */
export class HybridChargingProvider implements ChargingProvider {
  id = "hybrid";
  private mock = new MockChargingProvider();
  private ocm = new OpenChargeMapProvider();

  async getStations(): Promise<LiveStation[]> {
    const [mockStations, ocmStations] = await Promise.all([
      this.mock.getStations(),
      this.ocm.getStations().catch((err) => {
        console.error("OpenChargeMapProvider.getStations failed, continuing with corridor stations only:", err);
        return [] as LiveStation[];
      }),
    ]);
    const seenIds = new Set(mockStations.map((s) => s.id));
    const extra = ocmStations.filter((s) => !seenIds.has(s.id));
    return [...mockStations, ...extra];
  }

  async getStationStatus(id: string): Promise<LiveStation | undefined> {
    const fromMock = await this.mock.getStationStatus(id);
    if (fromMock) return fromMock;
    return this.ocm.getStationStatus(id);
  }

  async getConnectorStatus(id: string) {
    const fromMock = await this.mock.getConnectorStatus(id);
    if (fromMock) return fromMock;
    return this.ocm.getConnectorStatus(id);
  }

  async getAvailability(id: string): Promise<number | undefined> {
    const fromMock = await this.mock.getAvailability(id);
    if (fromMock !== undefined) return fromMock;
    return this.ocm.getAvailability(id);
  }
}

export class OCPIProvider implements ChargingProvider {
  id = "ocpi";
  async getStations(): Promise<LiveStation[]> {
    throw new Error("OCPIProvider is a production stub.");
  }
  async getStationStatus(): Promise<LiveStation | undefined> {
    return undefined;
  }
  async getConnectorStatus() {
    return undefined;
  }
  async getAvailability(): Promise<number | undefined> {
    return undefined;
  }
}

let current: ChargingProvider = new HybridChargingProvider();

export function getChargingProvider(): ChargingProvider {
  return current;
}

export function setChargingProvider(provider: ChargingProvider): void {
  current = provider;
}

export function staticStationCount(): number {
  return STATIONS.length;
}