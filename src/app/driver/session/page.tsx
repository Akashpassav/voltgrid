"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortalGuard } from "@/lib/auth/AuthContext";
import {
  Booking,
  getStoredBookings,
  updateBooking,
} from "@/lib/store/bookings";
import {
  BatteryCharging,
  Zap,
  Activity,
  Clock,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  ArrowLeft,
  Receipt,
  Download,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

function DriverSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  const [chargingState, setChargingState] = useState<"idle" | "charging" | "finished">("charging");
  const [soc, setSoc] = useState(32);
  const [powerKW, setPowerKW] = useState(54);
  const [kwhDelivered, setKwhDelivered] = useState(1.4);
  const [elapsedSeconds, setElapsedSeconds] = useState(115);
  const [sessionCost, setSessionCost] = useState(22.4);

  // Settlement receipt state
  const [settlementDiff, setSettlementDiff] = useState(0);

  useEffect(() => {
    const list = getStoredBookings();
    setBookings(list);

    let found: Booking | undefined;
    if (bookingId) {
      found = list.find((b) => b.id === bookingId);
    }
    if (!found) {
      found = list.find((b) => b.status === "active_charging" || b.status === "confirmed") || list[0];
    }

    if (found) {
      setActiveBooking(found);
      setPowerKW(found.powerKW || 50);
      if (found.status === "completed") {
        setChargingState("finished");
        setSoc(85);
        setKwhDelivered(found.finalKWhDelivered || found.targetKWh);
        setSessionCost(found.totalCost);
      }
    }
  }, [bookingId]);

  // Live telemetry timer
  useEffect(() => {
    if (chargingState !== "charging" || !activeBooking) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      // Increment kWh
      setKwhDelivered((prev) => {
        const next = prev + (powerKW / 3600);
        return parseFloat(next.toFixed(2));
      });

      // Increment SoC %
      setSoc((prev) => {
        if (prev >= 85) {
          handleStop();
          return 85;
        }
        return prev + 1;
      });

      // Fluctuate power slightly for realism
      setPowerKW((prev) => {
        const delta = (Math.random() - 0.49) * 0.9;
        return parseFloat(Math.max(15, Math.min(activeBooking.powerKW || 60, prev + delta)).toFixed(1));
      });

      // Live cost
      setSessionCost((prev) => {
        const rate = activeBooking.pricePerKWh || 16;
        const next = prev + ((powerKW / 3600) * rate);
        return parseFloat(next.toFixed(2));
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [chargingState, powerKW, activeBooking]);

  const handleStart = () => {
    if (!activeBooking) return;
    setChargingState("charging");
    updateBooking(activeBooking.id, { status: "active_charging" });
  };

  const handleStop = () => {
    if (!activeBooking) return;
    setChargingState("finished");

    // Calculate Razorpay settlement difference
    // Pre-paid amount vs actual session cost
    const prepaidAmount = activeBooking.totalCost || 0;
    const actualCost = sessionCost;
    const diff = Math.round((actualCost - prepaidAmount) * 10) / 10;
    setSettlementDiff(diff);

    updateBooking(activeBooking.id, {
      status: "completed",
      finalKWhDelivered: kwhDelivered,
      settlementAdjustment: diff,
    });
  };

  if (!activeBooking) {
    return (
      <PortalGuard allowedRole="driver">
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
          <Zap className="h-8 w-8 text-mute mb-2" />
          <h2 className="text-base font-bold text-ink">No active charging session found</h2>
          <p className="text-xs text-mute mt-1">Reserve a charging slot first to start charging.</p>
          <Link
            href="/driver/find"
            className="mt-4 rounded-xl bg-volt px-4 py-2 text-xs font-bold text-navy-950"
          >
            Find Stations & Book
          </Link>
        </div>
      </PortalGuard>
    );
  }

  const voltage = 385 + Math.round((soc / 100) * 30);
  const amperage = Math.round((powerKW * 1000) / voltage);

  return (
    <PortalGuard allowedRole="driver">
      <div className="min-h-screen bg-navy-950 py-10 px-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/driver/bookings"
              className="inline-flex items-center gap-1.5 text-xs text-mute hover:text-ink transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to My Bookings
            </Link>

            <span className="rounded-full bg-navy-900 border border-line px-3 py-1 text-xs text-mute">
              Session ID: <strong className="text-volt font-mono">{activeBooking.id}</strong>
            </span>
          </div>

          {/* Main Telemetry HUD */}
          <div className="relative rounded-3xl border border-electric/30 bg-navy-900/90 p-6 sm:p-10 shadow-2xl overflow-hidden">
            <div className="aurora-blob -top-20 -left-20 h-64 w-64 bg-volt/15" />
            <div className="aurora-blob -bottom-20 -right-20 h-64 w-64 bg-electric/15" />

            {/* Station & Bay Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line/60 pb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-volt">
                  Live Dispenser Telemetry · {activeBooking.bayNumber}
                </span>
                <h1 className="text-2xl font-extrabold text-ink mt-0.5">{activeBooking.stationName}</h1>
                <p className="text-xs text-mute">{activeBooking.operator} · {activeBooking.address}</p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                    chargingState === "charging"
                      ? "bg-volt/15 text-volt border-volt/30 animate-pulse"
                      : chargingState === "finished"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-navy-950 text-mute border-line"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      chargingState === "charging"
                        ? "bg-volt animate-ping"
                        : chargingState === "finished"
                          ? "bg-emerald-400"
                          : "bg-mute"
                    }`}
                  />
                  {chargingState === "charging"
                    ? "DISPENSING ENERGY"
                    : chargingState === "finished"
                      ? "SESSION COMPLETED"
                      : "CONNECTOR READY"}
                </span>
              </div>
            </div>

            {/* Circular Gauge */}
            <div className="my-8 flex flex-col items-center">
              <div className="relative flex h-56 w-56 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="7"
                    className="text-navy-950"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="7"
                    className={
                      chargingState === "charging"
                        ? "text-volt transition-all duration-500"
                        : "text-electric"
                    }
                    strokeDasharray="264"
                    strokeDashoffset={264 - (264 * soc) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute flex flex-col items-center text-center">
                  <BatteryCharging
                    className={`h-7 w-7 mb-1 ${
                      chargingState === "charging" ? "text-volt animate-bounce" : "text-electric"
                    }`}
                  />
                  <span className="text-5xl font-extrabold text-ink font-mono tracking-tight">
                    {soc}%
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-mute mt-1">
                    State of Charge
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs text-mute">
                Connected Vehicle: <strong className="text-ink">{activeBooking.vehicleName}</strong> (
                {activeBooking.connectorType})
              </p>
            </div>

            {/* Telemetry Numbers Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
              <div className="rounded-2xl border border-line bg-navy-950/80 p-4 text-center">
                <span className="text-[10px] uppercase text-mute font-semibold flex items-center justify-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-electric" /> Power Rate
                </span>
                <p className="mt-1 font-mono text-xl font-extrabold text-ink">{powerKW} kW</p>
                <span className="text-[10px] text-mute">{voltage}V · {amperage}A DC</span>
              </div>

              <div className="rounded-2xl border border-line bg-navy-950/80 p-4 text-center">
                <span className="text-[10px] uppercase text-mute font-semibold flex items-center justify-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-volt" /> Energy Dispensed
                </span>
                <p className="mt-1 font-mono text-xl font-extrabold text-volt">{kwhDelivered} kWh</p>
                <span className="text-[10px] text-mute">Target: {activeBooking.targetKWh} kWh</span>
              </div>

              <div className="rounded-2xl border border-line bg-navy-950/80 p-4 text-center">
                <span className="text-[10px] uppercase text-mute font-semibold flex items-center justify-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-warn" /> Session Duration
                </span>
                <p className="mt-1 font-mono text-xl font-extrabold text-ink">
                  {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
                </p>
                <span className="text-[10px] text-mute">Est. 12m to target</span>
              </div>

              <div className="rounded-2xl border border-line bg-navy-950/80 p-4 text-center">
                <span className="text-[10px] uppercase text-mute font-semibold flex items-center justify-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-400" /> Metered Cost
                </span>
                <p className="mt-1 font-mono text-xl font-extrabold text-emerald-400">₹{sessionCost.toFixed(1)}</p>
                <span className="text-[10px] text-mute">₹{activeBooking.pricePerKWh}/kWh</span>
              </div>
            </div>

            {/* Smart BMS Safeguard Note */}
            <div className="flex items-center justify-between rounded-xl border border-line/60 bg-navy-950 px-4 py-2.5 text-xs text-mute mb-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-volt" />
                <span>BMS Thermal Safeguard: Active liquid cooling protocol (pack at 33.4°C)</span>
              </div>
              <span className="font-mono text-ink font-semibold">99.8% Efficiency</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-2 border-t border-line/60">
              {chargingState === "idle" && (
                <button
                  type="button"
                  onClick={handleStart}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-volt to-emerald-400 py-3.5 text-sm font-bold text-navy-950 shadow-lg shadow-volt/40 hover:brightness-110 transition-all cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-navy-950" />
                  Plug In Gun & Start Charging
                </button>
              )}

              {chargingState === "charging" && (
                <button
                  type="button"
                  onClick={handleStop}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-danger py-3.5 text-sm font-bold text-white shadow-lg shadow-danger/40 hover:bg-red-600 transition-all cursor-pointer"
                >
                  <Square className="h-4 w-4 fill-white" />
                  Stop Charging & Settle Session
                </button>
              )}

              {chargingState === "finished" && (
                <div className="w-full flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex-1 text-center sm:text-left text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Charging Completed! Unplug connector and replace in cradle.
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/driver/bookings")}
                    className="rounded-xl bg-navy-800 border border-line px-5 py-2.5 text-xs font-bold text-ink hover:bg-navy-700 transition-colors"
                  >
                    View in Bookings
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section 7 Automated Razorpay Invoice & Settlement Receipt */}
          {chargingState === "finished" && (
            <div className="rounded-3xl border border-line bg-navy-900/90 p-6 sm:p-8 shadow-2xl space-y-5 animate-fade-up">
              <div className="flex items-center justify-between border-b border-line/60 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-volt" />
                  <h2 className="text-base font-bold text-ink">Automated Tax Invoice & Razorpay Settlement</h2>
                </div>
                <span className="font-mono text-xs text-mute">{activeBooking.invoiceNumber || "INV-2026-001"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl border border-line/50 bg-navy-950 p-4 space-y-2">
                  <span className="text-[10px] text-mute uppercase font-semibold">Pre-Paid Booking Details</span>
                  <div className="flex justify-between">
                    <span className="text-mute">Pre-Paid Tariff Amount:</span>
                    <strong className="text-ink">₹{activeBooking.totalCost}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mute">Razorpay Payment ID:</span>
                    <span className="font-mono text-electric">{activeBooking.razorpayPaymentId || "pay_test_verified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mute">Gateway Payment Status:</span>
                    <span className="font-bold text-emerald-400 uppercase">{activeBooking.paymentStatus}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-line/50 bg-navy-950 p-4 space-y-2">
                  <span className="text-[10px] text-mute uppercase font-semibold">Actual Metered Settlement</span>
                  <div className="flex justify-between">
                    <span className="text-mute">Total Energy Dispensed:</span>
                    <strong className="text-volt font-mono">{kwhDelivered} kWh</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mute">Metered Tariff Cost:</span>
                    <strong className="text-emerald-400 font-mono">₹{sessionCost.toFixed(1)}</strong>
                  </div>
                  <div className="flex justify-between border-t border-line/40 pt-1.5">
                    <span className="text-mute">Settlement Balance:</span>
                    <span className="font-mono font-bold text-ink">
                      {settlementDiff > 0 ? `+₹${settlementDiff} (Debited)` : settlementDiff < 0 ? `-₹${Math.abs(settlementDiff)} (Refunded to source)` : "₹0.00 (Exact Match)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PortalGuard>
  );
}

export default function DriverSessionPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-xs text-mute">Loading session…</div>}>
      <DriverSessionContent />
    </Suspense>
  );
}
