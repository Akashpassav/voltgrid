"use client";

import { TripForm } from "@/components/trip/TripForm";
import { DEFAULT_TRIP } from "@/lib/client/api";
import { PortalGuard } from "@/lib/auth/AuthContext";
import { Bike, Car, Route, Sparkles, Navigation, Calendar } from "lucide-react";
import Link from "next/link";

export default function DriverRoutePage() {
  return (
    <PortalGuard allowedRole="driver">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-volt">
            <Route className="h-3.5 w-3.5" />
            Driver Portal · EV Journey Optimizer
          </div>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Energy-Aware Route Planning
          </h1>
          <p className="mt-2 text-sm text-mute leading-relaxed">
            Calculate exact battery consumption across intercity corridors taking into account terrain, vehicle payload, battery chemistry, and charging stops.
          </p>

          <div className="mt-6 rounded-2xl border border-line bg-navy-900/90 p-5 shadow-xl backdrop-blur-sm">
            <TripForm initial={DEFAULT_TRIP} submitLabel="Optimize Route & Charging Plan" />
          </div>
        </div>

        <aside className="space-y-4 text-sm text-mute">
          <div className="rounded-2xl border border-line bg-navy-900/80 p-5 shadow-md">
            <p className="font-semibold text-ink flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-volt" />
              Integrated Slot Booking
            </p>
            <p className="mt-1.5 text-xs text-mute leading-relaxed">
              When our routing engine suggests charging hubs along your route, you can reserve dedicated bays directly to ensure zero waiting time upon arrival.
            </p>
            <Link
              href="/driver/find"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-volt hover:underline"
            >
              <Calendar className="h-3.5 w-3.5" />
              Browse Verified Corridor Chargers →
            </Link>
          </div>

          <div className="rounded-2xl border border-line bg-navy-900/80 p-5 shadow-md space-y-3">
            <p className="font-semibold text-ink text-sm">Pre-calculated Corridor Scenarios</p>

            <div className="rounded-xl bg-navy-950 p-3 border border-line/40 text-xs">
              <div className="flex items-center justify-between text-ink font-semibold">
                <span className="flex items-center gap-1"><Bike className="h-3.5 w-3.5 text-volt" /> 2W Highway Run</span>
                <span className="text-[10px] text-volt bg-volt/10 px-2 py-0.5 rounded">Requires Stop</span>
              </div>
              <p className="text-mute mt-1 font-mono text-[11px]">Chennai → Chengalpattu (Ather 450X · 68% SoC)</p>
            </div>

            <div className="rounded-xl bg-navy-950 p-3 border border-line/40 text-xs">
              <div className="flex items-center justify-between text-ink font-semibold">
                <span className="flex items-center gap-1"><Car className="h-3.5 w-3.5 text-electric" /> 4W Expressway Express</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">0 Stops (Direct)</span>
              </div>
              <p className="text-mute mt-1 font-mono text-[11px]">Chennai → Trichy (Kia EV6 · 95% SoC)</p>
            </div>
          </div>
        </aside>
      </div>
    </PortalGuard>
  );
}
