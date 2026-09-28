"use client";

import React, { useState } from "react";
import { PortalGuard } from "@/lib/auth/AuthContext";
import {
  IndianRupee,
  Zap,
  Home,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Leaf,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function HostEarningsPage() {
  const [chargerPower, setChargerPower] = useState(7.4);
  const [dailyHours, setDailyHours] = useState(4);
  const [tariff, setTariff] = useState(15);

  const dailyKWh = dailyHours * (chargerPower * 0.85);
  const marginPerKWh = Math.max(3, tariff - 8);
  const monthlyEarnings = Math.round(dailyKWh * marginPerKWh * 30);
  const yearlyEarnings = monthlyEarnings * 12;

  return (
    <PortalGuard allowedRole="host">
      <div className="min-h-screen bg-navy-950 py-10 px-4">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Host Portal · Passive Revenue Calculator
              </span>
              <h1 className="text-3xl font-extrabold text-ink mt-0.5">Net Earnings Estimator</h1>
              <p className="mt-1 text-xs sm:text-sm text-mute">
                Calculate how much passive income your idle home wallbox or commercial 15A socket can generate.
              </p>
            </div>

            <Link
              href="/host/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-volt px-5 py-2.5 text-xs font-bold text-navy-950 shadow-md shadow-emerald-400/30 hover:brightness-110 transition-all self-start sm:self-auto"
            >
              List My Plug Now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Calculator Grid */}
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
            {/* Left Inputs */}
            <div className="glass-card rounded-2xl p-6 sm:p-8 border-line space-y-6">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-volt" /> Configure Charger Specs & Pricing
              </h2>

              {/* Charger Rating */}
              <div>
                <label className="text-xs font-semibold uppercase text-mute tracking-wider block mb-2">
                  Charger Rating
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { label: "15A Socket", power: 3.3 },
                    { label: "7.4 kW Wallbox", power: 7.4 },
                    { label: "11–22 kW Fast AC", power: 11.0 },
                  ].map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => setChargerPower(t.power)}
                      className={`rounded-xl border p-3 text-center transition-all cursor-pointer ${
                        chargerPower === t.power
                          ? "border-volt bg-volt/10 text-ink font-bold shadow-sm"
                          : "border-line bg-navy-950 text-mute hover:border-line-strong"
                      }`}
                    >
                      <span className="block text-xs">{t.label}</span>
                      <span className="text-[10px] text-volt">{t.power} kW</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hours shared slider */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-mute">Hours Shared Per Day</span>
                  <span className="text-volt font-mono font-bold">{dailyHours} hours/day</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="1"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseInt(e.target.value))}
                  className="w-full accent-volt cursor-pointer"
                />
              </div>

              {/* Tariff price slider */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-mute">Your Charging Tariff</span>
                  <span className="text-emerald-400 font-mono font-bold">₹{tariff}/kWh</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="22"
                  step="1"
                  value={tariff}
                  onChange={(e) => setTariff(parseInt(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <span className="text-[10px] text-mute mt-1 block">
                  Typical domestic electricity cost in Tamil Nadu / Karnataka is ~₹7.5–₹8.5/kWh.
                </span>
              </div>
            </div>

            {/* Right Projected Income Result */}
            <div className="rounded-3xl border border-volt/30 bg-gradient-to-b from-navy-900 to-navy-950 p-8 shadow-2xl text-center relative overflow-hidden">
              <div className="aurora-blob top-0 right-0 h-40 w-40 bg-volt/20" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-volt">
                Projected Net Host Income
              </span>

              <div className="my-6">
                <span className="text-5xl font-extrabold text-ink font-mono tracking-tight">
                  ₹{monthlyEarnings.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-mute block mt-1">net profit / month</span>
              </div>

              <div className="rounded-2xl border border-line/60 bg-navy-950/80 p-4 mb-6 text-xs text-mute space-y-2">
                <div className="flex justify-between">
                  <span>Annualized Profit:</span>
                  <strong className="text-emerald-400 font-mono">₹{yearlyEarnings.toLocaleString("en-IN")}/yr</strong>
                </div>
                <div className="flex justify-between">
                  <span>Daily Energy Shared:</span>
                  <strong className="text-ink font-mono">~{dailyKWh.toFixed(1)} kWh</strong>
                </div>
                <div className="flex justify-between">
                  <span>Green CO₂ Offset:</span>
                  <strong className="text-volt font-mono">~{Math.round(dailyKWh * 30 * 0.82)} kg/mo</strong>
                </div>
              </div>

              <Link
                href="/host/register"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-volt to-emerald-400 py-3 text-xs font-bold text-navy-950 shadow-md shadow-volt/30 hover:brightness-110 transition-all"
              >
                Register & Start Monetizing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PortalGuard>
  );
}
