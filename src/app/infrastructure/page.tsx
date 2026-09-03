"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

const STATUS_COLOR: Record<string, string> = {
  available: "#3ddc97",
  limited: "#f5a524",
  busy: "#f5a524",
  offline: "#f04343",
  maintenance: "#6b7c93",
};

export default function InfrastructurePage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const json = await apiGet<{ metrics: DashboardMetrics }>("/api/dashboard/metrics");
        setMetrics(json.metrics);
      } catch {
        setError("Could not load infrastructure metrics.");
      }
    })();
  }, []);

  if (error) {
    return <p className="px-4 py-16 text-center text-danger">{error}</p>;
  }
  if (!metrics) {
    return <p className="px-4 py-16 text-center text-mute">Loading charger intelligence…</p>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-mute">CPO Network Analytics</p>
        <h1 className="text-3xl font-semibold">Charging Infrastructure Intelligence</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone="mute">Coverage: 925+ Real CPO Locations</Badge>
          <Badge tone="amber">Occupancy: Real-Time / Simulated Telemetry</Badge>
        </div>
      </div>

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
            <h2 className="font-semibold">Charger utilisation by hour</h2>
            <p className="text-xs text-mute">Synthetic corridor load shape · 6 PM–9 PM is the peak</p>
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
            <h2 className="font-semibold">Demand forecast</h2>
            <p className="text-xs text-mute">Prototype — LSTM-ready feature slot, not a deep model</p>
          </CardHeader>
          <CardBody className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.demandForecast}>
                <CartesianGrid stroke="rgba(139,155,180,0.15)" />
                <XAxis dataKey="hour" stroke="#8b9bb4" fontSize={11} />
                <YAxis stroke="#8b9bb4" fontSize={11} />
                <Tooltip contentStyle={tip} />
                <Bar dataKey="demand" fill="#4c8dff" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Status distribution</h2>
          </CardHeader>
          <CardBody className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.statusDistribution}>
                <XAxis dataKey="status" stroke="#8b9bb4" fontSize={11} />
                <YAxis stroke="#8b9bb4" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tip} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {metrics.statusDistribution.map((d) => (
                    <Cell key={d.status} fill={STATUS_COLOR[d.status] ?? "#8b9bb4"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Average queue time</h2>
          </CardHeader>
          <CardBody className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.averageQueueByHour}>
                <CartesianGrid stroke="rgba(139,155,180,0.15)" />
                <XAxis dataKey="hour" stroke="#8b9bb4" fontSize={11} />
                <YAxis stroke="#8b9bb4" fontSize={11} />
                <Tooltip contentStyle={tip} />
                <Line type="monotone" dataKey="minutes" stroke="#f5a524" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Most reliable stations</h2>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2 text-sm">
              {metrics.mostReliable.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <Link href={`/stations/${s.id}`} className="text-volt hover:underline">
                    {s.id} {s.name}
                  </Link>
                  <span className="font-mono">{Math.round(s.reliability * 100)}%</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Stations likely to become busy</h2>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2 text-sm">
              {metrics.likelyBusy.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <Link href={`/stations/${s.id}`} className="hover:text-volt">
                    {s.id} {s.name}
                  </Link>
                  <span className="font-mono text-warn">{Math.round(s.probabilityBusy * 100)}%</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line bg-navy-800 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-mute">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

const tip = {
  background: "#111b2e",
  border: "1px solid rgba(139,155,180,0.25)",
  color: "#e8eef8",
};
