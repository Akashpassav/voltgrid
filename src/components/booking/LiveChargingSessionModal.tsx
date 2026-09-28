"use client";

import React, { useEffect, useState } from "react";
import { Booking, updateBookingStatus } from "@/lib/store/bookings";
import {
  Zap,
  BatteryCharging,
  Clock,
  IndianRupee,
  Activity,
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  ShieldCheck,
} from "lucide-react";

interface LiveChargingSessionModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSessionComplete?: () => void;
}

export function LiveChargingSessionModal({
  booking,
  isOpen,
  onClose,
  onSessionComplete,
}: LiveChargingSessionModalProps) {
  const [chargingState, setChargingState] = useState<"idle" | "charging" | "finished">(
    booking.status === "active_charging" ? "charging" : "idle",
  );
  const [soc, setSoc] = useState(24);
  const [powerKW, setPowerKW] = useState(booking.powerKW || 50);
  const [kwhDelivered, setKwhDelivered] = useState(0.8);
  const [elapsedSeconds, setElapsedSeconds] = useState(72);
  const [cost, setCost] = useState(12.8);

  useEffect(() => {
    if (!isOpen) return;
    if (chargingState !== "charging") return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      // increment delivered energy
      setKwhDelivered((prev) => {
        const next = prev + (powerKW / 3600);
        return parseFloat(next.toFixed(2));
      });

      // increment SoC
      setSoc((prev) => {
        if (prev >= 85) {
          setChargingState("finished");
          updateBookingStatus(booking.id, "completed");
          if (onSessionComplete) onSessionComplete();
          return 85;
        }
        return prev + 1;
      });

      // fluctuate power slightly for realistic telemetry
      setPowerKW((prev) => {
        const delta = (Math.random() - 0.48) * 0.8;
        return parseFloat(Math.max(10, Math.min(booking.powerKW, prev + delta)).toFixed(1));
      });

      // update live cost
      setCost((prev) => {
        const next = prev + ((powerKW / 3600) * booking.pricePerKWh);
        return parseFloat(next.toFixed(2));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, chargingState, powerKW, booking, onSessionComplete]);

  if (!isOpen) return null;

  const handleStart = () => {
    setChargingState("charging");
    updateBookingStatus(booking.id, "active_charging");
  };

  const handleStop = () => {
    setChargingState("finished");
    updateBookingStatus(booking.id, "completed");
    if (onSessionComplete) onSessionComplete();
  };

  const voltage = 385 + Math.round((soc / 100) * 25);
  const current = (powerKW * 1000) / voltage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-electric/30 bg-navy-900 shadow-2xl p-6 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-electric/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-volt/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-line/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-electric/15 text-electric border border-electric/30">
              <BatteryCharging className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                Live Charging Session
                {chargingState === "charging" && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-volt bg-volt/10 border border-volt/30 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-volt animate-ping" />
                    LIVE FLOW
                  </span>
                )}
              </h2>
              <p className="text-xs text-mute">{booking.stationName} · {booking.bayNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-mute hover:bg-navy-800 hover:text-ink transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Central HUD Gauge */}
        <div className="my-6 flex flex-col items-center">
          <div className="relative flex h-48 w-48 items-center justify-center">
            {/* Circular SVG Meter */}
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
                className="text-navy-800"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
                className={chargingState === "charging" ? "text-volt transition-all duration-500" : "text-electric"}
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * soc) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner HUD Data */}
            <div className="absolute flex flex-col items-center text-center">
              <Zap className={`h-6 w-6 mb-1 ${chargingState === "charging" ? "text-volt animate-bounce" : "text-mute"}`} />
              <span className="text-4xl font-extrabold text-ink font-mono">{soc}%</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-mute">
                Battery SoC
              </span>
            </div>
          </div>

          <p className="mt-2 text-xs text-mute">
            Vehicle: <strong className="text-ink">{booking.vehicleName}</strong> ({booking.connectorType})
          </p>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 mb-6">
          <div className="rounded-xl border border-line bg-navy-950/70 p-2.5 text-center">
            <span className="text-[10px] uppercase text-mute font-medium flex items-center justify-center gap-1">
              <Activity className="h-3 w-3 text-electric" /> Power
            </span>
            <p className="mt-1 font-mono text-base font-bold text-ink">{powerKW} kW</p>
            <span className="text-[9px] text-mute">{voltage}V · {current.toFixed(0)}A</span>
          </div>

          <div className="rounded-xl border border-line bg-navy-950/70 p-2.5 text-center">
            <span className="text-[10px] uppercase text-mute font-medium flex items-center justify-center gap-1">
              <Zap className="h-3 w-3 text-volt" /> Energy
            </span>
            <p className="mt-1 font-mono text-base font-bold text-volt">{kwhDelivered} kWh</p>
            <span className="text-[9px] text-mute">Target: {booking.targetKWh} kWh</span>
          </div>

          <div className="rounded-xl border border-line bg-navy-950/70 p-2.5 text-center">
            <span className="text-[10px] uppercase text-mute font-medium flex items-center justify-center gap-1">
              <Clock className="h-3 w-3 text-warn" /> Elapsed
            </span>
            <p className="mt-1 font-mono text-base font-bold text-ink">
              {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
            </p>
            <span className="text-[9px] text-mute">Est. 18m to 80%</span>
          </div>

          <div className="rounded-xl border border-line bg-navy-950/70 p-2.5 text-center">
            <span className="text-[10px] uppercase text-mute font-medium flex items-center justify-center gap-1">
              <IndianRupee className="h-3 w-3 text-emerald-400" /> Cost
            </span>
            <p className="mt-1 font-mono text-base font-bold text-emerald-400">₹{cost.toFixed(1)}</p>
            <span className="text-[9px] text-mute">₹{booking.pricePerKWh}/kWh</span>
          </div>
        </div>

        {/* Protection / Status Pill */}
        <div className="flex items-center justify-between rounded-lg border border-line/60 bg-navy-950 px-3.5 py-2 text-xs text-mute mb-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-volt" />
            <span>Smart BMS Protocol: Active thermal balancing & surge protection</span>
          </div>
          <span className="font-mono text-[11px] text-ink">34.2°C</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-line/60">
          {chargingState === "idle" && (
            <button
              onClick={handleStart}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-volt to-emerald-400 py-3 font-semibold text-navy-950 shadow-lg shadow-volt/40 hover:brightness-110 transition-all"
            >
              <Play className="h-4 w-4 fill-navy-950" />
              Plug In & Start Charging
            </button>
          )}

          {chargingState === "charging" && (
            <button
              onClick={handleStop}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-danger py-3 font-semibold text-white shadow-lg shadow-danger/40 hover:bg-red-600 transition-all"
            >
              <Square className="h-4 w-4 fill-white" />
              Stop & Disconnect Charging
            </button>
          )}

          {chargingState === "finished" && (
            <div className="w-full flex flex-col gap-2">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-volt">
                <CheckCircle2 className="h-5 w-5" />
                Session Complete! Unplug connector.
              </div>
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-navy-800 py-2.5 font-semibold text-ink border border-line hover:bg-navy-700 transition-colors"
              >
                Close & View Receipt
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
