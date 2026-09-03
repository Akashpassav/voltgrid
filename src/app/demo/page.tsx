"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DemoControls } from "@/components/demo/DemoControls";
import { TripForm } from "@/components/trip/TripForm";
import { DEFAULT_TRIP, loadTrip, saveResult, apiGet } from "@/lib/client/api";
import type { SimulationScenario } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export default function DemoPage() {
  const router = useRouter();
  const [scenario, setScenario] = useState<SimulationScenario | null>(null);
  const [trip, setTrip] = useState(DEFAULT_TRIP);

  useEffect(() => {
    setTrip(loadTrip() ?? DEFAULT_TRIP);
    void (async () => {
      const json = await apiGet<{ scenario: SimulationScenario }>("/api/simulate/scenario");
      setScenario(json.scenario);
    })();
  }, []);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-2">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-volt font-semibold">Technical Demonstration Mode</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Evaluator & Presentation Sandbox</h1>
        <p className="mt-2 text-sm text-mute leading-relaxed">
          Demonstration workflow for evaluators and technical review panels: test battery-constrained stop placement, inspect real-time confidence scores, and simulate live charger outages to observe autonomous re-routing.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-xs text-slate-300 leading-relaxed">
          <li>Select a vehicle category: 2-Wheeler (e.g. Ather 450X) or 4-Wheeler (e.g. Tata Punch EV or Kia EV6).</li>
          <li>Run route optimization and inspect the Arrival SoC, usable energy formula, and predicted availability.</li>
          <li>In the Sandbox below, click <strong className="text-red-400">Simulate Outage</strong> to force the recommended charger offline.</li>
          <li>VoltGrid detects the outage immediately and re-routes to the next optimal charging station.</li>
          <li>Use <strong className="text-volt">Reset All</strong> to restore all charging infrastructure to normal baseline.</li>
        </ol>
        <div className="mt-6">
          <DemoControls
            trip={trip}
            recommendedId="VG-014"
            defaultOpen={true}
            onResult={(result) => {
              saveResult(result);
              router.push("/route");
            }}
          />
        </div>
        {scenario && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="amber">{scenario.label}</Badge>
            <Badge tone="mute">Traffic ×{scenario.trafficMultiplier}</Badge>
            <Badge tone="mute">Demand ×{scenario.demandMultiplier}</Badge>
            {scenario.failedStationIds.map((id) => (
              <Badge key={id} tone="red">
                {id} offline
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-line bg-navy-900 p-5">
        <p className="font-medium">Load the demo trip</p>
        <TripForm initial={DEFAULT_TRIP} submitLabel="Optimize demo route" />
        <p className="mt-4 text-xs text-mute">
          Need the map? After optimisation you land on{" "}
          <Link href="/route" className="text-volt">
            route results
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
