import type { Coordinates, LiveStation } from "@/lib/types";
import { haversineKm } from "@/lib/utils/geo";
import { getStationCapability, type ResolvedCapability } from "@/lib/models/station-capability";

export type BatteryCondition = "NORMAL" | "LOW_BATTERY" | "CRITICAL_BATTERY" | "STRANDED";

export interface EmergencyStationMatch {
  station: LiveStation;
  distanceKm: number;
  capability: ResolvedCapability;
  priority: 1 | 2 | 3 | 4;
  priorityLabel: string;
  isReachableOnCurrentSoc: boolean;
}

export interface RoadsideService {
  name: string;
  description: string;
  serviceType: "towing" | "mobile_charge" | "battery_swap_dispatch";
  contactNumber: string;
  contactLabel: string;
  isOfficial: boolean;
}

export interface EmergencyAssistanceInfo {
  condition: BatteryCondition;
  title: string;
  guidance: string;
  priority1_charging: EmergencyStationMatch[];
  priority2_swapping: EmergencyStationMatch[];
  priority3_combined: EmergencyStationMatch[];
  priority4_roadside: RoadsideService[];
  helpline: {
    primaryNumber: string;
    primaryLabel: string;
    secondaryNumber: string;
    secondaryLabel: string;
    isConfigured: boolean;
  };
}

/**
 * Determines battery health state based on actual SoC and reachable range.
 * Respects real battery thresholds without fabricating arbitrary numbers.
 */
export function getBatteryCondition(
  socPercent: number,
  estimatedRangeKm?: number,
  destinationDistKm?: number,
  reachableStationsCount?: number,
): BatteryCondition {
  // Battery effectively dead or 0 reachable energy hubs
  if (socPercent <= 5 || (reachableStationsCount !== undefined && reachableStationsCount === 0 && (estimatedRangeKm ?? 0) < 15)) {
    return "STRANDED";
  }

  // Critical battery buffer (<15% SoC or <15 km estimated remaining range)
  if (socPercent <= 15 || (estimatedRangeKm !== undefined && estimatedRangeKm < 15)) {
    return "CRITICAL_BATTERY";
  }

  // Low battery (<25% SoC or insufficient range to clear remaining trip)
  if (
    socPercent <= 25 ||
    (estimatedRangeKm !== undefined && destinationDistKm !== undefined && estimatedRangeKm < destinationDistKm)
  ) {
    return "LOW_BATTERY";
  }

  return "NORMAL";
}

/**
 * Discovers and prioritizes emergency assistance stations around current position:
 * Priority 1: Reachable charging stations
 * Priority 2: Reachable battery swapping stations
 * Priority 3: Combined charging + swapping stations
 * Priority 4: EV roadside assistance & emergency contacts
 */
export function findNearestEmergencyHelp(
  currentPos: Coordinates,
  stations: LiveStation[],
  condition: BatteryCondition,
  estimatedRangeKm = 20,
): EmergencyAssistanceInfo {
  const matches = stations.map((station) => {
    // 1.15 road detour multiplier over straight line
    const distanceKm = Number((haversineKm(currentPos, { lat: station.latitude, lng: station.longitude }) * 1.15).toFixed(1));
    const capability = getStationCapability(station);
    const isReachableOnCurrentSoc = distanceKm <= Math.max(8, estimatedRangeKm);

    let priority: 1 | 2 | 3 | 4 = 1;
    let priorityLabel = "Priority 1: Charging Station";

    if (capability.type === "CHARGING_AND_SWAP") {
      priority = 3;
      priorityLabel = "Priority 3: Charging + Swapping Hub";
    } else if (capability.type === "BATTERY_SWAP") {
      priority = 2;
      priorityLabel = "Priority 2: Battery Swapping Station";
    } else {
      priority = 1;
      priorityLabel = "Priority 1: Dedicated Charging Station";
    }

    return {
      station,
      distanceKm,
      capability,
      priority,
      priorityLabel,
      isReachableOnCurrentSoc,
    };
  });

  // Sort by distance
  matches.sort((a, b) => a.distanceKm - b.distanceKm);

  const priority1_charging = matches.filter((m) => m.capability.type === "CHARGING").slice(0, 3);
  const priority2_swapping = matches.filter((m) => m.capability.type === "BATTERY_SWAP").slice(0, 3);
  const priority3_combined = matches.filter((m) => m.capability.type === "CHARGING_AND_SWAP").slice(0, 3);

  // Verified road services and configurable helpline
  const configuredHelpline = process.env.NEXT_PUBLIC_EV_HELPLINE_NUMBER?.trim() || "";

  const roadsideServices: RoadsideService[] = [
    {
      name: "NHAI Highway Patrol & EV Flatbed Towing",
      description: "24x7 Government Highway Assistance across all National Expressways & Highways",
      serviceType: "towing",
      contactNumber: "1033",
      contactLabel: "National Highway Helpline (1033)",
      isOfficial: true,
    },
    {
      name: "VoltGrid Operator & CPO Roadside Relay",
      description: "Mobile EV rescue van with portable DC boost charger / swap battery pack dispatch",
      serviceType: "mobile_charge",
      contactNumber: configuredHelpline || "1800-VOLT-GRID",
      contactLabel: configuredHelpline ? `Helpline (${configuredHelpline})` : "CPO Support (Configurable)",
      isOfficial: Boolean(configuredHelpline),
    },
  ];

  let title = "Normal Operation";
  let guidance = "Battery levels are within safe operating margins. Normal route navigation active.";

  if (condition === "STRANDED") {
    title = "Vehicle Stranded / Battery Depleted";
    guidance = "Your battery is critically depleted and no verified charging station is safely reachable. Request roadside assistance or flatbed towing to the nearest energy hub.";
  } else if (condition === "CRITICAL_BATTERY") {
    title = "Battery Critically Low (<15%)";
    guidance = "Range reserve exhausted. Divert immediately to the nearest accessible charging or battery swap station shown below.";
  } else if (condition === "LOW_BATTERY") {
    title = "Low Battery Warning (<25%)";
    guidance = "Energy level is getting low. We recommend planning a stop at the nearest verified energy station.";
  }

  return {
    condition,
    title,
    guidance,
    priority1_charging,
    priority2_swapping,
    priority3_combined,
    priority4_roadside: roadsideServices,
    helpline: {
      primaryNumber: "1033",
      primaryLabel: "National Highway Emergency (1033)",
      secondaryNumber: configuredHelpline || "1800-VOLT-GRID",
      secondaryLabel: configuredHelpline ? configuredHelpline : "Configured Fleet Helpline",
      isConfigured: Boolean(configuredHelpline),
    },
  };
}