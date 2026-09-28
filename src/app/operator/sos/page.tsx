"use client";

import React, { useState } from "react";
import { PortalGuard } from "@/lib/auth/AuthContext";
import {
  ShieldAlert,
  AlertTriangle,
  PhoneCall,
  Truck,
  BatteryCharging,
  CheckCircle2,
  Clock,
  MapPin,
  Car,
  Bike,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface Incident {
  id: string;
  driverName: string;
  phone: string;
  vehicle: string;
  vehicleClass: "2W" | "4W";
  batterySoC: number;
  location: string;
  timeReported: string;
  status: "OPEN_DISPATCH" | "RESCUE_EN_ROUTE" | "RESOLVED";
  assignedUnit?: string;
}

const SAMPLE_INCIDENTS: Incident[] = [
  {
    id: "SOS-2026-901",
    driverName: "Sanjay Kumar",
    phone: "+91 98401 23456",
    vehicle: "Ather 450X Gen 3",
    vehicleClass: "2W",
    batterySoC: 3,
    location: "GST Road near Guduvancheri Flyover, Chennai",
    timeReported: "12 mins ago",
    status: "OPEN_DISPATCH",
  },
  {
    id: "SOS-2026-898",
    driverName: "Meera Krishnan",
    phone: "+91 94440 98765",
    vehicle: "Tata Nexon EV Max",
    vehicleClass: "4W",
    batterySoC: 7,
    location: "NH 48 Sriperumbudur Toll Plaza, Tamil Nadu",
    timeReported: "28 mins ago",
    status: "RESCUE_EN_ROUTE",
    assignedUnit: "Mobile DC Fast Charge Van #4 (15 kW Boost)",
  },
  {
    id: "SOS-2026-890",
    driverName: "Vikram R.",
    phone: "+91 97909 11223",
    vehicle: "Ola S1 Pro",
    vehicleClass: "2W",
    batterySoC: 0,
    location: "OMR Navalur Junction, Chennai",
    timeReported: "1 hour ago",
    status: "RESOLVED",
    assignedUnit: "Flatbed Recovery Unit #2",
  },
];

export default function OperatorSosPage() {
  const [incidents, setIncidents] = useState<Incident[]>(SAMPLE_INCIDENTS);

  const handleAssignVan = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              status: "RESCUE_EN_ROUTE",
              assignedUnit: "Mobile Rapid Charge Van #1 (CCS2/15A Socket)",
            }
          : inc,
      ),
    );
  };

  const handleResolve = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: "RESOLVED" } : inc)),
    );
  };

  return (
    <PortalGuard allowedRole="operator">
      <div className="min-h-screen bg-navy-950 py-10 px-4">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-3 py-0.5 text-xs font-semibold text-red-400 mb-2">
                <ShieldAlert className="h-3.5 w-3.5" /> Emergency Escalation Desk
              </div>
              <h1 className="text-3xl font-extrabold text-ink">EV SOS & Roadside Dispatch Center</h1>
              <p className="mt-1 text-xs sm:text-sm text-mute">
                Live monitoring of stranded drivers, mobile emergency fast-charge vans, and towing escalations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-400">
                {incidents.filter((i) => i.status !== "RESOLVED").length} Active Incidents
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-line bg-navy-900/90 p-5 shadow-lg flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase text-mute font-semibold">Open Dispatch Requests</p>
                <p className="font-mono text-2xl font-bold text-ink">
                  {incidents.filter((i) => i.status === "OPEN_DISPATCH").length}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-navy-900/90 p-5 shadow-lg flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase text-mute font-semibold">Mobile Vans Active</p>
                <p className="font-mono text-2xl font-bold text-ink">6 Units</p>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-navy-900/90 p-5 shadow-lg flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase text-mute font-semibold">Average Response Time</p>
                <p className="font-mono text-2xl font-bold text-emerald-400">18 mins</p>
              </div>
            </div>
          </div>

          {/* Incidents Queue */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Clock className="h-4 w-4 text-electric" /> Incident Queue & Dispatch Actions
            </h2>

            <div className="space-y-4">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className={`rounded-2xl border p-5 shadow-xl transition-all ${
                    inc.status === "OPEN_DISPATCH"
                      ? "border-red-500/40 bg-red-950/20"
                      : inc.status === "RESCUE_EN_ROUTE"
                        ? "border-amber-500/40 bg-amber-950/20"
                        : "border-line bg-navy-900/70 opacity-70"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                            inc.status === "OPEN_DISPATCH"
                              ? "bg-red-500/20 text-red-300 border-red-500/40"
                              : inc.status === "RESCUE_EN_ROUTE"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          }`}
                        >
                          {inc.status.replace("_", " ")}
                        </span>
                        <span className="font-mono text-xs text-mute">{inc.id}</span>
                        <span className="text-xs text-mute">Reported {inc.timeReported}</span>
                      </div>

                      <div className="flex items-center gap-2 text-ink font-bold text-base">
                        {inc.vehicleClass === "2W" ? (
                          <Bike className="h-4 w-4 text-volt" />
                        ) : (
                          <Car className="h-4 w-4 text-electric" />
                        )}
                        <span>{inc.driverName}</span>
                        <span className="text-xs text-mute font-normal">({inc.vehicle})</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mute">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-mute" /> {inc.location}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-red-400 font-mono">
                          Remaining SoC: {inc.batterySoC}%
                        </span>
                        <span className="flex items-center gap-1 text-electric font-mono">
                          <PhoneCall className="h-3 w-3" /> {inc.phone}
                        </span>
                      </div>

                      {inc.assignedUnit && (
                        <p className="text-xs text-amber-400 font-medium flex items-center gap-1 pt-1">
                          <Truck className="h-3.5 w-3.5" /> Assigned: {inc.assignedUnit}
                        </p>
                      )}
                    </div>

                    {/* Dispatch controls */}
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      {inc.status === "OPEN_DISPATCH" && (
                        <button
                          type="button"
                          onClick={() => handleAssignVan(inc.id)}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-500 transition-colors cursor-pointer"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          Dispatch Mobile Boost Van
                        </button>
                      )}

                      {inc.status === "RESCUE_EN_ROUTE" && (
                        <button
                          type="button"
                          onClick={() => handleResolve(inc.id)}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark Resolved
                        </button>
                      )}

                      <a
                        href={`tel:${inc.phone}`}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-navy-950 px-3.5 py-2 text-xs font-semibold text-ink hover:border-electric transition-colors"
                      >
                        <PhoneCall className="h-3 w-3 text-volt" />
                        Call Driver
                      </a>
                    </div>
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
