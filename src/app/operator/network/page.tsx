"use client";

import React, { useEffect, useState } from "react";
import { PortalGuard } from "@/lib/auth/AuthContext";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiGet } from "@/lib/client/api";
import type { DashboardMetrics } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Radio, Zap, Activity, BatteryCharging, ArrowLeft } from "lucide-react";
import Link from "next/link";

const STATUS_COLOR: Record<string, string> = {
  available: "#3ddc97",
  limited: "#f5a524",
  busy: "#f5a524",
  offline: "#f04343",
  maintenance: "#6b7c93",
};

const tip = {
  background: "#0a0f1c",
  border: "1px solid rgba(139,155,180,0.2)",
  borderRadius: 8,
  fontSize: 12,
  color: "#eef2fa",
};

export default function OperatorNetworkPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const json = await apiGet<{ metrics: DashboardMetrics }>("/api/dashboard/metrics");
        setMetrics(json.metrics);
      } catch {
        setError("Could not load network grid metrics.");
      }
    })();
  }, []);

  return (
    <PortalGuard allowedRole="operator">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-electric font-semibold">
              CPO Infrastructure Telemetry
            </p>
            <h1 className="text-3xl font-extrabold text-ink">Network Grid Analytics</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="mute">Coverage: 925+ Verified CPO Hubs</Badge>
              <Badge tone="amber">DISCOM SCADA Simulation Layer</Badge>
            </div>
          </div>

          <Link
            href="/operator/dashboard"
            className="rounded-xl border border-line bg-navy-900 px-4 py-2 text-xs font-semibold text-mute hover:text-ink transition-colors self-start sm:self-auto"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {metrics && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <Kpi label="Charging Stations" value={metrics.totalChargers} />
              <Kpi label="Available Points" value={metrics.available} />
              <Kpi label="Occupied / Limited" value={metrics.busy + metrics.limited} />
              <Kpi label="Outage / Offline" value={metrics.offline} />
              <Kpi label="Avg Hub Utilisation" value={`${metrics.averageUtilization}%`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Kpi label="Tamil Nadu Stations" value={metrics.tamilNaduStations} />
              <Kpi label="Karnataka Stations" value={metrics.karnatakaStations} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-ink">Charger Utilisation by Hour</h2>
                  <p className="text-xs text-mute">Corridor load profile · 6 PM–9 PM peak congestion window</p>
                </CardHeader>
                <CardBody className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.utilizationByHour}>
                      <CartesianGrid stroke="rgba(139,155,180,0.15)" />
                      <XAxis dataKey="hour" stroke="#8b9bb4" fontSize={11} />
                      <YAxis stroke="#8b9bb4" fontSize={11} domain={[0, 1]} />
                      <Tooltip contentStyle={tip} />
                      <Line type="monotone" dataKey="utilization" stroke="#3ddc97" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-ink">Demand Forecast by Corridor</h2>
                  <p className="text-xs text-mute">ML-modeled arrival congestion forecast</p>
                </CardHeader>
                <CardBody className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.demandForecast}>
                      <CartesianGrid stroke="rgba(139,155,180,0.15)" />
                      <XAxis dataKey="time" stroke="#8b9bb4" fontSize={11} />
                      <YAxis stroke="#8b9bb4" fontSize={11} />
                      <Tooltip contentStyle={tip} />
                      <Bar dataKey="index" fill="#3b82ff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>
            </div>
          </>
        )}
      </div>
    </PortalGuard>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-line bg-navy-900 p-4 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-mute font-medium">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
