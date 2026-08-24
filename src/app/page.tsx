import Link from "next/link";
import { TripForm } from "@/components/trip/TripForm";
import { DEFAULT_TRIP } from "@/lib/client/api";
import {
  ArrowRight,
  Brain,
  GitBranch,
  MapPinned,
  Radio,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div>
      <section className="grid-bg relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-volt/30 bg-volt/10 px-3 py-1 text-xs font-medium text-volt">
              <Zap className="h-3.5 w-3.5" />
              Smart India Hackathon · Chennai–Chengalpattu corridor
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Drive farther. Charge smarter.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-mute">
              India-first EV route intelligence that predicts charging availability before you arrive.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/80">
              VoltGrid doesn&apos;t just find a charger. It predicts whether the charger will be available
              when you arrive and makes that prediction part of the route decision — built for Indian
              electric 2-wheelers, not as an afterthought to cars.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/planner"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-volt px-5 font-semibold text-navy-950"
              >
                Plan My Route
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex h-12 items-center rounded-lg border border-line px-5 text-sm font-medium text-ink hover:bg-navy-800"
              >
                Open demo controls
              </Link>
            </div>
            <p className="mt-6 text-xs text-mute">
              Not Google Maps. Not PlugShare. Not Statiq, Tata Power EZ Charge, Electromaps or ABRP.
              Those find stations. VoltGrid decides if you can finish the trip.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-navy-900/80 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-mute">SIH demo trip</p>
            <p className="mt-1 text-xl font-semibold">Chennai → Chengalpattu</p>
            <p className="text-sm text-mute">Ather 450X · 68% SOC · GST Road</p>
            <div className="mt-4">
              <TripForm initial={DEFAULT_TRIP} submitLabel="Run demo optimisation" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl font-semibold">Three layers. One answer.</h2>
        <p className="mt-2 max-w-2xl text-mute">
          Can I reach my destination confidently, and where should I charge along the way?
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Layer
            icon={<Radio className="h-5 w-5 text-volt" />}
            title="Data intelligence"
            body="42 corridor stations with connector, power, price, occupancy and a live simulation of queues — clearly labelled as simulated."
          />
          <Layer
            icon={<GitBranch className="h-5 w-5 text-info" />}
            title="Optimisation engine"
            body="SOC-constrained Dijkstra on the GST graph. Charging stops are ranked by predicted availability, detour, charge time, energy safety and price."
          />
          <Layer
            icon={<MapPinned className="h-5 w-5 text-warn" />}
            title="Driver interface"
            body="Map, route confidence, explainable recommendations, and automatic re-routing when a recommended charger fails."
          />
        </div>
      </section>

      <section className="border-y border-line bg-navy-900/50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Why 2-wheelers first</h2>
            <p className="mt-3 text-sm leading-relaxed text-mute">
              Most Indian EV kilometres are ridden, not driven. A 3.7 kWh Ather pack on GST Road
              with 68% charge cannot safely cover Chennai to Chengalpattu without a stop. Car-first
              planners hide that. VoltGrid treats battery state of charge as a hard routing constraint.
            </p>
          </div>
          <div className="grid gap-3">
            <Point
              icon={<Brain className="h-4 w-4 text-volt" />}
              title="Predictive availability"
              body="Probability the charger is free at your ETA — not a green/red pin."
            />
            <Point
              icon={<ShieldCheck className="h-4 w-4 text-info" />}
              title="Route confidence"
              body="A visible anxiety meter from SOC margin, alternatives, traffic and queues."
            />
            <Point
              icon={<Zap className="h-4 w-4 text-warn" />}
              title="Failure re-routing"
              body="Offline VG-014 → pick VG-021 → new ETA, SOC and confidence. Live, not a static mock."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Layer({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-navy-800 p-5">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-mute">{body}</p>
    </div>
  );
}

function Point({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-line bg-navy-800 px-4 py-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-mute">{body}</p>
      </div>
    </div>
  );
}
