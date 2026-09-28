"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortalGuard, useAuth } from "@/lib/auth/AuthContext";
import { updateSessionVehicle, VehicleProfile } from "@/lib/auth";
import {
  INDIAN_VEHICLE_PRESETS,
  searchVehiclePresets,
  VehiclePresetItem,
} from "@/lib/data/vehicle-presets";
import {
  Car,
  Bike,
  Zap,
  BatteryCharging,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
  Info,
} from "lucide-react";

function DriverProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "1";

  const { session } = useAuth();

  // Search & Typeahead State
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<VehiclePresetItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Selected / active vehicle state
  const [vehicle, setVehicle] = useState<VehicleProfile>(() => {
    return (
      session?.defaultVehicle || {
        id: "tata-nexon-ev-long-range",
        name: "Tata Nexon EV Long Range / Max",
        brand: "Tata Motors",
        class: "4W",
        connectorType: "CCS2",
        batteryKWh: 40.5,
        maxChargeKW: 50,
        regNumber: "TN 09 AB 4912",
      }
    );
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Handle typing & filtering
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (val.trim()) {
      const results = searchVehiclePresets(val);
      setSuggestions(results);
      setIsDropdownOpen(true);
    } else {
      setSuggestions(INDIAN_VEHICLE_PRESETS.slice(0, 8));
      setIsDropdownOpen(true);
    }
  };

  // Select item from typeahead dropdown -> auto-fills dependent fields
  const handleSelectPreset = (preset: VehiclePresetItem) => {
    setVehicle((prev) => ({
      ...prev,
      id: preset.id,
      name: preset.name,
      brand: preset.brand,
      class: preset.class,
      connectorType: preset.connectorType,
      batteryKWh: preset.batteryKWh,
      maxChargeKW: preset.maxChargeKW,
    }));
    setSearchTerm(preset.name);
    setIsDropdownOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSessionVehicle(vehicle);
    setSavedSuccess(true);

    if (isOnboarding) {
      setTimeout(() => {
        router.push("/driver/find");
      }, 1000);
    } else {
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <PortalGuard allowedRole="driver">
      <div className="min-h-screen bg-navy-950 py-10 px-4">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Onboarding Welcome Banner */}
          {isOnboarding && (
            <div className="rounded-2xl border border-volt/40 bg-gradient-to-r from-volt/15 via-navy-900 to-electric/15 p-6 shadow-xl animate-fade-up">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-volt/20 text-volt border border-volt/40">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">Welcome to VoltGrid Driver Portal!</h2>
                  <p className="mt-1 text-xs text-mute leading-relaxed">
                    Set up your primary vehicle profile below. VoltGrid will automatically pre-filter compatible fast chargers (CCS2, Type 2, or 15A socket) and pre-fill your battery capacity during slot bookings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* User Account Info Card */}
          <div className="rounded-2xl border border-line bg-navy-900/80 p-6 shadow-xl">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <User className="h-4 w-4 text-electric" /> Driver Account Profile
            </h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl border border-line bg-navy-950 p-3">
                <span className="text-[10px] text-mute uppercase font-semibold">Driver Name</span>
                <p className="font-bold text-ink mt-0.5">{session?.name || "Active Driver"}</p>
              </div>
              <div className="rounded-xl border border-line bg-navy-950 p-3">
                <span className="text-[10px] text-mute uppercase font-semibold">Email</span>
                <p className="font-bold text-ink mt-0.5 truncate">{session?.email || "driver@voltgrid.io"}</p>
              </div>
              <div className="rounded-xl border border-line bg-navy-950 p-3">
                <span className="text-[10px] text-mute uppercase font-semibold">Role Access</span>
                <span className="inline-block mt-0.5 rounded-full bg-volt/15 px-2.5 py-0.5 text-[10px] font-bold text-volt border border-volt/30">
                  VERIFIED EV DRIVER
                </span>
              </div>
            </div>
          </div>

          {/* Vehicle Profile Form with Auto-fill Typeahead */}
          <div className="rounded-2xl border border-line bg-navy-900/90 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/60 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-volt">
                  Primary EV Details
                </span>
                <h1 className="text-2xl font-extrabold text-ink">Default Vehicle & Battery Specs</h1>
                <p className="text-xs text-mute mt-0.5">
                  Type your EV model below to auto-populate charging connector & pack capacity.
                </p>
              </div>

              <div className="inline-flex rounded-xl bg-navy-950 border border-line p-1 text-xs">
                <span className="flex items-center gap-1.5 px-3 py-1 font-semibold text-volt">
                  {vehicle.class === "2W" ? <Bike className="h-3.5 w-3.5" /> : <Car className="h-3.5 w-3.5" />}
                  {vehicle.class} Electric
                </span>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Typeahead Search Input */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-semibold uppercase text-mute mb-1.5 flex items-center justify-between">
                  <span>Type EV Model Name (Typeahead Auto-Fill)</span>
                  <span className="text-[10px] text-electric lowercase font-normal flex items-center gap-1">
                    <Info className="h-3 w-3" /> Select from presets to auto-fill
                  </span>
                </label>

                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
                  <input
                    type="text"
                    value={searchTerm}
                    onFocus={() => {
                      setSuggestions(searchVehiclePresets(searchTerm));
                      setIsDropdownOpen(true);
                    }}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="e.g. Tata Nexon EV, Punch EV, Ather 450X, Ola S1, MG ZS, BYD…"
                    className="w-full rounded-xl border border-line bg-navy-950 py-3 pl-10 pr-4 text-sm text-ink placeholder:text-mute/60 focus:border-electric focus:outline-none shadow-sm"
                  />
                </div>

                {/* Dropdown Results */}
                {isDropdownOpen && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border border-line bg-navy-900 shadow-2xl divide-y divide-line/40">
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectPreset(item)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs hover:bg-navy-800 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-950 text-volt border border-line">
                            {item.class === "2W" ? <Bike className="h-4 w-4" /> : <Car className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-ink">{item.name}</p>
                            <p className="text-[10px] text-mute">{item.brand} · {item.class}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-semibold text-volt">{item.batteryKWh} kWh</span>
                          <p className="text-[10px] text-mute">{item.connectorType}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Auto-Populated Dependent Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Vehicle Class */}
                <div className="rounded-xl border border-line/60 bg-navy-950 p-3.5">
                  <span className="text-[10px] uppercase font-semibold text-mute block">Vehicle Class</span>
                  <p className="mt-1 font-mono text-sm font-bold text-ink flex items-center gap-1.5">
                    {vehicle.class === "2W" ? <Bike className="h-4 w-4 text-volt" /> : <Car className="h-4 w-4 text-electric" />}
                    {vehicle.class === "2W" ? "2-Wheeler (Scooter/Bike)" : "4-Wheeler (Passenger Car)"}
                  </p>
                </div>

                {/* Connector Type */}
                <div className="rounded-xl border border-line/60 bg-navy-950 p-3.5">
                  <span className="text-[10px] uppercase font-semibold text-mute block">Connector Standard</span>
                  <p className="mt-1 font-mono text-sm font-bold text-electric flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-electric" />
                    {vehicle.connectorType}
                  </p>
                </div>

                {/* Battery Pack */}
                <div className="rounded-xl border border-line/60 bg-navy-950 p-3.5">
                  <span className="text-[10px] uppercase font-semibold text-mute block">Pack Capacity</span>
                  <p className="mt-1 font-mono text-sm font-bold text-volt flex items-center gap-1.5">
                    <BatteryCharging className="h-4 w-4 text-volt" />
                    {vehicle.batteryKWh} kWh
                  </p>
                </div>

                {/* Max Charge Speed */}
                <div className="rounded-xl border border-line/60 bg-navy-950 p-3.5">
                  <span className="text-[10px] uppercase font-semibold text-mute block">Max Charge Rate</span>
                  <p className="mt-1 font-mono text-sm font-bold text-emerald-400">
                    Up to {vehicle.maxChargeKW} kW
                  </p>
                </div>
              </div>

              {/* Vehicle Registration Number (Optional) */}
              <div>
                <label className="block text-xs font-semibold uppercase text-mute mb-1">
                  Registration Plate Number (Optional)
                </label>
                <input
                  type="text"
                  value={vehicle.regNumber || ""}
                  onChange={(e) => setVehicle({ ...vehicle, regNumber: e.target.value })}
                  placeholder="e.g. TN 09 AB 1234 or KA 05 EV 9901"
                  className="w-full sm:w-80 rounded-xl border border-line bg-navy-950 py-2.5 px-3.5 text-xs text-ink placeholder:text-mute/50 focus:border-electric focus:outline-none uppercase font-mono"
                />
              </div>

              {/* Status Message */}
              {savedSuccess && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center gap-2 animate-fade-up">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    Default vehicle set to <strong>{vehicle.name}</strong>. Future bookings will automatically pre-select this vehicle!
                  </span>
                </div>
              )}

              {/* Save CTA */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-volt to-emerald-400 px-6 py-3 text-xs font-bold text-navy-950 shadow-lg shadow-volt/30 hover:brightness-110 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isOnboarding ? "Save & Proceed to Station Finder →" : "Save Vehicle Profile"}
                </button>

                {isOnboarding && (
                  <button
                    type="button"
                    onClick={() => router.push("/driver/find")}
                    className="text-xs text-mute hover:text-ink transition-colors"
                  >
                    Skip for now →
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </PortalGuard>
  );
}

export default function DriverProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-xs text-mute">Loading vehicle profile…</div>}>
      <DriverProfileContent />
    </Suspense>
  );
}
