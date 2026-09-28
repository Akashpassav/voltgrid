"use client";

import React, { useEffect, useState } from "react";
import { PortalGuard, useAuth } from "@/lib/auth/AuthContext";
import {
  Home,
  Zap,
  CheckCircle2,
  Clock,
  IndianRupee,
  Power,
  Edit,
  PlusCircle,
  User,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface ListedCharger {
  id: string;
  name: string;
  plugType: string;
  powerKW: number;
  address: string;
  city: string;
  tariff: number;
  availability: string;
  status: "ACTIVE_VERIFIED" | "OFFLINE";
  registeredAt: string;
}

const DEFAULT_HOST_CHARGERS: ListedCharger[] = [
  {
    id: "HST-4091",
    name: "Green Villa Home Wallbox (Private Bay 1)",
    plugType: "Type 2 Smart Wallbox (7.4 kW)",
    powerKW: 7.4,
    address: "Besant Nagar, 4th Avenue, Chennai",
    city: "Chennai",
    tariff: 14,
    availability: "Daily 8 AM – 10 PM",
    status: "ACTIVE_VERIFIED",
    registeredAt: "2026-09-15",
  },
];

export default function HostProfilePage() {
  const { session } = useAuth();
  const [chargers, setChargers] = useState<ListedCharger[]>(DEFAULT_HOST_CHARGERS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("voltgrid_host_chargers");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setChargers(parsed);
        }
      }
    } catch {}
  }, []);

  const toggleStatus = (id: string) => {
    setChargers((prev) => {
      const updated = prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "ACTIVE_VERIFIED" ? ("OFFLINE" as const) : ("ACTIVE_VERIFIED" as const) }
          : c,
      );
      localStorage.setItem("voltgrid_host_chargers", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <PortalGuard allowedRole="host">
      <div className="min-h-screen bg-navy-950 py-10 px-4">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Host Portal · Account & Hardware
              </span>
              <h1 className="text-3xl font-extrabold text-ink mt-0.5">My Listed EV Chargers</h1>
              <p className="mt-1 text-xs sm:text-sm text-mute">
                Manage your active community charging sockets, power status, tariffs, and revenue payouts.
              </p>
            </div>

            <Link
              href="/host/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-volt px-5 py-2.5 text-xs font-bold text-navy-950 shadow-md hover:brightness-110 transition-all self-start sm:self-auto"
            >
              <PlusCircle className="h-4 w-4" /> Add Another Plug
            </Link>
          </div>

          {/* Host Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-line bg-navy-900/80 p-5 shadow-lg flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <IndianRupee className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase font-medium text-mute">September Payout</p>
                <p className="text-2xl font-extrabold text-emerald-400 font-mono">₹4,620</p>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-navy-900/80 p-5 shadow-lg flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-volt/15 text-volt border border-volt/30">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase font-medium text-mute">Energy Dispensed</p>
                <p className="text-2xl font-extrabold text-ink font-mono">385 kWh</p>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-navy-900/80 p-5 shadow-lg flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric/15 text-electric border border-electric/30">
                <Home className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase font-medium text-mute">Active Plugs</p>
                <p className="text-2xl font-extrabold text-ink font-mono">
                  {chargers.filter((c) => c.status === "ACTIVE_VERIFIED").length}
                </p>
              </div>
            </div>
          </div>

          {/* Listed Chargers List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" /> Active Hardware Units
            </h2>

            <div className="space-y-4">
              {chargers.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-line bg-navy-900/90 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                          c.status === "ACTIVE_VERIFIED"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-red-500/15 text-red-400 border-red-500/30"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            c.status === "ACTIVE_VERIFIED" ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                          }`}
                        />
                        {c.status.replace("_", " ")}
                      </span>
                      <span className="font-mono text-xs text-mute">{c.id}</span>
                    </div>

                    <h3 className="text-xl font-bold text-ink">{c.name}</h3>
                    <p className="text-xs text-mute">{c.address}, {c.city}</p>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-mute border-t border-line/40 pt-2.5">
                      <span>Hardware: <strong className="text-ink">{c.plugType}</strong></span>
                      <span>Schedule: <strong className="text-ink">{c.availability}</strong></span>
                      <span>Tariff: <strong className="text-emerald-400 font-mono">₹{c.tariff}/kWh</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleStatus(c.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                        c.status === "ACTIVE_VERIFIED"
                          ? "bg-navy-950 border border-line text-mute hover:text-red-400 hover:border-red-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {c.status === "ACTIVE_VERIFIED" ? "Set Offline" : "Set Online"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalGuard>
  );
}
