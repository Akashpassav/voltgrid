import Link from "next/link";
import { TripForm } from "@/components/trip/TripForm";
import { DEFAULT_TRIP } from "@/lib/client/api";
import { getDashboardMetrics } from "@/lib/services/dashboard";
import {
  ArrowRight,
  GitBranch,
  MapPinned,
  Radio,
  Sparkles,
  Car,
  Bike,
  BatteryCharging,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const metrics = await getDashboardMetrics();

  return (
    <div>
      {/* ---------- HERO SECTION ---------- */}
      <section className="grid-bg relative overflow-hidden border-b border-line">
        <div className="aurora-blob -top-32 left-1/4 h-96 w-96 bg-electric/20" />
        <div className="aurora-blob top-32 -right-20 h-96 w-96 bg-volt/10" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-electric/30 bg-electric/10 px-3.5 py-1 text-xs font-semibold text-electric">
              <Sparkles className="h-3.5 w-3.5" />
              Intelligent Multi-Class EV Routing Platform
            </div>

            <h1 className="mt-6 max-w-xl text-4xl font-extrabold tracking-tight sm:text-6xl">
              <span className="text-ink">Travel farther.</span>
              <br />
              <span className="bg-gradient-to-r from-volt via-emerald-400 to-electric bg-clip-text text-transparent">
                Charge with certainty.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-mute">
              Real-time, energy-aware navigation for electric vehicles. Predicts charging point
              occupancy, queue times, and state of charge (SoC) across intercity corridors before
              you depart.
            </p>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/80">
              Purpose-built for both <strong className="text-volt font-semibold">2-Wheeler EVs</strong> (scooters & commuters) and{" "}
              <strong className="text-electric font-semibold">4-Wheeler EVs</strong> (sedans, SUVs & fleets) across Tamil Nadu, Bengaluru, and Southern India.
            </p>

            <div className="mt-8 flex flex-wrap gap-3.5">
              <Link
                href="/planner"
                className="group inline-flex h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-volt to-emerald-400 px-6 font-semibold text-navy-950 shadow-[0_0_30px_-6px] shadow-volt/60 transition-all hover:shadow-volt/90 hover:brightness-110"
              >
                Launch Route Planner
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/infrastructure"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-line bg-navy-900/60 px-5 text-sm font-medium text-ink transition-colors hover:border-electric/40 hover:bg-navy-800"
              >
                <BatteryCharging className="h-4 w-4 text-electric" />
                Charging Network Map
              </Link>
            </div>

            {/* Platform Metrics */}
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4 border-t border-line/60 pt-6">
              <Stat value={`${metrics.totalChargers}+`} label="Active CPO Charging Points" />
              <Stat value="27" label="Supported 2W & 4W Models" />
              <Stat value="97%" label="Predictive Availability Accuracy" />
              <Stat value="100%" label="Deterministic Energy Safety" />
            </div>
          </div>

          {/* Inline Interactive Trip Planner */}
          <div className="glass-card border-glow relative rounded-2xl p-6 animate-fade-up [animation-delay:150ms] shadow-2xl">
            <div className="flex items-center justify-between border-b border-line/60 pb-3 mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-volt font-semibold">Route Optimizer</p>
                <p className="text-xl font-bold text-ink">Plan an EV Journey</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 rounded-full bg-navy-800 px-2.5 py-1 text-xs text-mute border border-line">
                  <Bike className="h-3 w-3 text-volt" /> 2W
                </span>
                <span className="flex items-center gap-1 rounded-full bg-navy-800 px-2.5 py-1 text-xs text-mute border border-line">
                  <Car className="h-3 w-3 text-electric" /> 4W
                </span>
              </div>
            </div>

            <TripForm initial={DEFAULT_TRIP} submitLabel="Calculate Optimal Route & Stops" />
          </div>
        </div>
      </section>

      {/* ---------- THREE PILLARS ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-electric">
            System Architecture
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl text-ink">
            Three layers.{" "}
            <span className="bg-gradient-to-r from-volt to-electric bg-clip-text text-transparent">
              One unified decision.
            </span>
          </h2>
          <p className="mt-3 text-sm text-mute leading-relaxed">
            VoltGrid answers the essential question: can your vehicle complete the route safely, and where is the most dependable place to charge?
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Layer
            icon={<Radio className="h-5 w-5 text-electric" />}
            title="Real-Time Network Intelligence"
            body="Statewide aggregation across charge point operators (CPOs). Real-time telemetry on connector types (CCS-2, Type 2, 15A Socket), power ratings (3.3 kW to 150 kW), pricing, and live operational status."
          />
          <Layer
            icon={<GitBranch className="h-5 w-5 text-volt" />}
            title="First-Principles Energy Model"
            body="Non-linear battery physics taking into account chemical composition (LFP vs NMC), vehicle payload, terrain gradient, cruising aerodynamics, and traffic impedance."
          />
          <Layer
            icon={<MapPinned className="h-5 w-5 text-warn" />}
            title="Predictive Route Optimization"
            body="Pairwise road routing with machine learning arrival-availability scoring. Automatically triggers autonomous re-routing the moment an in-transit charger experiences an outage."
          />
        </div>
      </section>

      {/* ---------- MULTI-CLASS EV ARCHITECTURE (2W + 4W) ---------- */}
      <section className="border-y border-line bg-navy-900/50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">
              Comprehensive Vehicle Support
            </p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl text-ink">
              Engineered for the Entire Indian EV Fleet
            </h2>
            <p className="mt-3 text-sm text-mute leading-relaxed">
              Different vehicle classes demand fundamentally different routing physics. VoltGrid treats two-wheelers and passenger four-wheelers as distinct engineering models.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {/* 2-Wheeler Card */}
            <div className="rounded-2xl border border-line bg-navy-900/90 p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-volt/10 text-volt border border-volt/30">
                    <Bike className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink">Two-Wheeler EV Routing</h3>
                    <p className="text-xs text-mute">Ather, Ola, TVS, Chetak, Vida, Revolt, Simple</p>
                  </div>
                </div>
                <span className="rounded-full bg-volt/10 text-volt border border-volt/30 px-2.5 py-0.5 text-xs font-semibold">
                  15 Models
                </span>
              </div>

              <div className="mt-5 space-y-3 text-sm text-mute">
                <p className="leading-relaxed">
                  <strong className="text-ink">Compact Pack Dynamics:</strong> 2.0 to 5.1 kWh battery capacities require precision stop placement. A route that looks trivial in a car can leave a scooter stranded.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-ink">Pillion & Aerodynamic Drag:</strong> Pillion rider mass and frontal wind area drastically alter Wh/km consumption on open highways.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-ink">Socket Infrastructure:</strong> Routes via verified 15A/16A industrial AC sockets and fast-charging points compatible with portable chargers.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-line/60">
                <span className="text-[11px] font-medium bg-navy-950 px-2.5 py-1 rounded-md text-ink border border-line">
                  Range: 45–140 km
                </span>
                <span className="text-[11px] font-medium bg-navy-950 px-2.5 py-1 rounded-md text-ink border border-line">
                  Nominal: 30–45 Wh/km
                </span>
                <span className="text-[11px] font-medium bg-navy-950 px-2.5 py-1 rounded-md text-ink border border-line">
                  Charge: 3.3 kW AC
                </span>
              </div>
            </div>

            {/* 4-Wheeler Card */}
            <div className="rounded-2xl border border-line bg-navy-900/90 p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric/10 text-electric border border-electric/30">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink">Four-Wheeler EV Routing</h3>
                    <p className="text-xs text-mute">Tata (Nexon/Curvv/Punch), Mahindra (XUV400/BE6), Kia, BYD, MG</p>
                  </div>
                </div>
                <span className="rounded-full bg-electric/10 text-electric border border-electric/30 px-2.5 py-0.5 text-xs font-semibold">
                  12 Models
                </span>
              </div>

              <div className="mt-5 space-y-3 text-sm text-mute">
                <p className="leading-relaxed">
                  <strong className="text-ink">High-Capacity Packs:</strong> 24 to 82.6 kWh battery packs with advanced thermal management, supporting multi-hundred-kilometre intercity journeys.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-ink">Expressway Cruising:</strong> Models high-speed highway consumption (70–100 km/h) where aerodynamic drag dominates energy demand.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-ink">DC Fast Charging (CCS-2):</strong> Prioritizes 30 kW to 150 kW DC Fast Charging hubs with low predicted queue times and high CPO uptime.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-line/60">
                <span className="text-[11px] font-medium bg-navy-950 px-2.5 py-1 rounded-md text-ink border border-line">
                  Range: 180–500 km
                </span>
                <span className="text-[11px] font-medium bg-navy-950 px-2.5 py-1 rounded-md text-ink border border-line">
                  Nominal: 120–165 Wh/km
                </span>
                <span className="text-[11px] font-medium bg-navy-950 px-2.5 py-1 rounded-md text-ink border border-line">
                  Charge: 30–150 kW DC
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CTA FOOTER STRIP ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="glass-card relative overflow-hidden rounded-2xl p-10 text-center border-glow">
          <div className="aurora-blob left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 bg-electric/15" />
          <div className="relative">
            <h2 className="text-2xl font-bold sm:text-3xl text-ink">
              Ready to experience energy-aware navigation?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-mute leading-relaxed">
              Configure your EV model, starting SoC, and route parameters — VoltGrid handles the rest with mathematical precision.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/planner"
                className="group inline-flex h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-volt to-emerald-400 px-6 font-semibold text-navy-950 shadow-[0_0_30px_-6px] shadow-volt/60 transition-all hover:shadow-volt/90 hover:brightness-110"
              >
                Start Route Optimization
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-extrabold text-ink">{value}</p>
      <p className="text-xs text-mute mt-0.5 leading-snug">{label}</p>
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
    <div className="rounded-xl border border-line bg-navy-900/80 p-5 shadow-lg">
      <div className="mb-3 inline-flex rounded-lg bg-navy-800 p-2.5 border border-line">
        {icon}
      </div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-mute">{body}</p>
    </div>
  );
}