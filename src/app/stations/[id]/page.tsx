"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RouteMap } from "@/components/map/RouteMap";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPost } from "@/lib/client/api";
import type { AvailabilityPrediction, LiveStation } from "@/lib/types";
import { formatTimeIst } from "@/lib/utils/time";

export default function StationPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [station, setStation] = useState<LiveStation | null>(null);
  const [prediction, setPrediction] = useState<AvailabilityPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const json = await apiGet<{ station: LiveStation }>(`/api/stations/${id}`);
        if (cancelled) return;
        setStation(json.station);
        const pred = await apiPost<{ prediction: AvailabilityPrediction }>(
          "/api/predict-availability",
          { stationId: id, etaMinutesFromNow: 28 },
        );
        if (!cancelled) setPrediction(pred.prediction);
      } catch {
        if (!cancelled) setError("Station not found in the corridor dataset.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-semibold">{error}</p>
        <Link href="/infrastructure" className="mt-3 inline-block text-volt">
          Back to infrastructure
        </Link>
      </div>
    );
  }

  if (!station) {
    return <p className="px-4 py-16 text-center text-mute">Loading charger intelligence…</p>;
  }

  const tone =
    station.status === "available"
      ? "green"
      : station.status === "offline" || station.status === "maintenance"
        ? "red"
        : "amber";

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-mute">Station details</p>
        <h1 className="mt-1 text-3xl font-semibold">{station.name}</h1>
        <p className="text-sm text-mute">
          {station.id} · {station.operator} · {station.address}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={tone}>{station.status}</Badge>
          <Badge tone="mute">{station.connectorType}</Badge>
          <Badge tone="amber">SIMULATED LIVE DATA</Badge>
          <Badge tone="mute">Location: STATIC SEED</Badge>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Fact label="Power" value={`${station.powerKW} kW`} />
          <Fact label="Connectors" value={`${station.availableConnectors} / ${station.totalConnectors}`} />
          <Fact label="Queue" value={`~${station.estimatedQueueMinutes} min`} />
          <Fact label="Price" value={`₹${station.pricePerKWh}/kWh`} />
          <Fact label="Reliability" value={`${Math.round(station.reliabilityScore * 100)}%`} />
          <Fact label="Amenity" value={station.amenity} />
        </dl>
        {prediction && (
          <div className="mt-6 rounded-xl border border-info/30 bg-navy-900 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-mute">Predicted availability</p>
            <p className="mt-1 font-mono text-4xl text-info">
              {Math.round(prediction.probability * 100)}%
            </p>
            <p className="text-sm text-mute">
              Expected arrival {prediction.expectedArrivalIso ? formatTimeIst(new Date(prediction.expectedArrivalIso)) : "—"} ·
              queue {prediction.expectedQueueMinutes[0]}–{prediction.expectedQueueMinutes[1]} min ·
              confidence {prediction.confidence}
            </p>
            <p className="mt-3 text-xs text-mute">Main factors (logistic regression v1 — not a black-box score)</p>
            <ul className="mt-2 space-y-1.5">
              {prediction.factors.slice(0, 5).map((f) => (
                <li key={f.name} className="flex items-center justify-between text-sm">
                  <span className={f.direction === "up" ? "text-volt" : "text-warn"}>{f.name}</span>
                  <span className="font-mono text-xs text-mute">
                    {typeof f.value === "number" ? f.value.toFixed(2) : f.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="h-[360px] lg:h-auto">
        <RouteMap stations={[station]} recommendedIds={[]} />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-navy-800 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-mute">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
