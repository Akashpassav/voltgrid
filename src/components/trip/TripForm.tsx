"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { VEHICLES } from "@/lib/data/vehicles";
import type { DrivingPreference, OptimizeResponse, TripRequest, Coordinates } from "@/lib/types";
import { apiPost, DEFAULT_TRIP, saveResult, saveTrip } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import {
  Battery,
  Gauge,
  MapPin,
  Navigation,
  Car,
  Bike,
  Zap,
  Shield,
  Activity,
  Sparkles,
  Weight,
  Users,
  AlertCircle,
} from "lucide-react";
import { LocationButton } from "@/components/trip/LocationButton";
import { LocationAutocomplete } from "@/components/trip/LocationAutocomplete";
import { InfoTooltip } from "@/components/ui/tooltip";
import { getPlace } from "@/lib/data/places";

function coordsToId(coords: Coordinates, label: string): string {
  return `custom:${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}:${encodeURIComponent(label)}`;
}

export function TripForm({
  initial = DEFAULT_TRIP,
  submitLabel = "Optimize EV Route",
}: {
  initial?: TripRequest;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [trip, setTrip] = useState<TripRequest>(() => ({
    ...initial,
    originId: initial.originId ?? "",
    destinationId: initial.destinationId ?? "",
    arrivalSocPercent: initial.arrivalSocPercent,
    passengerCount: initial.passengerCount ?? 1,
    cargoLoadKg: initial.cargoLoadKg ?? 0,
  }));

  const [originLabel, setOriginLabel] = useState(() => {
    if (!initial.originId) return "";
    const p = getPlace(initial.originId);
    return p?.label || p?.name || (initial.originId.startsWith("custom:") ? decodeURIComponent(initial.originId.split(":")[2] || "") : initial.originId);
  });

  const [destinationLabel, setDestinationLabel] = useState(() => {
    if (!initial.destinationId) return "";
    const p = getPlace(initial.destinationId);
    return p?.label || p?.name || (initial.destinationId.startsWith("custom:") ? decodeURIComponent(initial.destinationId.split(":")[2] || "") : initial.destinationId);
  });

  // Dedicated field-level and general validation errors
  const [originError, setOriginError] = useState<string | null>(null);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const vehicle = useMemo(
    () => VEHICLES.find((v) => v.id === trip.vehicleId) ?? VEHICLES[0],
    [trip.vehicleId],
  );

  const is4W = vehicle?.class === "4W";

  // Real-time battery calculations for live preview
  const usableEnergyKWh = useMemo(() => {
    if (!vehicle) return "0";
    const usableSoc = Math.max(0, trip.socPercent - vehicle.safetyReservePercent);
    return ((vehicle.batteryKWh * usableSoc) / 100).toFixed(1);
  }, [vehicle, trip.socPercent]);

  const estimatedRangeKm = useMemo(() => {
    if (!vehicle) return 0;
    const kwh = Number(usableEnergyKWh);
    return Math.round((kwh * 1000) / vehicle.baseConsumptionWhPerKm);
  }, [vehicle, usableEnergyKWh]);

  function handleOriginTextChange(text: string) {
    setOriginLabel(text);
    setTrip((prev) => ({ ...prev, originId: "" }));
    if (text.trim()) {
      setOriginError(null);
    }
    if (destinationLabel.trim()) {
      setGeneralError(null);
    }
  }

  function handleDestinationTextChange(text: string) {
    setDestinationLabel(text);
    setTrip((prev) => ({ ...prev, destinationId: "" }));
    if (text.trim()) {
      setDestinationError(null);
    }
    if (originLabel.trim()) {
      setGeneralError(null);
    }
  }

  function handleOriginSelect(label: string, coords: Coordinates) {
    setOriginLabel(label);
    setTrip((prev) => ({ ...prev, originId: coordsToId(coords, label) }));
    setOriginError(null);
    setGeneralError(null);
  }

  function handleDestinationSelect(label: string, coords: Coordinates) {
    setDestinationLabel(label);
    setTrip((prev) => ({ ...prev, destinationId: coordsToId(coords, label) }));
    setDestinationError(null);
    setGeneralError(null);
  }

  function handleLocationButtonResolved(address: string, coords: Coordinates) {
    setOriginLabel(address);
    setTrip((prev) => ({ ...prev, originId: coordsToId(coords, address) }));
    setOriginError(null);
    setGeneralError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedOrigin = originLabel.trim();
    const trimmedDest = destinationLabel.trim();

    // 1. Check if both are empty
    if (!trimmedOrigin && !trimmedDest) {
      setOriginError("Please enter a starting location.");
      setDestinationError("Please enter a destination.");
      setGeneralError("Please enter a starting location and destination.");
      return;
    }

    // 2. Check if Start Location is empty
    if (!trimmedOrigin) {
      setOriginError("Please enter a starting location.");
      setGeneralError(null);
      return;
    }

    // 3. Check if Destination is empty
    if (!trimmedDest) {
      setDestinationError("Please enter a destination.");
      setGeneralError(null);
      return;
    }

    // 4. Resolve coordinates if user typed a known place name or direct coordinates without clicking dropdown
    let activeOriginId = trip.originId;
    if (!activeOriginId && trimmedOrigin) {
      const p = getPlace(trimmedOrigin);
      if (p) {
        activeOriginId = coordsToId({ lat: p.latitude, lng: p.longitude }, p.label || p.name);
      } else {
        const parts = trimmedOrigin.split(/[\s,]+/);
        if (parts.length === 2) {
          const lat = Number(parts[0]);
          const lng = Number(parts[1]);
          if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            activeOriginId = coordsToId({ lat, lng }, `Coordinates (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
          }
        }
      }
    }

    let activeDestinationId = trip.destinationId;
    if (!activeDestinationId && trimmedDest) {
      const p = getPlace(trimmedDest);
      if (p) {
        activeDestinationId = coordsToId({ lat: p.latitude, lng: p.longitude }, p.label || p.name);
      } else {
        const parts = trimmedDest.split(/[\s,]+/);
        if (parts.length === 2) {
          const lat = Number(parts[0]);
          const lng = Number(parts[1]);
          if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            activeDestinationId = coordsToId({ lat, lng }, `Coordinates (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
          }
        }
      }
    }

    // 5. If typed text didn't resolve to a valid location selection
    let hasValidationError = false;
    if (!activeOriginId) {
      setOriginError("Please select a valid location from the search results.");
      hasValidationError = true;
    }
    if (!activeDestinationId) {
      setDestinationError("Please select a valid location from the search results.");
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    // All validation passed - clear errors and initiate optimization
    setOriginError(null);
    setDestinationError(null);
    setGeneralError(null);
    setBusy(true);

    const activeTrip = {
      ...trip,
      originId: activeOriginId,
      destinationId: activeDestinationId,
    };

    saveTrip(activeTrip);
    try {
      const result = await apiPost<OptimizeResponse>("/api/optimize-route", activeTrip);
      saveResult(result);
      if (!result.ok) {
        setGeneralError(result.message);
        setBusy(false);
        return;
      }
      router.push("/route");
    } catch {
      setGeneralError("Network failure. Check that the VoltGrid service is running.");
      setBusy(false);
    }
  }

  const prefsConfig: {
    id: DrivingPreference;
    label: string;
    target: string;
    speedRange: string;
    speedLabel: string;
    hint: string;
  }[] = [
    {
      id: "fastest",
      label: "Fastest",
      target: "Minimizes total travel + charge time",
      speedRange: is4W ? "70–90 km/h" : "50–65 km/h",
      speedLabel: "Typical planning speed",
      hint: is4W
        ? "Routes via open national highway corridors with high-power DC fast charging."
        : "Maintains optimal transit speed within statutory 2W highway limits.",
    },
    {
      id: "efficient",
      label: "Energy Efficient",
      target: "Minimizes energy consumption (Wh/km)",
      speedRange: is4W ? "55–70 km/h" : "40–50 km/h",
      speedLabel: "Eco planning speed",
      hint: "Optimizes aerodynamic & motor efficiency sweet spot to conserve battery and reduce stops.",
    },
    {
      id: "reliability",
      label: "Max Reliability",
      target: "Prioritizes verified high-uptime charging hubs",
      speedRange: is4W ? "60–75 km/h" : "40–55 km/h",
      speedLabel: "Balanced planning speed",
      hint: is4W
        ? "Prioritizes multi-connector CPO plazas with high uptime and low predicted queues."
        : "Favors verified dependable charging points with high live availability.",
    },
  ];

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      {/* ── ORIGIN & DESTINATION ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Starting Point"
          icon={<MapPin className="h-3.5 w-3.5 text-electric" />}
          tooltip="Specific departure coordinate or landmark. Exact latitude and longitude are preserved."
        >
          <LocationAutocomplete
            value={originLabel}
            onSelect={handleOriginSelect}
            onTextChange={handleOriginTextChange}
            hasError={!!originError}
            placeholder="Search Tamil Nadu, Bengaluru…"
            extraButton={<LocationButton onResolved={handleLocationButtonResolved} />}
          />
          {originError && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger animate-in fade-in" role="alert">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{originError}</span>
            </p>
          )}
        </Field>

        <Field
          label="Destination"
          icon={<Navigation className="h-3.5 w-3.5 text-volt" />}
          tooltip="Destination coordinate. Used to compute true point-to-point road geometry."
        >
          <LocationAutocomplete
            value={destinationLabel}
            onSelect={handleDestinationSelect}
            onTextChange={handleDestinationTextChange}
            hasError={!!destinationError}
            placeholder="Search Tamil Nadu, Bengaluru…"
          />
          {destinationError && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger animate-in fade-in" role="alert">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{destinationError}</span>
            </p>
          )}
        </Field>
      </div>

      {/* ── VEHICLE CATEGORY & MODEL ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Vehicle Category"
          icon={<Gauge className="h-3.5 w-3.5 text-electric" />}
          tooltip="Select between 2-Wheeler (motorcycles/scooters) and 4-Wheeler (cars/SUVs). Dynamically adjusts consumption, connector compatibility, and speed modeling."
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                const first2W = VEHICLES.find((v) => v.class === "2W");
                if (first2W) {
                  setTrip((prev) => ({
                    ...prev,
                    vehicleId: first2W.id,
                    passengerCount: 1,
                    cargoLoadKg: 0,
                  }));
                }
              }}
              className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 px-3 text-sm font-medium transition-all ${
                !is4W
                  ? "border-volt bg-volt/10 text-ink shadow-[0_0_15px_-4px] shadow-volt/30"
                  : "border-line bg-navy-900 text-mute hover:border-mute hover:text-ink"
              }`}
            >
              <Bike className="h-4 w-4 text-volt" />
              <span>2-Wheeler</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const first4W = VEHICLES.find((v) => v.class === "4W");
                if (first4W) {
                  setTrip((prev) => ({
                    ...prev,
                    vehicleId: first4W.id,
                    passengerCount: 1,
                    cargoLoadKg: 0,
                  }));
                }
              }}
              className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 px-3 text-sm font-medium transition-all ${
                is4W
                  ? "border-electric bg-electric/10 text-ink shadow-[0_0_15px_-4px] shadow-electric/30"
                  : "border-line bg-navy-900 text-mute hover:border-mute hover:text-ink"
              }`}
            >
              <Car className="h-4 w-4 text-electric" />
              <span>4-Wheeler</span>
            </button>
          </div>
        </Field>

        <Field
          label="EV Model"
          icon={<Sparkles className="h-3.5 w-3.5 text-volt" />}
          tooltip="Choose your exact vehicle variant. Applies calibrated battery capacity, nominal Wh/km, and chemistry characteristics."
        >
          <select
            className="field"
            value={trip.vehicleId}
            onChange={(e) => {
              setTrip({
                ...trip,
                vehicleId: e.target.value,
                arrivalSocPercent: trip.arrivalSocPercent,
                passengerCount: 1,
                cargoLoadKg: 0,
              });
            }}
          >
            {VEHICLES.filter((v) => v.class === (vehicle?.class ?? "2W")).map((v) => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.name} ({v.batteryKWh} kWh · {v.batteryProfile.chemistry})
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* ── DYNAMIC VEHICLE & BATTERY SPECIFICATION CARD ── */}
      {vehicle && (
        <div className="rounded-xl border border-line bg-navy-900/70 p-3.5 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-navy-800 px-2 py-0.5 text-xs font-semibold text-ink">
                {is4W ? <Car className="h-3 w-3 text-electric" /> : <Bike className="h-3 w-3 text-volt" />}
                {is4W ? "Passenger EV (4W)" : "Light Electric Vehicle (2W)"}
              </span>
              <span className="text-xs font-medium text-mute">
                {vehicle.brand} {vehicle.name}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-volt/30 bg-volt/10 px-2.5 py-0.5 text-[11px] font-medium text-volt">
              <Activity className="h-3 w-3" />
              Est. Range: ~{estimatedRangeKm} km
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded-lg bg-navy-950/70 p-2 border border-line/40">
              <p className="flex items-center text-mute text-[10px] uppercase tracking-wider">
                Battery Type
                <InfoTooltip
                  title="Battery Chemistry"
                  content="LFP (Lithium Iron Phosphate) offers higher thermal stability and allows routine 100% charging. NMC (Nickel Manganese Cobalt) provides higher energy density."
                />
              </p>
              <p className="mt-1 font-semibold text-ink">
                {vehicle.batteryProfile.chemistry === "LFP"
                  ? "LFP (LiFePO4)"
                  : "NMC (Ternary)"}
              </p>
            </div>

            <div className="rounded-lg bg-navy-950/70 p-2 border border-line/40">
              <p className="flex items-center text-mute text-[10px] uppercase tracking-wider">
                Capacity / Usable
                <InfoTooltip
                  title="Usable Battery Capacity"
                  content={`Total pack is ${vehicle.batteryKWh} kWh. At ${trip.socPercent}% SoC with a ${vehicle.safetyReservePercent}% safety buffer, ~${usableEnergyKWh} kWh is available for route planning.`}
                />
              </p>
              <p className="mt-1 font-semibold text-ink">
                {vehicle.batteryKWh} kWh <span className="text-mute font-normal">({usableEnergyKWh} kWh)</span>
              </p>
            </div>

            <div className="rounded-lg bg-navy-950/70 p-2 border border-line/40">
              <p className="flex items-center text-mute text-[10px] uppercase tracking-wider">
                Base Demand
                <InfoTooltip
                  title="Energy Consumption Rate"
                  content="Nominal energy consumed per kilometre under standard test conditions. Real road consumption scales with passenger payload, speed, and elevation."
                />
              </p>
              <p className="mt-1 font-semibold text-ink">{vehicle.baseConsumptionWhPerKm} Wh/km</p>
            </div>

            <div className="rounded-lg bg-navy-950/70 p-2 border border-line/40">
              <p className="flex items-center text-mute text-[10px] uppercase tracking-wider">
                Peak Charge Rate
                <InfoTooltip
                  title="Charging Capability"
                  content={
                    is4W
                      ? `Supports up to ${vehicle.maxChargeKW} kW DC Fast Charging (CCS-2) alongside standard AC Type 2.`
                      : `Supports up to ${vehicle.maxChargeKW} kW AC Charging via standard 15A/16A industrial sockets.`
                  }
                />
              </p>
              <p className="mt-1 font-semibold text-ink">
                {vehicle.maxChargeKW} kW {is4W ? "DC" : "AC"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── OCCUPANCY & CARGO PAYLOAD ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={is4W ? "Vehicle Occupants" : "Rider Configuration"}
          icon={<Users className="h-3.5 w-3.5 text-volt" />}
          tooltip={
            is4W
              ? "Number of passengers. Each additional occupant increases vehicle mass and energy consumption."
              : "Single rider vs rider with pillion. Pillion adds weight and increases aerodynamic drag."
          }
        >
          <select
            className="field"
            value={trip.passengerCount ?? 1}
            onChange={(e) => setTrip({ ...trip, passengerCount: Number(e.target.value) })}
          >
            {Array.from({ length: is4W ? 5 : 2 }, (_, i) => i + 1).map((count) => (
              <option key={count} value={count}>
                {count}{" "}
                {is4W
                  ? count === 1
                    ? "Occupant (Driver only)"
                    : `Occupants (${count} persons)`
                  : count === 1
                  ? "Rider (Solo)"
                  : "Rider + Pillion Passenger"}
              </option>
            ))}
          </select>
        </Field>

        {is4W ? (
          <Field
            label="Luggage / Cargo Payload"
            icon={<Weight className="h-3.5 w-3.5 text-electric" />}
            tooltip="Additional trunk and cargo payload in kilograms. Incorporated into the energy model."
          >
            <div className="relative">
              <input
                type="number"
                min={0}
                max={400}
                step={10}
                className="field pr-12"
                placeholder="0"
                value={trip.cargoLoadKg ?? 0}
                onChange={(e) => setTrip({ ...trip, cargoLoadKg: Number(e.target.value) })}
              />
              <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-mute">
                kg
              </span>
            </div>
          </Field>
        ) : (
          <Field
            label="Luggage Payload (Optional)"
            icon={<Weight className="h-3.5 w-3.5 text-electric" />}
            tooltip="Backpack or cargo rack weight."
          >
            <div className="relative">
              <input
                type="number"
                min={0}
                max={50}
                step={5}
                className="field pr-12"
                placeholder="0"
                value={trip.cargoLoadKg ?? 0}
                onChange={(e) => setTrip({ ...trip, cargoLoadKg: Number(e.target.value) })}
              />
              <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-mute">
                kg
              </span>
            </div>
          </Field>
        )}
      </div>

      {/* ── BATTERY STATE OF CHARGE (SOC) ── */}
      <Field
        label={`Current State of Charge (SoC): ${trip.socPercent}%`}
        icon={<Battery className="h-3.5 w-3.5 text-volt" />}
        tooltip="State of Charge (SoC): The current percentage of usable energy remaining in the vehicle's battery pack."
      >
        <div className="space-y-2">
          <input
            type="range"
            min={10}
            max={100}
            value={trip.socPercent}
            onChange={(e) => setTrip({ ...trip, socPercent: Number(e.target.value) })}
            className="w-full accent-[#3ddc97] cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono text-mute">
            <span>10% (Low)</span>
            <span className="text-volt font-semibold">{trip.socPercent}% SoC (~{usableEnergyKWh} kWh)</span>
            <span>100% (Full)</span>
          </div>
        </div>
      </Field>

      {/* ── MINIMUM ARRIVAL BATTERY (SAFETY RESERVE) ── */}
      <Field
        label={`Desired Arrival Battery (Default: ${vehicle?.safetyReservePercent ?? 15}% Safety Reserve)`}
        icon={<Shield className="h-3.5 w-3.5 text-warn" />}
        tooltip="Safety Reserve: Battery percentage held as a protected buffer to prevent complete discharge or cell degradation. Enter a higher target if you require residual battery upon arriving."
      >
        <input
          type="number"
          min={0}
          max={90}
          placeholder={`e.g. ${vehicle?.safetyReservePercent ?? 15}% (or leave blank)`}
          className="field"
          value={trip.arrivalSocPercent ?? ""}
          onChange={(e) =>
            setTrip({
              ...trip,
              arrivalSocPercent: e.target.value === "" ? undefined : Number(e.target.value),
            })
          }
        />
        <p className="mt-1 text-xs leading-relaxed text-mute">
          If left blank, the optimizer guarantees arrival with at least the vehicle&apos;s{" "}
          <strong className="text-ink font-medium">{vehicle?.safetyReservePercent ?? 15}%</strong> manufacturer safety reserve.
        </p>
      </Field>

      {/* ── ROUTE PREFERENCE & PLANNING SPEED RANGES ── */}
      <fieldset>
        <legend className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-mute">
          <Zap className="h-3.5 w-3.5 text-volt" />
          Routing Optimization Preference
          <InfoTooltip
            title="Optimization Objectives"
            content="Fastest minimizes driving + charging time. Energy Efficient minimizes overall kWh consumption. Max Reliability prefers high-uptime charging hubs."
          />
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {prefsConfig.map((p) => {
            const isSelected = trip.preference === p.id;
            return (
              <label
                key={p.id}
                className={`relative flex flex-col justify-between cursor-pointer rounded-xl border p-3.5 transition-all ${
                  isSelected
                    ? "border-volt bg-volt/10 shadow-[0_0_20px_-5px] shadow-volt/20"
                    : "border-line bg-navy-900/80 hover:border-mute"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name="pref"
                  checked={isSelected}
                  onChange={() => setTrip({ ...trip, preference: p.id })}
                />
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-ink">{p.label}</span>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-volt shadow-[0_0_8px] shadow-volt" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink/80 leading-snug">{p.target}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-line/60">
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="text-mute">{p.speedLabel}:</span>
                    <span className="font-mono font-semibold text-volt">{p.speedRange}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-mute/90 leading-tight">{p.hint}</p>
                </div>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-mute text-center italic">
          * Typical planning speeds for algorithmic energy simulation. Actual road speeds remain subject to posted Indian traffic regulations (MoRTH) and real-time conditions.
        </p>
      </fieldset>

      {/* ── GENERAL / NETWORK ERROR BANNER ── */}
      {generalError && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-xs font-medium text-danger animate-in fade-in" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      <Button type="submit" size="lg" disabled={busy} className="w-full">
        {busy ? "Optimizing EV Route & Charging Plan…" : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  icon,
  tooltip,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-mute">
        {icon}
        {label}
        {tooltip && <InfoTooltip content={tooltip} />}
      </span>
      {children}
    </label>
  );
}