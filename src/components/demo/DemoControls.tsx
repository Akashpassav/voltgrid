"use client";

import { Button } from "@/components/ui/button";
import { apiPost, loadTrip } from "@/lib/client/api";
import type { OptimizeResponse, TripRequest } from "@/lib/types";
import { AlertTriangle, Car, RotateCcw, TimerReset, ZapOff } from "lucide-react";
import { useState } from "react";

export function DemoControls({
  trip,
  recommendedId,
  onResult,
}: {
  trip?: TripRequest | null;
  recommendedId?: string;
  onResult?: (result: OptimizeResponse, message: string) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function run(action: string, extra?: Record<string, unknown>) {
    setBusy(action);
    const activeTrip = trip ?? loadTrip();
    const body = { action, trip: activeTrip, ...extra };
    try {
      const json = await apiPost<{
        message: string;
        result?: OptimizeResponse;
      }>("/api/simulate/scenario", body);
      setMessage(json.message);
      if (json.result && onResult) onResult(json.result, json.message);
    } catch {
      setMessage("Simulation request failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-navy-900 p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-mute">Judge / demo controls</p>
      <p className="mt-1 text-sm text-mute">
        These actions mutate the simulation layer only. They do not touch a real CPO.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={!!busy}
          onClick={() =>
            run("fail-recommended", { stationId: recommendedId ?? "VG-014" })
          }
        >
          <ZapOff className="h-3.5 w-3.5" />
          Simulate charger failure
        </Button>
        <Button type="button" variant="warn" size="sm" disabled={!!busy} onClick={() => run("high-demand")}>
          <AlertTriangle className="h-3.5 w-3.5" />
          Simulate high demand
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={!!busy} onClick={() => run("traffic")}>
          <Car className="h-3.5 w-3.5" />
          Simulate traffic increase
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={!!busy} onClick={() => run("reset")}>
          <RotateCcw className="h-3.5 w-3.5" />
          Reset simulation
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={!!busy} onClick={() => run("demo-clock")}>
          <TimerReset className="h-3.5 w-3.5" />
          Freeze 3:40 PM IST
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={!!busy} onClick={() => run("live-clock")}>
          Live IST clock
        </Button>
      </div>
      {message && <p className="mt-3 text-xs text-warn">{message}</p>}
    </div>
  );
}
