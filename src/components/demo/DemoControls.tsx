"use client";

import { Button } from "@/components/ui/button";
import { apiPost, loadTrip } from "@/lib/client/api";
import type { OptimizeResponse, TripRequest } from "@/lib/types";
import {
  AlertTriangle,
  Car,
  RotateCcw,
  TimerReset,
  ZapOff,
  Clock,
  ChevronDown,
  ChevronUp,
  Cpu,
  Radio,
} from "lucide-react";
import { useState } from "react";
import { InfoTooltip } from "@/components/ui/tooltip";

export function DemoControls({
  trip,
  recommendedId,
  onResult,
  defaultOpen = false,
}: {
  trip?: TripRequest | null;
  recommendedId?: string;
  onResult?: (result: OptimizeResponse, message: string) => void;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
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
    <div className="rounded-xl border border-line bg-navy-900/90 shadow-xl overflow-hidden backdrop-blur-sm">
      {/* Collapsible Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-navy-800/60 focus:outline-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Operator / Evaluator Sandbox
              </span>
              <span className="rounded-full bg-navy-800 px-2 py-0.5 text-[10px] text-mute border border-line">
                Demo Tools
              </span>
            </div>
            <p className="text-xs text-mute mt-0.5">
              Simulate network events, charger outages, and automatic re-routing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-mute">
          <span className="text-xs">{isOpen ? "Hide" : "Expand"}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-1 border-t border-line/60">
          <p className="text-xs text-mute/90 leading-relaxed">
            These controls inject simulated events into VoltGrid&apos;s memory layer for evaluator testing and technical demonstrations. They do not alter production CPO feeds.
          </p>

          <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
            {/* Fail Station */}
            <div className="flex flex-col justify-between rounded-lg border border-red-500/20 bg-red-950/20 p-2.5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                    <ZapOff className="h-3.5 w-3.5" />
                    Charger Outage
                  </span>
                  <InfoTooltip
                    title="Simulate Charger Failure"
                    content="Marks the recommended charging station as offline. The engine immediately detects the outage and recalculates an optimal alternative route."
                  />
                </div>
                <p className="text-[11px] text-mute mt-1">Forces recommended station offline to trigger real-time re-routing.</p>
              </div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                className="mt-2 w-full text-xs"
                disabled={!!busy}
                onClick={() => run("fail-recommended", { stationId: recommendedId ?? "VG-014" })}
              >
                {busy === "fail-recommended" ? "Simulating…" : "Simulate Outage"}
              </Button>
            </div>

            {/* High Demand */}
            <div className="flex flex-col justify-between rounded-lg border border-amber-500/20 bg-amber-950/20 p-2.5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Corridor Surge Demand
                  </span>
                  <InfoTooltip
                    title="Simulate High Demand"
                    content="Multiplies corridor EV charging demand by 1.6x, adjusting predictive queue forecasts and station availability scores."
                  />
                </div>
                <p className="text-[11px] text-mute mt-1">Multiplies charging demand index to stress predictive queue models.</p>
              </div>
              <Button
                type="button"
                variant="warn"
                size="sm"
                className="mt-2 w-full text-xs"
                disabled={!!busy}
                onClick={() => run("high-demand")}
              >
                {busy === "high-demand" ? "Simulating…" : "Inject Demand Surge"}
              </Button>
            </div>

            {/* Traffic Congestion */}
            <div className="flex flex-col justify-between rounded-lg border border-line bg-navy-950/60 p-2.5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-electric" />
                    Traffic Congestion
                  </span>
                  <InfoTooltip
                    title="Simulate Traffic Congestion"
                    content="Applies a 1.35x traffic impedance factor. Demonstrates increased stop-and-go energy demand (Wh/km) and longer travel duration."
                  />
                </div>
                <p className="text-[11px] text-mute mt-1">Increases traffic impedance to show energy consumption impact.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-2 w-full text-xs"
                disabled={!!busy}
                onClick={() => run("traffic")}
              >
                {busy === "traffic" ? "Simulating…" : "Simulate Heavy Traffic"}
              </Button>
            </div>

            {/* Reset Simulation */}
            <div className="flex flex-col justify-between rounded-lg border border-line bg-navy-950/60 p-2.5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5 text-volt" />
                    Reset Simulation
                  </span>
                  <InfoTooltip
                    title="Reset Simulation State"
                    content="Restores all charging stations, traffic factors, and demand variables to standard operational baseline."
                  />
                </div>
                <p className="text-[11px] text-mute mt-1">Restores all simulated chargers to active operational status.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-2 w-full text-xs"
                disabled={!!busy}
                onClick={() => run("reset")}
              >
                {busy === "reset" ? "Resetting…" : "Reset All to Normal"}
              </Button>
            </div>
          </div>

          {/* Clock Freeze Controls */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/40 pt-3 text-xs">
            <span className="text-mute flex items-center gap-1.5 text-[11px]">
              <Clock className="h-3.5 w-3.5 text-mute" />
              Demo Clock Controls:
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2.5"
                disabled={!!busy}
                onClick={() => run("demo-clock")}
              >
                <TimerReset className="h-3 w-3 mr-1" />
                Freeze 3:40 PM IST
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2.5 text-volt"
                disabled={!!busy}
                onClick={() => run("live-clock")}
              >
                <Radio className="h-3 w-3 mr-1" />
                Live IST Clock
              </Button>
            </div>
          </div>

          {message && (
            <div className="mt-3 rounded-lg border border-volt/30 bg-volt/10 p-2 text-xs text-volt font-medium">
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}