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
        <p className="text-xs uppercase tracking-[0.16em] text-mute">Presentation mode</p>
        <h1 className="text-3xl font-semibold">SIH demo control panel</h1>
        <p className="mt-2 text-sm text-mute">
          Script: load the default Chennai → Chengalpattu trip, show VG-014, then simulate charger
          failure and watch the engine pick an alternative.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-mute">
          <li>Keep Simulation Mode banner visible — never claim live CPO feeds.</li>
          <li>Optimize Chennai → Chengalpattu at 68% on an Ather 450X.</li>
          <li>Point at predicted availability and Route Confidence.</li>
          <li>Click Simulate charger failure. VG-014 goes offline.</li>
          <li>New stop, ETA, SOC and confidence update automatically.</li>
        </ol>
        <div className="mt-6">
          <DemoControls
            trip={trip}
            recommendedId="VG-014"
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
