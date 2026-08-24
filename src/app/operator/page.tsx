"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiGet } from "@/lib/client/api";
import type { DashboardMetrics } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export default function OperatorPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    void (async () => {
      const json = await apiGet<{ metrics: DashboardMetrics }>("/api/dashboard/metrics");
      setMetrics(json.metrics);
    })();
  }, []);

  if (!metrics) {
    return <p className="px-4 py-16 text-center text-mute">Loading operator view…</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-mute">CPO / DISCOM view</p>
        <h1 className="text-3xl font-semibold">Operator dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-mute">
          Future grid-aware charging without pretending we have a live DISCOM SCADA feed.
        </p>
        <Badge tone="amber" className="mt-2">
          Grid Intelligence — Prototype Simulation
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Avg utilisation" value={`${metrics.averageUtilization}%`} />
        <Kpi label="Avg queue" value={`${metrics.averageQueueMinutes} min`} />
        <Kpi label="Peak hours" value={metrics.peakHours} />
        <Kpi label="Demand index" value={metrics.predictedDemandIndex} />
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Recommendations</h2>
        </CardHeader>
        <CardBody className="space-y-2">
          {metrics.operatorAlerts.map((a) => (
            <p key={a} className="rounded-lg bg-navy-900 px-3 py-2 text-sm">
              {a}
            </p>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Recommended charging windows</h2>
          <p className="text-xs text-mute">
            Inputs: station demand, charging load, time-of-day, renewable availability (simulated).
            Output: recommended charging window.
          </p>
        </CardHeader>
        <CardBody className="grid gap-3 md:grid-cols-2">
          {metrics.gridWindows.map((w) => (
            <div key={w.label} className="rounded-lg border border-line bg-navy-900 p-3">
              <p className="text-sm font-medium">{w.label}</p>
              <p className="text-xs text-mute">
                {w.startHour}:00 – {w.endHour}:00 · relative load {Math.round(w.relativeLoad * 100)}%
              </p>
              <p className="mt-2 text-sm">{w.reason}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Peak demand shape</h2>
        </CardHeader>
        <CardBody className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.demandForecast}>
              <CartesianGrid stroke="rgba(139,155,180,0.15)" />
              <XAxis dataKey="hour" stroke="#8b9bb4" fontSize={11} />
              <YAxis stroke="#8b9bb4" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "#111b2e",
                  border: "1px solid rgba(139,155,180,0.25)",
                }}
              />
              <Bar dataKey="demand" fill="#f5a524" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string | number; value: string | number }) {
  return (
    <div className="rounded-xl border border-line bg-navy-800 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-mute">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
