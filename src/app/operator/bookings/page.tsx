"use client";

import React, { useEffect, useState } from "react";
import { PortalGuard } from "@/lib/auth/AuthContext";
import {
  Booking,
  getStoredBookings,
  updateBooking,
} from "@/lib/store/bookings";
import {
  Calendar,
  Clock,
  Car,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Search,
  Zap,
  Filter,
  Users,
  ShieldCheck,
} from "lucide-react";

export default function OperatorBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterStation, setFilterStation] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadBookings = () => {
    setBookings(getStoredBookings());
  };

  useEffect(() => {
    loadBookings();
    window.addEventListener("voltgrid_bookings_changed", loadBookings);
    return () => window.removeEventListener("voltgrid_bookings_changed", loadBookings);
  }, []);

  const handleVerifyCheckIn = (id: string) => {
    updateBooking(id, { status: "active_charging" });
    loadBookings();
  };

  const handleMarkCompleted = (id: string) => {
    updateBooking(id, { status: "completed" });
    loadBookings();
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterPayment !== "all" && b.paymentStatus !== filterPayment) return false;
    if (filterStation !== "all" && !b.stationName.toLowerCase().includes(filterStation.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        b.id.toLowerCase().includes(q) ||
        b.vehicleName.toLowerCase().includes(q) ||
        b.stationName.toLowerCase().includes(q) ||
        (b.razorpayPaymentId && b.razorpayPaymentId.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <PortalGuard allowedRole="operator">
      <div className="min-h-screen bg-navy-950 py-10 px-4">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-electric">
                Operator Portal · Fleet & Station Operations
              </span>
              <h1 className="text-3xl font-extrabold text-ink mt-0.5">Station Slot Reservations & Payments</h1>
              <p className="mt-1 text-xs sm:text-sm text-mute">
                Real-time bay occupancy schedule, Razorpay transaction verification, and arrival check-ins.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-line bg-navy-900 px-3.5 py-1.5 text-xs text-mute font-mono">
                Total Bookings: <strong className="text-ink">{bookings.length}</strong>
              </span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Booking ID, Vehicle, Payment ID…"
                className="w-full rounded-xl border border-line bg-navy-900 py-2.5 pl-9 pr-3.5 text-xs text-ink placeholder:text-mute/60 focus:border-electric focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="rounded-xl border border-line bg-navy-900 px-3 py-2 text-xs text-ink focus:border-electric focus:outline-none"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Razorpay Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="refunded">Refunded</option>
              </select>

              <select
                value={filterStation}
                onChange={(e) => setFilterStation(e.target.value)}
                className="rounded-xl border border-line bg-navy-900 px-3 py-2 text-xs text-ink focus:border-electric focus:outline-none"
              >
                <option value="all">All Managed Hubs</option>
                <option value="tambaram">Tambaram Hub</option>
                <option value="chennai">Chennai Central</option>
                <option value="indiranagar">Indiranagar</option>
              </select>
            </div>
          </div>

          {/* Bay / Time Slot Schedule Overview */}
          <div className="rounded-2xl border border-line bg-navy-900/80 p-5 shadow-xl">
            <h2 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-volt" /> Live Bay Schedule (Tambaram Fast DC Plaza)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
              {[
                { time: "10:00 - 10:45", bay: "Bay 1", status: "Occupied", user: "Tata Nexon EV Max" },
                { time: "11:00 - 11:45", bay: "Bay 2", status: "Completed", user: "MG ZS EV" },
                { time: "14:00 - 14:45", bay: "Bay 1", status: "Reserved", user: "Ather 450X" },
                { time: "15:00 - 15:45", bay: "Bay 2", status: "Reserved", user: "Nexon EV (Paid)" },
                { time: "16:00 - 16:45", bay: "Bay 1", status: "Available", user: "Open Slot" },
                { time: "17:00 - 17:45", bay: "Bay 2", status: "Available", user: "Open Slot" },
              ].map((slot, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-2.5 space-y-1 ${
                    slot.status === "Reserved" || slot.status === "Occupied"
                      ? "border-electric/40 bg-electric/10"
                      : slot.status === "Completed"
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-line bg-navy-950 text-mute"
                  }`}
                >
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="font-bold text-ink">{slot.time.split(" ")[0]}</span>
                    <span className="text-volt">{slot.bay}</span>
                  </div>
                  <p className="font-semibold text-ink text-[11px] truncate">{slot.user}</p>
                  <span className="block text-[9px] uppercase tracking-wider text-mute">{slot.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reservations Table */}
          <div className="rounded-2xl border border-line bg-navy-900/90 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-navy-950 text-[10px] uppercase tracking-wider text-mute border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">Station & Bay</th>
                    <th className="py-3 px-4">Vehicle Model</th>
                    <th className="py-3 px-4">Slot Time</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Razorpay Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40 text-ink">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-navy-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-volt">
                        {b.id}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold truncate max-w-[160px]">{b.stationName}</p>
                        <p className="text-[10px] text-mute">{b.bayNumber}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{b.vehicleName}</span>
                        <p className="text-[10px] text-mute font-mono">{b.targetKWh} kWh</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-mute">
                        <span className="text-ink font-semibold">{b.date}</span>
                        <p className="text-[10px]">{b.timeSlot}</p>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        ₹{b.totalCost}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${
                            b.paymentStatus === "paid"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : b.paymentStatus === "refunded"
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                : "bg-red-500/15 text-red-400 border-red-500/30"
                          }`}
                        >
                          <CreditCard className="h-2.5 w-2.5" />
                          {b.paymentStatus || "PAID"}
                        </span>
                        {b.razorpayPaymentId && (
                          <p className="text-[9px] text-mute font-mono truncate max-w-[120px] mt-0.5">
                            {b.razorpayPaymentId}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded-md bg-navy-950 px-2 py-1 text-[10px] font-mono text-ink border border-line uppercase">
                          {b.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {b.status === "confirmed" && (
                          <button
                            type="button"
                            onClick={() => handleVerifyCheckIn(b.id)}
                            className="rounded-lg bg-electric px-3 py-1 text-[11px] font-bold text-white hover:bg-blue-600 transition-colors cursor-pointer"
                          >
                            Check In
                          </button>
                        )}
                        {b.status === "active_charging" && (
                          <button
                            type="button"
                            onClick={() => handleMarkCompleted(b.id)}
                            className="rounded-lg bg-volt px-3 py-1 text-[11px] font-bold text-navy-950 hover:brightness-110 transition-all cursor-pointer"
                          >
                            Complete
                          </button>
                        )}
                        {b.status === "completed" && (
                          <span className="text-[10px] text-mute font-mono">Released</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PortalGuard>
  );
}
