import { STATIONS, getStation } from "@/lib/data/stations";
import { materializeAll, materializeStation } from "@/lib/store/simulation";
import type { LiveStation } from "@/lib/types";

/**
 * CPO integration port. The hackathon uses MockChargingProvider.
 * Production can add OpenChargeMapProvider, StatiqProvider, TataPowerProvider,
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

export class OpenChargeMapProvider implements ChargingProvider {
  id = "open-charge-map";
  async getStations(): Promise<LiveStation[]> {
    throw new Error("OpenChargeMapProvider is a production stub — not wired in the MVP.");
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

let current: ChargingProvider = new MockChargingProvider();

export function getChargingProvider(): ChargingProvider {
  return current;
}

export function setChargingProvider(provider: ChargingProvider): void {
  current = provider;
}

export function staticStationCount(): number {
  return STATIONS.length;
}
