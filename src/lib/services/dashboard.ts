import { recommendedChargingWindows, gridHintForTrip } from "@/lib/models/grid";
import { utilizationByHour } from "@/lib/models/prediction";
import { getChargingProvider } from "@/lib/services/charging-provider";
import { getScenario, simulationNow } from "@/lib/store/simulation";
import type { DashboardMetrics } from "@/lib/types";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const stations = await getChargingProvider().getStations();
  const now = simulationNow();
  const hour = new Date(now.getTime() + 330 * 60_000).getHours();

  const counts = {
    available: stations.filter((s) => s.status === "available").length,
    busy: stations.filter((s) => s.status === "busy").length,
    offline: stations.filter((s) => s.status === "offline").length,
    maintenance: stations.filter((s) => s.status === "maintenance").length,
    limited: stations.filter((s) => s.status === "limited").length,
  };

  const avgUtil =
    stations.reduce((s, x) => s + x.occupancyRatio, 0) / Math.max(1, stations.length);
  const avgQueue =
    stations.reduce((s, x) => s + x.estimatedQueueMinutes, 0) / Math.max(1, stations.length);

  const mostReliable = [...stations]
    .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
    .slice(0, 5)
    .map((s) => ({ id: s.id, name: s.name, reliability: s.reliabilityScore }));

  const likelyBusy = [...stations]
    .map((s) => ({
      id: s.id,
      name: s.name,
      probabilityBusy: Number((1 - s.predictedAvailability).toFixed(3)),
    }))
    .sort((a, b) => b.probabilityBusy - a.probabilityBusy)
    .slice(0, 5);

  const utilizationByHourArr = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    utilization: Number(
      (
        utilizationByHour("highway")[h] * 0.45 +
        utilizationByHour("transit")[h] * 0.3 +
        utilizationByHour("office")[h] * 0.25
      ).toFixed(3),
    ),
  }));

  const demandForecast = utilizationByHourArr.map((x) => ({
    hour: x.hour,
    demand: Number((x.utilization * 1.15 + (x.hour >= 18 && x.hour < 21 ? 0.08 : 0)).toFixed(3)),
  }));

  const averageQueueByHour = utilizationByHourArr.map((x) => ({
    hour: x.hour,
    minutes: Number((4 + x.utilization * 22).toFixed(1)),
  }));

  const scenario = getScenario();
  const alerts: string[] = [
    "Station VG-031 is expected to reach 90% utilization between 6:30 PM–8:00 PM.",
    "Encourage off-peak charging between 11 AM–4 PM.",
    gridHintForTrip(hour),
  ];
  if (scenario.failedStationIds.length) {
    alerts.unshift(
      `Simulation: ${scenario.failedStationIds.join(", ")} forced offline — riders on GST should reroute.`,
    );
  }
  if (scenario.highDemand) {
    alerts.unshift("High-demand scenario active: queues inflated across transit hubs.");
  }

  const karnatakaStations = stations.filter((s) => s.city === "Bengaluru").length;
  const tamilNaduStations = stations.length - karnatakaStations;

  return {
    totalChargers: stations.length,
    tamilNaduStations,
    karnatakaStations,
    available: counts.available,
    busy: counts.busy,
    offline: counts.offline,
    maintenance: counts.maintenance,
    limited: counts.limited,
    averageUtilization: Number((avgUtil * 100).toFixed(1)),
    averageQueueMinutes: Number(avgQueue.toFixed(1)),
    predictedDemandIndex: Number((avgUtil * 100 * (hour >= 18 ? 1.2 : 0.9)).toFixed(0)),
    peakHours: "6 PM – 9 PM IST",
    mostReliable,
    likelyBusy,
    utilizationByHour: utilizationByHourArr,
    demandForecast,
    statusDistribution: [
      { status: "available", count: counts.available },
      { status: "limited", count: counts.limited },
      { status: "busy", count: counts.busy },
      { status: "offline", count: counts.offline },
      { status: "maintenance", count: counts.maintenance },
    ],
    averageQueueByHour,
    operatorAlerts: alerts,
    gridWindows: recommendedChargingWindows(stations, hour),
  };
}
