"use client";

import React, { useEffect, useState } from "react";
import { PortalGuard } from "@/lib/auth/AuthContext";
import { StationCard } from "@/components/stations/StationCard";
import { apiGet } from "@/lib/client/api";
import type { DashboardMetrics, LiveStation } from "@/lib/types";
import {
  Activity,
  Zap,
  BatteryCharging,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Settings2,
  TrendingUp,
  Radio,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function OperatorDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [stations, setStations] = useState<LiveStation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [mRes, sRes] = await Promise.all([
          apiGet<{ metrics: DashboardMetrics }>("/api/dashboard/metrics"),
          apiGet<{ stations: LiveStation[] }>("/api/stations"),
        ]);
        setMetrics(mRes.metrics);
        setStations(sRes.stations?.slice(0, 6) || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <PortalGuard allowedRole="operator">
      <div className="min-h-screen bg-navy-950 py-10 px-4">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-electric/15 border border-electric/30 px-3 py-0.5 text-xs font-semibold text-electric mb-2">
                <Radio className="h-3.5 w-3.5 animate-pulse" /> Operator Telemetry Portal
              </div>
              <h1 className="text-3xl font-extrabold text-ink">CPO Hubs & Grid Dashboard</h1>
              <p className="mt-1 text-xs sm:text-sm text-mute">
                Real-time operational health, bay status, queue metrics, and load balancing across your station network.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/operator/bookings"
                className="rounded-xl border border-line bg-navy-900 px-4 py-2 text-xs font-bold text-ink hover:border-electric transition-colors"
              >
                View Bookings Grid
              </Link>
              <Link
                href="/operator/network"
                className="rounded-xl bg-electric px-4 py-2 text-xs font-bold text-white shadow-md shadow-electric/30 hover:bg-blue-600 transition-colors"
              >
                Network Grid Analytics
              </Link>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-line bg-navy-900/90 p-5 shadow-lg">
              <span className="text-[10px] text-mute uppercase font-semibold block">Total Managed Hubs</span>
              <p className="mt-1 font-mono text-3xl font-extrabold text-ink">{metrics?.totalChargers || 925}</p>
              <span className="text-[10px] text-emerald-400 font-medium">● 98.4% uptime</span>
            </div>

            <div className="rounded-2xl border border-line bg-navy-900/90 p-5 shadow-lg">
              <span className="text-[10px] text-mute uppercase font-semibold block">Bays Available</span>
              <p className="mt-1 font-mono text-3xl font-extrabold text-volt">{metrics?.available || 682}</p>
              <span className="text-[10px] text-mute">Out of {metrics?.totalChargers || 925} ports</span>
            </div>

            <div className="rounded-2xl border border-line bg-navy-900/90 p-5 shadow-lg">
              <span className="text-[10px] text-mute uppercase font-semibold block">Average Queue</span>
              <p className="mt-1 font-mono text-3xl font-extrabold text-amber-400">
                {metrics?.averageQueueMinutes || 4} min
              </p>
              <span className="text-[10px] text-mute">Corridor median</span>
            </div>

            <div className="rounded-2xl border border-line bg-navy-900/90 p-5 shadow-lg">
              <span className="text-[10px] text-mute uppercase font-semibold block">Peak Demand Index</span>
              <p className="mt-1 font-mono text-3xl font-extrabold text-electric">
                {metrics?.predictedDemandIndex || "1.34"}
              </p>
              <span className="text-[10px] text-mute">Peak window: 6 PM – 9 PM</span>
            </div>
          </div>

          {/* Operational Alerts & Dispatch Recommendations */}
          <div className="rounded-2xl border border-amber-500/30 bg-navy-900/80 p-6 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Automated Grid Load & Dispatch Recommendations
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 text-xs">
              {(metrics?.operatorAlerts || [
                "Sholinganallur Hub: High DC fast demand detected. Dynamic pricing buffer recommended to flatten queue.",
                "Tambaram GST Hub: 3 of 4 bays reserved between 15:00–16:00. Pre-condition transformer cooling.",
              ]).map((alert, i) => (
                <div key={i} className="rounded-xl border border-line/50 bg-navy-950 p-3 text-mute flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0 mt-1" />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Managed Stations List (Using Standardized StationCard) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-lg font-bold text-ink">Managed Charging Hubs Telemetry</h2>
                <p className="text-xs text-mute">Real-time status across owned infrastructure</p>
              </div>
              <span className="text-xs text-mute font-mono">Showing {stations.length} hubs</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {stations.map((st) => (
                <StationCard
                  key={st.id}
                  station={st}
                  distanceKm={null}
                  showBookButton={false}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalGuard>
  );
}
