"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, ShieldAlert, Heart } from "lucide-react";

export function Footer() {
  const path = usePathname();
  if (path === "/route") return null;
  return (
    <footer className="border-t border-line bg-navy-950 px-4 py-8 text-xs text-mute">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-ink font-semibold">
            <Zap className="h-4 w-4 text-volt" />
            <span>VoltGrid EV Charging & Slot Booking Platform</span>
          </div>
          <p className="text-mute/80 text-[11px]">
            India-first unified EV mobility network · Real-time CPO telemetry · Guaranteed slot reservations.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
          <Link href="/stations" className="transition-colors hover:text-ink">
            Find Stations & Slots
          </Link>
          <Link href="/planner" className="transition-colors hover:text-ink">
            EV Route Planner
          </Link>
          <Link href="/bookings" className="transition-colors hover:text-ink">
            My Bookings
          </Link>
          <Link href="/host" className="transition-colors hover:text-ink">
            Host a Charger
          </Link>
          <Link href="/infrastructure" className="transition-colors hover:text-ink">
            Infrastructure Grid
          </Link>
          <Link href="/helpline" className="transition-colors hover:text-amber-400 flex items-center gap-1">
            <ShieldAlert className="h-3 w-3 text-amber-400" />
            EV SOS & Helpline
          </Link>
        </nav>
      </div>
    </footer>
  );
}