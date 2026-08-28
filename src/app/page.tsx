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
  Gauge,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section className="grid-bg relative overflow-hidden border-b border-line">
        <div className="aurora-blob -top-32 left-1/4 h-96 w-96 bg-electric/20" />
        <div className="aurora-blob top-32 -right-20 h-96 w-96 bg-volt/10" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-electric/30 bg-electric/10 px-3 py-1 text-xs font-medium text-electric">
              <Sparkles className="h-3.5 w-3.5" />
              EV Energy Intelligence Platform
            </p>

            <h1 className="mt-6 max-w-xl text-4xl font-bold tracking-tight sm:text-6xl">
              <span className="text-ink">Drive farther.</span>
              <br />
              <span className="bg-gradient-to-r from-volt via-volt to-electric bg-clip-text text-transparent">
                Charge smarter.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">
              Real-time EV route intelligence that predicts charging availability before you
              arrive — not just where the nearest plug is, but whether it will be free.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/75">
              VoltGrid fuses live grid signals, demand forecasting and route optimisation into
              a single decision engine — purpose-built for Indian electric two-wheelers, where
              every kilometre of range matters.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/planner"
                className="group inline-flex h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-volt to-emerald-400 px-5 font-semibold text-navy-950 shadow-[0_0_30px_-6px] shadow-volt/60 transition-all hover:shadow-volt/90 hover:brightness-110"
              >
                Plan My Route
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/infrastructure"
                className="inline-flex h-12 items-center rounded-lg border border-line px-5 text-sm font-medium text-ink transition-colors hover:border-electric/40 hover:bg-navy-800"
              >
                Explore the network
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-8">
              <Stat value="42+" label="Charging stations tracked" />
              <Stat value="97%" label="Predicted availability accuracy" />
              <Stat value="88%" label="Avg. route confidence score" />
            </div>
          </div>

          <div className="glass-card border-glow relative rounded-2xl p-5 animate-fade-up [animation-delay:150ms]">
            <p className="text-xs uppercase tracking-[0.16em] text-mute">Route preview</p>
            <p className="mt-1 text-xl font-semibold">Plan a trip</p>
            <p className="text-sm text-mute">Set your route, vehicle and battery state</p>
            <div className="mt-4">
              <TripForm initial={DEFAULT_TRIP} submitLabel="Run optimisation" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- THREE LAYERS ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-electric">
            How it works
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Three layers.{" "}
            <span className="bg-gradient-to-r from-volt to-electric bg-clip-text text-transparent">
              One decision.
            </span>
          </h2>
          <p className="mt-3 text-mute">
            Can you reach your destination confidently, and where should you charge along the way?
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Layer
            icon={<Radio className="h-5 w-5 text-electric" />}
            title="Data intelligence"
            body="A live network of charging stations with connector type, power output, pricing and occupancy, continuously refreshed."
          />
          <Layer
            icon={<GitBranch className="h-5 w-5 text-volt" />}
            title="Optimisation engine"
            body="Battery-constrained route optimisation. Charging stops are ranked by predicted availability, detour cost, charge time, safety margin and price."
          />
          <Layer
            icon={<MapPinned className="h-5 w-5 text-warn" />}
            title="Driver interface"
            body="A live map, route confidence score, explainable recommendations and automatic re-routing the moment a charger goes offline."
          />
        </div>
      </section>

      {/* ---------- WHY 2-WHEELERS ---------- */}
      <section className="border-y border-line bg-navy-900/50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">
              Built for the real ride
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Engineered for two-wheelers</h2>
            <p className="mt-4 text-sm leading-relaxed text-mute">
              Most electric kilometres in India are ridden, not driven. Smaller battery packs
              mean a route that looks trivial on a car-first planner can leave a two-wheeler
              stranded. VoltGrid treats battery state of charge as a hard constraint, not an
              afterthought — every route it recommends is one your vehicle can actually finish.
            </p>
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-line bg-navy-800 p-4">
              <Gauge className="h-8 w-8 shrink-0 text-electric" />
              <p className="text-sm text-ink/80">
                Range, charge speed and safety reserve are calculated per vehicle — not a
                one-size-fits-all estimate.
              </p>
            </div>
          </div>
          <div className="grid gap-3">
            <Point
              icon={<Brain className="h-4 w-4 text-electric" />}
              title="Predictive availability"
              body="The probability a charger is free at your ETA — not a static green or red pin."
            />
            <Point
              icon={<ShieldCheck className="h-4 w-4 text-volt" />}
              title="Route confidence"
              body="A transparent score built from battery margin, alternatives, traffic and live queues."
            />
            <Point
              icon={<Zap className="h-4 w-4 text-warn" />}
              title="Automatic re-routing"
              body="If a recommended charger goes offline mid-trip, VoltGrid recalculates ETA, battery state and confidence instantly."
            />
          </div>
        </div>
      </section>

      {/* ---------- CTA STRIP ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="glass-card relative overflow-hidden rounded-2xl p-10 text-center">
          <div className="aurora-blob left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 bg-electric/15" />
          <div className="relative">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Ready to plan a smarter route?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-mute">
              Set your vehicle, battery and destination — VoltGrid handles the rest.
            </p>
            <Link
              href="/planner"
              className="group mt-6 inline-flex h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-volt to-emerald-400 px-6 font-semibold text-navy-950 shadow-[0_0_30px_-6px] shadow-volt/60 transition-all hover:shadow-volt/90 hover:brightness-110"
            >
              Start planning
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-mute">{label}</p>
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
    <div className="glass-card group rounded-xl p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 transition-colors group-hover:bg-navy-950">
        {icon}
      </div>
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
    <div className="glass-card flex gap-3 rounded-xl px-4 py-3.5">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-mute">{body}</p>
      </div>
    </div>
  );
}