"use client";

import React, { useState } from "react";
import {
  Zap,
  Home,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
  Car,
  Bike,
  PlusCircle,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

interface CommunityHost {
  id: string;
  name: string;
  hostName: string;
  location: string;
  city: string;
  chargerType: string;
  powerKW: number;
  tariffPerKWh: number;
  rating: number;
  reviewsCount: number;
  availability: string;
  amenities: string[];
}

const SAMPLE_COMMUNITY_HOSTS: CommunityHost[] = [
  {
    id: "CH-01",
    name: "Green Villa Home Wallbox",
    hostName: "Karthik R.",
    location: "Besant Nagar, 4th Avenue",
    city: "Chennai",
    chargerType: "Type 2 Wallbox",
    powerKW: 7.4,
    tariffPerKWh: 13,
    rating: 4.9,
    reviewsCount: 38,
    availability: "Daily 8 AM – 10 PM",
    amenities: ["Covered Parking", "CCTV", "Restroom"],
  },
  {
    id: "CH-02",
    name: "Indiranagar Solar Plug",
    hostName: "Ananya S.",
    location: "12th Main, HAL 2nd Stage",
    city: "Bengaluru",
    chargerType: "15A Industrial AC",
    powerKW: 3.3,
    tariffPerKWh: 11,
    rating: 4.8,
    reviewsCount: 52,
    availability: "24/7 Access",
    amenities: ["Solar Powered", "Gated Security", "WiFi"],
  },
  {
    id: "CH-03",
    name: "Kovai Tech Park Shared Hub",
    hostName: "Praveen Kumar",
    location: "Avinashi Road, Peelamedu",
    city: "Coimbatore",
    chargerType: "Type 2 Fast AC",
    powerKW: 11,
    tariffPerKWh: 14,
    rating: 5.0,
    reviewsCount: 19,
    availability: "Weekdays 9 AM – 7 PM",
    amenities: ["Driveway Access", "Coffee Shop Nearby"],
  },
];

export default function HostChargerPage() {
  // Calculator state
  const [chargerPower, setChargerPower] = useState(7.4);
  const [dailyHours, setDailyHours] = useState(4);
  const [tariff, setTariff] = useState(15);

  // Form state
  const [hostName, setHostName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Chennai");
  const [plugType, setPlugType] = useState("Type 2 Wallbox (7.4 kW)");
  const [submitted, setSubmitted] = useState(false);

  // Calculations
  const dailyKWh = dailyHours * (chargerPower * 0.85); // 85% load factor
  const marginPerKWh = Math.max(3, tariff - 8); // approximate residential tariff cost ₹8/kWh
  const monthlyEarnings = Math.round(dailyKWh * marginPerKWh * 30);
  const yearlyEarnings = monthlyEarnings * 12;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName || !phone || !address) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-navy-950 py-12 px-4">
      <div className="mx-auto max-w-6xl space-y-16">
        {/* ── HERO BANNER ── */}
        <section className="relative rounded-3xl border border-line bg-gradient-to-b from-navy-900 via-navy-900/80 to-navy-950 p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="aurora-blob -top-24 right-1/4 h-80 w-80 bg-volt/15" />
          <div className="aurora-blob top-1/2 -left-20 h-80 w-80 bg-electric/15" />

          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-volt/10 border border-volt/30 px-3.5 py-1 text-xs font-semibold text-volt mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Peer-to-Peer Community EV Charging
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-ink tracking-tight">
              Turn your EV Charger or 15A Socket into{" "}
              <span className="bg-gradient-to-r from-volt via-emerald-400 to-electric bg-clip-text text-transparent">
                Passive Income.
              </span>
            </h1>

            <p className="mt-4 text-base text-mute leading-relaxed">
              Join India&apos;s fastest growing community charger network. Share your home wallbox, office bay, or private socket with verified EV owners when idle. Set your own pricing and schedule.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#register-section"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-volt to-emerald-400 px-6 py-3 font-bold text-navy-950 shadow-lg shadow-volt/40 hover:brightness-110 transition-all text-sm"
              >
                <PlusCircle className="h-4 w-4" />
                List Your Charger in 3 Minutes
              </a>
              <a
                href="#calculator"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-navy-900/80 px-5 py-3 text-sm font-semibold text-ink hover:border-electric transition-colors"
              >
                <IndianRupee className="h-4 w-4 text-emerald-400" />
                Calculate Potential Earnings
              </a>
            </div>
          </div>
        </section>

        {/* ── EARNINGS ESTIMATOR (INTERACTIVE CALCULATOR) ── */}
        <section id="calculator" className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
          <div className="glass-card rounded-2xl p-6 sm:p-8 border-line">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-volt" />
              <h2 className="text-xl font-bold text-ink">Host Earnings Estimator</h2>
            </div>
            <p className="mt-1 text-xs text-mute">
              Estimate your monthly revenue based on your charger rating and daily idle availability.
            </p>

            <div className="mt-6 space-y-6">
              {/* Charger Type Selection */}
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
                      className={`rounded-xl border p-3 text-center transition-all ${
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
                  Average residential grid power cost in Tamil Nadu / Karnataka is ~₹7.5–₹8.5/kWh.
                </span>
              </div>
            </div>
          </div>

          {/* Earning Calculation Result Card */}
          <div className="rounded-2xl border border-volt/30 bg-gradient-to-b from-navy-900 to-navy-950 p-8 shadow-2xl text-center relative overflow-hidden">
            <div className="aurora-blob top-0 right-0 h-40 w-40 bg-volt/20" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-volt">
              Projected Net Host Income
            </span>

            <div className="my-6">
              <span className="text-5xl font-extrabold text-ink font-mono">
                ₹{monthlyEarnings.toLocaleString("en-IN")}
              </span>
              <span className="text-sm text-mute block mt-1">per month</span>
            </div>

            <div className="rounded-xl border border-line/60 bg-navy-950/80 p-4 mb-6">
              <div className="flex justify-between text-xs text-mute py-1">
                <span>Annual Passive Income:</span>
                <strong className="text-emerald-400 font-mono">₹{yearlyEarnings.toLocaleString("en-IN")}/yr</strong>
              </div>
              <div className="flex justify-between text-xs text-mute py-1">
                <span>Daily Energy Dispensed:</span>
                <strong className="text-ink font-mono">~{dailyKWh.toFixed(1)} kWh</strong>
              </div>
              <div className="flex justify-between text-xs text-mute py-1">
                <span>Carbon Emissions Offset:</span>
                <strong className="text-volt font-mono">~{Math.round(dailyKWh * 30 * 0.82)} kg CO₂/mo</strong>
              </div>
            </div>

            <a
              href="#register-section"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-volt to-emerald-400 py-3 text-xs font-bold text-navy-950 shadow-md shadow-volt/30 hover:brightness-110 transition-all"
            >
              Start Earning Now
            </a>
          </div>
        </section>

        {/* ── BROWSE COMMUNITY HOSTED CHARGERS ── */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-4">
            <div>
              <h2 className="text-2xl font-bold text-ink flex items-center gap-2">
                <Users className="h-5 w-5 text-electric" /> Featured Community Chargers
              </h2>
              <p className="text-xs text-mute mt-0.5">
                Verified private plugs and wallboxes shared by community members.
              </p>
            </div>
            <span className="text-xs font-medium text-volt">100% Verified Hosts</span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {SAMPLE_COMMUNITY_HOSTS.map((host) => (
              <div
                key={host.id}
                className="rounded-2xl border border-line bg-navy-900/90 p-5 shadow-lg flex flex-col justify-between hover:border-electric/50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-electric/15 text-electric border border-electric/30 px-2 py-0.5 text-[10px] font-semibold">
                      Community Host
                    </span>
                    <span className="text-xs font-bold text-amber-400">★ {host.rating} ({host.reviewsCount})</span>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-ink">{host.name}</h3>
                  <p className="text-xs text-mute mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-mute" /> {host.location}, {host.city}
                  </p>

                  <div className="mt-4 space-y-1.5 text-xs text-mute">
                    <div className="flex justify-between">
                      <span>Plug Type:</span>
                      <strong className="text-ink">{host.chargerType} ({host.powerKW} kW)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Schedule:</span>
                      <strong className="text-ink">{host.availability}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Host:</span>
                      <span className="text-mute">{host.hostName}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {host.amenities.map((a) => (
                      <span key={a} className="rounded-md bg-navy-950 px-2 py-0.5 text-[10px] text-mute border border-line">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 border-t border-line/50 pt-3 flex items-center justify-between">
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    ₹{host.tariffPerKWh}/kWh
                  </span>
                  <Link
                    href={`/stations`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-volt hover:text-emerald-300 transition-colors"
                  >
                    View & Reserve →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── REGISTRATION FORM ── */}
        <section id="register-section" className="rounded-3xl border border-line bg-navy-900/90 p-8 sm:p-10 shadow-2xl">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-volt">List Your Charging Plug</span>
              <h2 className="mt-1 text-3xl font-extrabold text-ink">Become a VoltGrid Host</h2>
              <p className="mt-2 text-xs text-mute">
                Fill in the details below. Our field team will review and verify your plug within 24 hours.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-2xl border border-volt/40 bg-navy-950 p-8 text-center animate-fade-up">
                <CheckCircle2 className="mx-auto h-12 w-12 text-volt mb-3" />
                <h3 className="text-xl font-bold text-ink">Registration Received!</h3>
                <p className="mt-2 text-xs text-mute max-w-md mx-auto">
                  Thank you, <strong>{hostName}</strong>! Your charger application at {address}, {city} has been logged. Our onboarding coordinator will call you on <strong>{phone}</strong> to verify parking access.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 rounded-xl bg-navy-800 px-5 py-2 text-xs font-semibold text-ink border border-line hover:bg-navy-700"
                >
                  Register Another Charger
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-mute uppercase mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      placeholder="e.g. Ramesh Chandran"
                      className="w-full rounded-xl border border-line bg-navy-950 px-3.5 py-2.5 text-xs text-ink placeholder:text-mute/60 focus:border-electric focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-mute uppercase mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-line bg-navy-950 px-3.5 py-2.5 text-xs text-ink placeholder:text-mute/60 focus:border-electric focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-mute uppercase mb-1">City</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-line bg-navy-950 px-3.5 py-2.5 text-xs text-ink focus:border-electric focus:outline-none"
                    >
                      <option value="Chennai">Chennai</option>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Coimbatore">Coimbatore</option>
                      <option value="Madurai">Madurai</option>
                      <option value="Salem">Salem</option>
                      <option value="Trichy">Trichy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-mute uppercase mb-1">Plug / Charger Model</label>
                    <select
                      value={plugType}
                      onChange={(e) => setPlugType(e.target.value)}
                      className="w-full rounded-xl border border-line bg-navy-950 px-3.5 py-2.5 text-xs text-ink focus:border-electric focus:outline-none"
                    >
                      <option value="Type 2 Wallbox (7.4 kW)">Type 2 Smart Wallbox (7.4 kW)</option>
                      <option value="15A Heavy Duty Socket (3.3 kW)">15A Heavy Duty Socket (3.3 kW)</option>
                      <option value="11 kW 3-Phase AC Charger">11 kW 3-Phase AC Charger</option>
                      <option value="22 kW Fast AC Charger">22 kW Fast AC Charger</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-mute uppercase mb-1">Full Address / Location</label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Apartment name, street, landmark, PIN code"
                    className="w-full rounded-xl border border-line bg-navy-950 px-3.5 py-2.5 text-xs text-ink placeholder:text-mute/60 focus:border-electric focus:outline-none"
                  />
                </div>

                <div className="rounded-xl border border-line/50 bg-navy-950/60 p-3 flex items-center gap-2 text-[11px] text-mute">
                  <ShieldCheck className="h-4 w-4 text-volt shrink-0" />
                  <span>VoltGrid provides host protection insurance and smart payment collection.</span>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-volt to-emerald-400 py-3.5 font-bold text-navy-950 shadow-lg shadow-volt/30 hover:brightness-110 transition-all text-sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  Submit Charger for Verification
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
