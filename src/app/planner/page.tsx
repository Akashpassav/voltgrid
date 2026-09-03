import { TripForm } from "@/components/trip/TripForm";
import { DEFAULT_TRIP } from "@/lib/client/api";
import { Bike, Car, Route, Zap, Sparkles } from "lucide-react";

export default function PlannerPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-volt">
          <Route className="h-3.5 w-3.5" />
          Multi-Class EV Route Planner
        </div>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Energy-Aware EV Trip Planning
        </h1>
        <p className="mt-2 text-sm text-mute leading-relaxed">
          Configure your departure origin, destination, vehicle category (2W / 4W), and current battery state of charge. The optimizer calculates true road geometry, evaluates battery feasibility, and selects verified charging stops where necessary.
        </p>

        <div className="mt-6 rounded-2xl border border-line bg-navy-900/90 p-5 shadow-xl backdrop-blur-sm">
          <TripForm initial={DEFAULT_TRIP} submitLabel="Optimize Route & Charging Plan" />
        </div>
      </div>

      <aside className="space-y-4 text-sm text-mute">
        {/* Suggested Demonstrations */}
        <div className="rounded-xl border border-line bg-navy-900/80 p-4 shadow-md">
          <p className="font-semibold text-ink flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-volt" />
            Recommended Test Presets
          </p>
          <div className="mt-3 space-y-3">
            <div className="rounded-lg bg-navy-950 p-3 border border-line/50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink flex items-center gap-1.5 text-xs">
                  <Bike className="h-3.5 w-3.5 text-volt" />
                  2W Corridor Trip
                </span>
                <span className="text-[10px] bg-volt/10 text-volt border border-volt/20 px-1.5 py-0.5 rounded">
                  Requires Stop
                </span>
              </div>
              <p className="text-xs text-ink/90 mt-1 font-mono">Chennai → Chengalpattu · Ather 450X · 68% SoC</p>
              <p className="text-[11px] text-mute mt-1">
                Usable range is ~45 km. The corridor distance is ~63 km. The engine automatically schedules a charging stop to preserve the 15% safety reserve.
              </p>
            </div>

            <div className="rounded-lg bg-navy-950 p-3 border border-line/50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink flex items-center gap-1.5 text-xs">
                  <Car className="h-3.5 w-3.5 text-electric" />
                  4W Direct Feasibility
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  0 Stops (Direct)
                </span>
              </div>
              <p className="text-xs text-ink/90 mt-1 font-mono">Chennai → Trichy · Kia EV6 · 95% SoC</p>
              <p className="text-[11px] text-mute mt-1">
                329 km trip. With a 77.4 kWh battery pack, the vehicle arrives with ~25% SoC, correctly bypassing all charging stops.
              </p>
            </div>

            <div className="rounded-lg bg-navy-950 p-3 border border-line/50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink flex items-center gap-1.5 text-xs">
                  <Car className="h-3.5 w-3.5 text-electric" />
                  4W Multi-Stop Long Route
                </span>
                <span className="text-[10px] bg-info/10 text-info border border-info/20 px-1.5 py-0.5 rounded">
                  3 Progressive Stops
                </span>
              </div>
              <p className="text-xs text-ink/90 mt-1 font-mono">Chennai → Madurai · Tata Punch EV · 90% SoC</p>
              <p className="text-[11px] text-mute mt-1">
                473 km journey with a 25 kWh pack. Progressively plans 3 balanced stops down NH-38 without off-corridor detours.
              </p>
            </div>
          </div>
        </div>

        {/* How it Works Step-by-Step */}
        <div className="rounded-xl border border-line bg-navy-900/80 p-4 shadow-md">
          <p className="font-semibold text-ink flex items-center gap-1.5 text-sm">
            <Zap className="h-4 w-4 text-electric" />
            Decision Engine Workflow
          </p>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-slate-300">
            <li>
              <strong className="text-ink">Pairwise OSRM Road Geometry:</strong> Generates live turn-by-turn road geometry with street-level coordinate precision.
            </li>
            <li>
              <strong className="text-ink">Battery Physics Simulation:</strong> Walks the route with payload, elevation, and speed to calculate true arrival SoC.
            </li>
            <li>
              <strong className="text-ink">Direct-Feasibility Rule:</strong> If the destination is safely reachable above your safety reserve, returns 0 stops immediately.
            </li>
            <li>
              <strong className="text-ink">Directional Charger Optimization:</strong> Evaluates 925+ verified charging stations along the corridor by availability, queue, power, and cost.
            </li>
            <li>
              <strong className="text-ink">Continuous Trip Protection:</strong> Monitors recommended chargers and triggers instant re-routing if an outage occurs mid-trip.
            </li>
          </ol>
        </div>
      </aside>
    </div>
  );
}