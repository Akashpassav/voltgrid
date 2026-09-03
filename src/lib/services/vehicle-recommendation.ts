/**
 * Suggests switching to a four-wheeler when the selected 2/3-wheeler is a
 * poor fit for a trip's distance — long charging detours, multiple stops,
 * or a trip that's outright unreachable on a small pack. This never blocks
 * or overrides the user's choice; it's an optional callout attached to the
 * optimize response.
 */
import { VEHICLES } from "@/lib/data/vehicles";
import type { Vehicle, VehicleRecommendation } from "@/lib/types";

// A 2/3-wheeler trip that eats this much of the vehicle's claimed range, or
// needs this many charging stops, is the point where a 4-wheeler's larger
// pack and faster DC charging becomes a meaningfully better fit.
const RANGE_USAGE_THRESHOLD = 0.85;
const STOP_COUNT_THRESHOLD = 2;

export interface CurrentTripStats {
  vehicle: Vehicle;
  distanceKm: number;
  chargingStopsCount: number;
  totalMinutes: number | null;
  unreachable: boolean;
}

/** Picks the 4-wheeler whose claimed range most comfortably (but not
 * wastefully) covers the trip distance — the smallest pack that still
 * clears the trip with reserve, or the largest available pack if none
 * comfortably clears it outright. */
function pickBestFourWheeler(distanceKm: number): Vehicle | undefined {
  const fourWheelers = VEHICLES.filter((v) => v.class === "4W");
  if (fourWheelers.length === 0) return undefined;

  const comfortable = fourWheelers
    .filter((v) => v.claimedRangeKm * 0.85 >= distanceKm)
    .sort((a, b) => a.claimedRangeKm - b.claimedRangeKm);
  if (comfortable.length > 0) return comfortable[0];

  // Nothing clears it outright (very long trip) — recommend the longest-range option.
  return [...fourWheelers].sort((a, b) => b.claimedRangeKm - a.claimedRangeKm)[0];
}

/** Rough stop-count estimate for a 4-wheeler on this distance, used only
 * for the comparison shown to the user — not a substitute for actually
 * re-running the optimizer with that vehicle. */
function estimateStopsForVehicle(vehicle: Vehicle, distanceKm: number): number {
  const usableRangeKm = vehicle.claimedRangeKm * (1 - vehicle.safetyReservePercent / 100);
  if (usableRangeKm <= 0) return 0;
  return Math.max(0, Math.ceil(distanceKm / usableRangeKm) - 1);
}

export function recommendVehicleIfBetter(stats: CurrentTripStats): VehicleRecommendation | undefined {
  const { vehicle, distanceKm, chargingStopsCount, totalMinutes, unreachable } = stats;

  // Only suggest moving *up* to a 4-wheeler — never suggest a 2W for a 4W trip.
  if (vehicle.class === "4W") return undefined;

  const rangeUsage = distanceKm / vehicle.claimedRangeKm;
  const worthSuggesting =
    unreachable || rangeUsage >= RANGE_USAGE_THRESHOLD || chargingStopsCount >= STOP_COUNT_THRESHOLD;
  if (!worthSuggesting) return undefined;

  const candidate = pickBestFourWheeler(distanceKm);
  if (!candidate) return undefined;

  const recommendedStops = estimateStopsForVehicle(candidate, distanceKm);

  let reason: string;
  if (unreachable) {
    reason =
      `Your ${vehicle.name} (${vehicle.claimedRangeKm} km claimed range) cannot safely complete this ` +
      `${distanceKm.toFixed(0)} km trip. The ${candidate.name} has a ${candidate.claimedRangeKm} km range ` +
      `and DC fast charging up to ${candidate.maxChargeKW} kW, making this trip realistic in a single day.`;
  } else if (chargingStopsCount >= STOP_COUNT_THRESHOLD) {
    reason =
      `This trip needs ${chargingStopsCount} charging stops on your ${vehicle.name}. The ${candidate.name}'s ` +
      `larger ${candidate.batteryKWh.toFixed(1)} kWh pack would likely need only ${recommendedStops}, ` +
      `cutting total trip time.`;
  } else {
    reason =
      `This ${distanceKm.toFixed(0)} km trip uses ${(rangeUsage * 100).toFixed(0)}% of your ${vehicle.name}'s ` +
      `claimed range, leaving little margin. The ${candidate.name} (${candidate.claimedRangeKm} km range) ` +
      `gives a comfortable buffer for a long-distance drive.`;
  }

  return {
    vehicleId: candidate.id,
    vehicleName: candidate.name,
    vehicleClass: candidate.class,
    reason,
    comparison: {
      currentVehicleName: vehicle.name,
      currentChargingStops: chargingStopsCount,
      currentTotalMinutes: totalMinutes,
      recommendedChargingStops: recommendedStops,
      // We don't re-run full route optimisation for the candidate vehicle here,
      // so we don't fabricate a total-time figure for it.
      recommendedTotalMinutes: null,
    },
  };
}
