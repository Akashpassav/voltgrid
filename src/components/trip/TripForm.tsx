"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PLACES } from "@/lib/data/places";
import { VEHICLES } from "@/lib/data/vehicles";
import type { DrivingPreference, OptimizeResponse, TripRequest } from "@/lib/types";
import { apiPost, DEFAULT_TRIP, saveResult, saveTrip } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Battery, Gauge, MapPin, Navigation } from "lucide-react";

const PREFS: { id: DrivingPreference; label: string; hint: string }[] = [
  { id: "fastest", label: "Fastest", hint: "Minimise driving + charging time" },
  { id: "efficient", label: "Energy efficient", hint: "Protect the pack and range" },
  { id: "reliability", label: "Max charging reliability", hint: "Prefer predicted-available hubs" },
];

export function TripForm({
  initial = DEFAULT_TRIP,
  submitLabel = "Optimize Route",
}: {
  initial?: TripRequest;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [trip, setTrip] = useState<TripRequest>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const vehicle = useMemo(
    () => VEHICLES.find((v) => v.id === trip.vehicleId),
    [trip.vehicleId],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    saveTrip(trip);
    try {
      const result = await apiPost<OptimizeResponse>("/api/optimize-route", trip);
      saveResult(result);
      if (!result.ok) {
        setError(result.message);
        setBusy(false);
        return;
      }
      router.push("/route");
    } catch {
      setError("Network failure. Check that the VoltGrid API is running.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starting location" icon={<MapPin className="h-3.5 w-3.5" />}>
          <select
            className="field"
            value={trip.originId}
            onChange={(e) => setTrip({ ...trip, originId: e.target.value })}
          >
            {PLACES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Destination" icon={<Navigation className="h-3.5 w-3.5" />}>
          <select
            className="field"
            value={trip.destinationId}
            onChange={(e) => setTrip({ ...trip, destinationId: e.target.value })}
          >
            {PLACES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="EV model" icon={<Gauge className="h-3.5 w-3.5" />}>
        <select
          className="field"
          value={trip.vehicleId}
          onChange={(e) => setTrip({ ...trip, vehicleId: e.target.value })}
        >
          {VEHICLES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.brand} {v.name} · {v.batteryKWh} kWh · {v.class}
            </option>
          ))}
        </select>
        {vehicle && (
          <p className="mt-1 text-xs text-mute">
            Base consumption {vehicle.baseConsumptionWhPerKm} Wh/km · safety reserve{" "}
            {vehicle.safetyReservePercent}% · max charge {vehicle.maxChargeKW} kW
          </p>
        )}
      </Field>

      <Field label={`Current battery · ${trip.socPercent}%`} icon={<Battery className="h-3.5 w-3.5" />}>
        <input
          type="range"
          min={5}
          max={100}
          value={trip.socPercent}
          onChange={(e) => setTrip({ ...trip, socPercent: Number(e.target.value) })}
          className="w-full accent-[#3ddc97]"
        />
      </Field>

      <Field label="Desired arrival battery (optional)">
        <input
          type="number"
          min={0}
          max={80}
          placeholder={`${vehicle?.safetyReservePercent ?? 15}`}
          className="field"
          value={trip.arrivalSocPercent ?? ""}
          onChange={(e) =>
            setTrip({
              ...trip,
              arrivalSocPercent: e.target.value === "" ? undefined : Number(e.target.value),
            })
          }
        />
      </Field>

      <fieldset>
        <legend className="mb-2 text-xs uppercase tracking-[0.14em] text-mute">Driving preference</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {PREFS.map((p) => (
            <label
              key={p.id}
              className={`cursor-pointer rounded-lg border px-3 py-2.5 ${
                trip.preference === p.id
                  ? "border-volt bg-volt/10"
                  : "border-line bg-navy-900 hover:border-mute"
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                name="pref"
                checked={trip.preference === p.id}
                onChange={() => setTrip({ ...trip, preference: p.id })}
              />
              <span className="block text-sm font-medium">{p.label}</span>
              <span className="mt-0.5 block text-[11px] text-mute">{p.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "Optimising corridor…" : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-mute">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
