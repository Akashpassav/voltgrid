import type { GridWindow, LiveStation } from "@/lib/types";

/**
 * Grid Intelligence Layer — prototype simulation.
 * No real DISCOM SCADA is connected. This encodes time-of-day load shapes
 * plus station demand so the architecture for future grid signals is visible.
 */
export function recommendedChargingWindows(
  stations: LiveStation[],
  hour: number,
): GridWindow[] {
  const windows: GridWindow[] = [
    {
      startHour: 11,
      endHour: 16,
      label: "Preferred off-peak window",
      reason:
        "Charging between 11 AM and 4 PM is recommended due to lower predicted infrastructure load and higher solar availability on the Tamil Nadu daytime curve.",
      relativeLoad: 0.42,
    },
    {
      startHour: 1,
      endHour: 3,
      label: "Overnight valley",
      reason: "Lowest corridor load. Useful for depot / overnight 2W charging.",
      relativeLoad: 0.22,
    },
    {
      startHour: 18,
      endHour: 21,
      label: "Avoid if possible",
      reason:
        "Evening peak — GST Road and OMR hubs show stacked demand from returning commuters.",
      relativeLoad: 0.91,
    },
  ];

  const sholing = stations.find((s) => s.id === "VG-031");
  if (sholing && sholing.occupancyRatio > 0.5) {
    windows.push({
      startHour: 18,
      endHour: 20,
      label: "VG-031 congestion watch",
      reason:
        "Station VG-031 is expected to reach ~90% utilization between 6:30 PM–8:00 PM.",
      relativeLoad: 0.9,
    });
  }

  const current = windows.find((w) => hour >= w.startHour && hour < w.endHour);
  if (!current) {
    windows.unshift({
      startHour: hour,
      endHour: hour + 1,
      label: "Current hour",
      reason: "Grid Intelligence — Prototype Simulation. Live DISCOM feed is not connected.",
      relativeLoad: 0.55,
    });
  }

  return windows;
}

export function gridHintForTrip(hour: number): string {
  if (hour >= 11 && hour < 16) {
    return "Grid Intelligence — Prototype Simulation: charging between 1 PM and 3 PM is recommended due to lower predicted infrastructure load.";
  }
  if (hour >= 18 && hour < 21) {
    return "Grid Intelligence — Prototype Simulation: you are travelling in the evening peak. Prefer hubs with spare connectors; off-peak charging (11 AM–4 PM) is kinder to the corridor.";
  }
  return "Grid Intelligence — Prototype Simulation: corridor load is moderate. Live DISCOM data is not connected; this hint uses a time-of-day load shape.";
}
