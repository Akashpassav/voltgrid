"use client";

import React, { useEffect, useState } from "react";
import {
  Booking,
  getStoredBookings,
  updateBookingStatus,
} from "@/lib/store/bookings";
import { QrCodeSvg } from "@/components/ui/QrCodeSvg";
import { LiveChargingSessionModal } from "@/components/booking/LiveChargingSessionModal";
import {
  Calendar,
  Clock,
  BatteryCharging,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Play,
  XCircle,
  Leaf,
  Zap,
  Sparkles,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");
  const [activeSessionBooking, setActiveSessionBooking] = useState<Booking | null>(null);

  const loadBookings = () => {
    setBookings(getStoredBookings());
  };

  useEffect(() => {
    loadBookings();

    const handleUpdate = () => loadBookings();
    window.addEventListener("voltgrid_bookings_changed", handleUpdate);
    return () => window.removeEventListener("voltgrid_bookings_changed", handleUpdate);
  }, []);

  const handleCancel = (id: string) => {
    if (confirm("Are you sure you want to cancel this charging slot reservation?")) {
      updateBookingStatus(id, "cancelled");
      loadBookings();
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "active") return b.status === "confirmed" || b.status === "active_charging";
    if (filter === "completed") return b.status === "completed" || b.status === "cancelled";
    return true;
  });

  const totalKWh = bookings
    .filter((b) => b.status === "completed" || b.status === "active_charging")
    .reduce((acc, curr) => acc + curr.targetKWh, 0);

  const co2SavedKg = Math.round(totalKWh * 0.82);

  return (
    <div className="min-h-screen bg-navy-950 py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-volt/10 border border-volt/30 px-3 py-0.5 text-xs font-semibold text-volt mb-2">
              <Sparkles className="h-3 w-3" /> Slot Reservation Hub
            </div>
            <h1 className="text-3xl font-extrabold text-ink">My Charging Reservations</h1>
            <p className="mt-1 text-sm text-mute">
              Manage your confirmed EV charging slots, QR passes, and live charging sessions.
            </p>
          </div>

          <Link
            href="/stations"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-volt to-emerald-400 px-5 py-2.5 text-xs font-bold text-navy-950 shadow-lg shadow-volt/30 hover:brightness-110 transition-all self-start sm:self-auto"
          >
            <Zap className="h-3.5 w-3.5 fill-navy-950" />
            Find & Reserve New Slot
          </Link>
        </div>

        {/* Impact & Summary Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-navy-900/80 p-5 shadow-lg flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-volt/15 text-volt border border-volt/30">
              <BatteryCharging className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-mute">Total Energy Reserved</p>
              <p className="text-2xl font-extrabold text-ink font-mono">{totalKWh.toFixed(1)} kWh</p>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-navy-900/80 p-5 shadow-lg flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Leaf className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-mute">CO₂ Offset</p>
              <p className="text-2xl font-extrabold text-emerald-400 font-mono">~{co2SavedKg} kg</p>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-navy-900/80 p-5 shadow-lg flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric/15 text-electric border border-electric/30">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-medium text-mute">Booked Sessions</p>
              <p className="text-2xl font-extrabold text-ink font-mono">{bookings.length}</p>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 border-b border-line/60 pb-3">
          <button
            onClick={() => setFilter("active")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              filter === "active"
                ? "bg-navy-800 text-ink border border-line shadow-sm"
                : "text-mute hover:text-ink"
            }`}
          >
            Active & Upcoming ({bookings.filter((b) => b.status === "confirmed" || b.status === "active_charging").length})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              filter === "completed"
                ? "bg-navy-800 text-ink border border-line shadow-sm"
                : "text-mute hover:text-ink"
            }`}
          >
            Completed & History ({bookings.filter((b) => b.status === "completed" || b.status === "cancelled").length})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              filter === "all"
                ? "bg-navy-800 text-ink border border-line shadow-sm"
                : "text-mute hover:text-ink"
            }`}
          >
            All Bookings ({bookings.length})
          </button>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="rounded-2xl border border-line bg-navy-900/50 p-12 text-center">
            <Calendar className="mx-auto h-10 w-10 text-mute/50 mb-3" />
            <h3 className="text-lg font-bold text-ink">No reservations found</h3>
            <p className="mt-1 text-xs text-mute max-w-sm mx-auto">
              You do not have any {filter !== "all" ? filter : ""} charging reservations right now.
            </p>
            <Link
              href="/stations"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-volt px-5 py-2.5 text-xs font-bold text-navy-950 shadow-md hover:brightness-110"
            >
              Browse Charging Stations
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const isConfirmed = b.status === "confirmed";
              const isCharging = b.status === "active_charging";
              const isCompleted = b.status === "completed";
              const isCancelled = b.status === "cancelled";

              return (
                <div
                  key={b.id}
                  className="rounded-2xl border border-line bg-navy-900/90 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  {/* Left Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          isCharging
                            ? "bg-volt/15 text-volt border-volt/30 animate-pulse"
                            : isConfirmed
                              ? "bg-electric/15 text-electric border-electric/30"
                              : isCompleted
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-red-500/15 text-red-400 border-red-500/30"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isCharging
                              ? "bg-volt"
                              : isConfirmed
                                ? "bg-electric"
                                : isCompleted
                                  ? "bg-emerald-400"
                                  : "bg-red-400"
                          }`}
                        />
                        {b.status.replace("_", " ").toUpperCase()}
                      </span>
                      <span className="font-mono text-xs text-mute">{b.id}</span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-ink">{b.stationName}</h3>
                      <p className="text-xs text-mute">{b.address} · {b.city}</p>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-mute border-t border-line/40 pt-2.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-electric" /> {b.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-warn" /> {b.timeSlot}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-ink">
                        <Zap className="h-3.5 w-3.5 text-volt" /> {b.bayNumber} ({b.powerKW} kW)
                      </span>
                      <span className="text-mute">
                        Vehicle: <strong className="text-ink">{b.vehicleName}</strong>
                      </span>
                      <span className="text-emerald-400 font-semibold font-mono">
                        ₹{b.totalCost} ({b.targetKWh} kWh)
                      </span>
                    </div>
                  </div>

                  {/* Right Actions & QR Badge */}
                  <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-line/50 pt-4 md:pt-0 md:pl-6">
                    {/* Small QR thumbnail preview */}
                    <div className="hidden sm:block text-center">
                      <QrCodeSvg value={b.qrCodeText} size={70} />
                      <span className="mt-1 block text-[9px] text-mute font-mono">Scan at Gun</span>
                    </div>

                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      {(isConfirmed || isCharging) && (
                        <button
                          onClick={() => setActiveSessionBooking(b)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-volt to-emerald-400 px-4 py-2.5 text-xs font-bold text-navy-950 shadow-md shadow-volt/30 hover:brightness-110 transition-all"
                        >
                          <Play className="h-3.5 w-3.5 fill-navy-950" />
                          {isCharging ? "View Live Session HUD" : "Plug In & Start Charging"}
                        </button>
                      )}

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          b.stationName + " " + b.city,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-navy-950 px-4 py-2 text-xs font-medium text-ink hover:border-electric transition-colors"
                      >
                        <Navigation className="h-3 w-3 text-electric" />
                        Navigate
                      </a>

                      {isConfirmed && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="inline-flex items-center justify-center gap-1.5 text-xs text-mute hover:text-red-400 transition-colors pt-1"
                        >
                          <XCircle className="h-3 w-3" />
                          Cancel Reservation
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Charging Session Modal */}
      {activeSessionBooking && (
        <LiveChargingSessionModal
          booking={activeSessionBooking}
          isOpen={!!activeSessionBooking}
          onClose={() => {
            setActiveSessionBooking(null);
            loadBookings();
          }}
          onSessionComplete={() => {
            loadBookings();
          }}
        />
      )}
    </div>
  );
}
