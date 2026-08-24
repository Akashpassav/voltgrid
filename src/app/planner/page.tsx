import { TripForm } from "@/components/trip/TripForm";
import { DEFAULT_TRIP } from "@/lib/client/api";

export default function PlannerPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1fr_0.8fr]">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-mute">Route planner</p>
        <h1 className="mt-1 text-3xl font-semibold">Plan a 2W trip on the GST corridor</h1>
        <p className="mt-2 text-sm text-mute">
          Origin, destination, vehicle and battery are required. Preference changes how charging
          stops are scored — it does not skip the SOC constraint.
        </p>
        <div className="mt-6 rounded-2xl border border-line bg-navy-900 p-5">
          <TripForm initial={DEFAULT_TRIP} />
        </div>
      </div>
      <aside className="space-y-4 text-sm text-mute">
        <div className="rounded-xl border border-line bg-navy-800 p-4">
          <p className="font-medium text-ink">Suggested demo</p>
          <p className="mt-1">Chennai → Chengalpattu · Ather 450X · 68%</p>
          <p className="mt-2">
            Usable range is ~45 km. The corridor is ~63 km. The optimiser must insert a charging stop.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-navy-800 p-4">
          <p className="font-medium text-ink">What happens next</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>Corridor Dijkstra builds a geographic path.</li>
            <li>Energy model walks the path with your SOC.</li>
            <li>Reachable chargers are scored — closest is not automatic.</li>
            <li>You get ETA, arrival SOC and route confidence.</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}
