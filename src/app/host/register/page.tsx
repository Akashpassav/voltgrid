"use client";

import React, { useState } from "react";
import { PortalGuard, useAuth } from "@/lib/auth/AuthContext";
import {
  Home,
  Zap,
  CheckCircle2,
  ShieldCheck,
  PlusCircle,
  MapPin,
  Clock,
  IndianRupee,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HostRegisterPage() {
  const router = useRouter();
  const { session } = useAuth();

  const [chargerName, setChargerName] = useState("");
  const [plugType, setPlugType] = useState("Type 2 Smart Wallbox (7.4 kW)");
  const [powerKW, setPowerKW] = useState(7.4);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Chennai");
  const [tariff, setTariff] = useState(14);
  const [availability, setAvailability] = useState("Daily 8 AM – 10 PM");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargerName || !address) return;

    // Save to localStorage host chargers
    const newCharger = {
      id: `HST-${Date.now().toString().slice(-4)}`,
      name: chargerName,
      plugType,
      powerKW,
      address,
      city,
      tariff,
      availability,
      status: "ACTIVE_VERIFIED",
      registeredAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem("voltgrid_host_chargers") || "[]");
      localStorage.setItem("voltgrid_host_chargers", JSON.stringify([newCharger, ...existing]));
    } catch {}

    setSubmitted(true);
  };

  return (
    <PortalGuard allowedRole="host">
      <div className="min-h-screen bg-navy-950 py-10 px-4">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Header */}
          <div className="border-b border-line pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Host Portal · Registration
            </span>
            <h1 className="text-3xl font-extrabold text-ink mt-0.5">List Your Charging Plug</h1>
            <p className="mt-1 text-xs sm:text-sm text-mute">
              Onboard your home wallbox or commercial plug into India&apos;s premier community charging network.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-3xl border border-emerald-500/40 bg-navy-900 p-8 text-center space-y-4 shadow-2xl animate-fade-up">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
              <h2 className="text-2xl font-bold text-ink">Plug Registered Successfully!</h2>
              <p className="text-xs text-mute max-w-md mx-auto">
                <strong>{chargerName}</strong> is now listed in the community network. Nearby EV drivers can now see your live plug availability and request charging sessions.
              </p>

              <div className="pt-4 flex justify-center gap-3">
                <Link
                  href="/host/profile"
                  className="rounded-xl bg-gradient-to-r from-volt to-emerald-400 px-6 py-2.5 text-xs font-bold text-navy-950 shadow-md"
                >
                  View My Listed Chargers
                </Link>
                <Link
                  href="/host/community"
                  className="rounded-xl border border-line bg-navy-950 px-5 py-2.5 text-xs font-semibold text-ink hover:bg-navy-800"
                >
                  Browse Community Hubs
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-3xl border border-line bg-navy-900/90 p-6 sm:p-8 shadow-2xl space-y-5">
              <div>
                <label className="block text-xs font-semibold text-mute uppercase mb-1">
                  Charger / Location Display Title
                </label>
                <input
                  type="text"
                  required
                  value={chargerName}
                  onChange={(e) => setChargerName(e.target.value)}
                  placeholder="e.g. Besant Nagar Solar Wallbox or Green Villa EV Bay"
                  className="w-full rounded-xl border border-line bg-navy-950 py-2.5 px-3.5 text-xs text-ink placeholder:text-mute/60 focus:border-electric focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-mute uppercase mb-1">
                    Connector / Hardware Type
                  </label>
                  <select
                    value={plugType}
                    onChange={(e) => {
                      setPlugType(e.target.value);
                      if (e.target.value.includes("15A")) setPowerKW(3.3);
                      else if (e.target.value.includes("7.4")) setPowerKW(7.4);
                      else if (e.target.value.includes("11")) setPowerKW(11.0);
                      else setPowerKW(22.0);
                    }}
                    className="w-full rounded-xl border border-line bg-navy-950 py-2.5 px-3.5 text-xs text-ink focus:border-electric focus:outline-none"
                  >
                    <option value="Type 2 Smart Wallbox (7.4 kW)">Type 2 Smart Wallbox (7.4 kW)</option>
                    <option value="15A Heavy Duty Socket (3.3 kW)">15A Heavy Duty Socket (3.3 kW)</option>
                    <option value="11 kW 3-Phase AC Charger">11 kW 3-Phase AC Charger</option>
                    <option value="22 kW Fast AC Charger">22 kW Fast AC Charger</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-mute uppercase mb-1">
                    City
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-line bg-navy-950 py-2.5 px-3.5 text-xs text-ink focus:border-electric focus:outline-none"
                  >
                    <option value="Chennai">Chennai</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Coimbatore">Coimbatore</option>
                    <option value="Madurai">Madurai</option>
                    <option value="Salem">Salem</option>
                    <option value="Trichy">Trichy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-mute uppercase mb-1">
                  Full Street Address & Landmark
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street name, villa number / apartment parking slot, PIN code"
                  className="w-full rounded-xl border border-line bg-navy-950 py-2.5 px-3.5 text-xs text-ink placeholder:text-mute/60 focus:border-electric focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-mute uppercase mb-1">
                    Your Tariff Rate (₹ per kWh)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="25"
                    value={tariff}
                    onChange={(e) => setTariff(Number(e.target.value))}
                    className="w-full rounded-xl border border-line bg-navy-950 py-2.5 px-3.5 text-xs text-ink font-mono focus:border-electric focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-mute uppercase mb-1">
                    Operating Schedule
                  </label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full rounded-xl border border-line bg-navy-950 py-2.5 px-3.5 text-xs text-ink focus:border-electric focus:outline-none"
                  >
                    <option value="Daily 8 AM – 10 PM">Daily 8 AM – 10 PM</option>
                    <option value="24/7 Access">24/7 Access</option>
                    <option value="Weekdays 9 AM – 6 PM">Weekdays 9 AM – 6 PM</option>
                    <option value="Weekends Only">Weekends Only</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-line/60 bg-navy-950/80 p-3.5 flex items-center gap-2 text-xs text-mute">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>VoltGrid automatically generates monthly payout settlements to your linked bank account.</span>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-volt py-3.5 text-xs font-bold text-navy-950 shadow-md shadow-emerald-400/30 hover:brightness-110 transition-all cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                Publish & Activate Community Charger
              </button>
            </form>
          )}
        </div>
      </div>
    </PortalGuard>
  );
}
