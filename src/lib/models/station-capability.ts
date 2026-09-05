import type { ChargingStation, StationCapability, StationCapabilities } from "@/lib/types";

export interface ResolvedCapability extends StationCapabilities {
  type: StationCapability;
  label: string;
  badgeColor: string;
  description: string;
}

/**
 * Classifies station capability generically across all geographies.
 * Detects CHARGING, BATTERY_SWAP, or CHARGING_AND_SWAP based on:
 * 1. Explicit station.capabilities or station.capability metadata
 * 2. Connector type (e.g. "GB/T Swap")
 * 3. Operator and station naming conventions (Sun Mobility, Battery Smart, Bounce Infinity, etc.)
 */
export function getStationCapability(
  station: Partial<ChargingStation> | null | undefined,
): ResolvedCapability {
  if (!station) {
    return {
      type: "CHARGING",
      charging: true,
      batterySwap: false,
      label: "Charging",
      badgeColor: "#34A853",
      description: "Battery charging available",
    };
  }

  // 1. Explicit capabilities if present
  if (station.capabilities) {
    const { charging, batterySwap } = station.capabilities;
    if (charging && batterySwap) {
      return {
        type: "CHARGING_AND_SWAP",
        charging: true,
        batterySwap: true,
        label: "Charging + Swap",
        badgeColor: "#0284C7",
        description: "Both charging and battery swapping available",
      };
    }
    if (batterySwap && !charging) {
      return {
        type: "BATTERY_SWAP",
        charging: false,
        batterySwap: true,
        label: "Battery Swap",
        badgeColor: "#8B5CF6",
        description: "Rapid battery replacement available",
      };
    }
    return {
      type: "CHARGING",
      charging: true,
      batterySwap: false,
      label: "Charging",
      badgeColor: "#34A853",
      description: "Battery charging available",
    };
  }

  if (station.capability) {
    if (station.capability === "CHARGING_AND_SWAP") {
      return {
        type: "CHARGING_AND_SWAP",
        charging: true,
        batterySwap: true,
        label: "Charging + Swap",
        badgeColor: "#0284C7",
        description: "Both charging and battery swapping available",
      };
    }
    if (station.capability === "BATTERY_SWAP") {
      return {
        type: "BATTERY_SWAP",
        charging: false,
        batterySwap: true,
        label: "Battery Swap",
        badgeColor: "#8B5CF6",
        description: "Rapid battery replacement available",
      };
    }
    return {
      type: "CHARGING",
      charging: true,
      batterySwap: false,
      label: "Charging",
      badgeColor: "#34A853",
      description: "Battery charging available",
    };
  }

  // 2. Connector type inference
  const connector = String(station.connectorType ?? "").toLowerCase();
  const name = String(station.name ?? "").toLowerCase();
  const operator = String(station.operator ?? "").toLowerCase();
  const amenity = String(station.amenity ?? "").toLowerCase();

  const isSwapConnector = connector.includes("swap") || connector.includes("gb/t");
  const isSwapBrand =
    name.includes("swap") ||
    operator.includes("sun mobility") ||
    operator.includes("battery smart") ||
    operator.includes("bounce infinity") ||
    operator.includes("yulu") ||
    amenity.includes("swap");

  const hasHighPowerCharger =
    (station.powerKW ?? 0) >= 15 ||
    connector.includes("ccs") ||
    connector.includes("type 2") ||
    connector.includes("bharat");

  // Dual capability: has both fast charging and swapping cues
  if ((isSwapConnector || isSwapBrand) && hasHighPowerCharger && !connector.startsWith("gb/t swap only")) {
    return {
      type: "CHARGING_AND_SWAP",
      charging: true,
      batterySwap: true,
      label: "Charging + Swap",
      badgeColor: "#0284C7",
      description: "Both charging and battery swapping available",
    };
  }

  // Pure battery swap
  if (isSwapConnector || isSwapBrand) {
    return {
      type: "BATTERY_SWAP",
      charging: false,
      batterySwap: true,
      label: "Battery Swap",
      badgeColor: "#8B5CF6",
      description: "Rapid battery replacement available",
    };
  }

  // Default: charging only
  return {
    type: "CHARGING",
    charging: true,
    batterySwap: false,
    label: "Charging",
    badgeColor: "#34A853",
    description: "Battery charging available",
  };
}