"use client";

import React, { useState } from "react";
import { LiveStation } from "@/lib/types";
import {
  Booking,
  generateBookingId,
  saveBooking,
} from "@/lib/store/bookings";
import { QrCodeSvg } from "@/components/ui/QrCodeSvg";
import {
  X,
  Calendar,
  Clock,
  Car,
  Bike,
  Zap,
  CheckCircle2,
  Navigation,
  ShieldCheck,
  CreditCard,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface SlotBookingModalProps {
  station: LiveStation;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess?: (booking: Booking) => void;
}

const VEHICLE_PRESETS = [
  { id: "tata-nexon-ev", name: "Tata Nexon EV Long Range", class: "4W", batteryKWh: 40.5, connector: "CCS2" },
  { id: "mg-zs-ev", name: "MG ZS EV", class: "4W", batteryKWh: 50.3, connector: "CCS2" },
  { id: "tata-punch-ev", name: "Tata Punch EV Long Range", class: "4W", batteryKWh: 35.0, connector: "CCS2" },
  { id: "mahindra-xuv400", name: "Mahindra XUV400 EL", class: "4W", batteryKWh: 39.4, connector: "CCS2" },
  { id: "byd-atto-3", name: "BYD Atto 3", class: "4W", batteryKWh: 60.5, connector: "CCS2" },
  { id: "ather-450x", name: "Ather 450X Gen 3", class: "2W", batteryKWh: 3.7, connector: "15A Socket" },
  { id: "ola-s1-pro", name: "Ola S1 Pro Gen 2", class: "2W", batteryKWh: 4.0, connector: "15A Socket" },
  { id: "tvs-iqube", name: "TVS iQube ST", class: "2W", batteryKWh: 4.56, connector: "15A Socket" },
  { id: "bajaj-chetak", name: "Bajaj Chetak Premium", class: "2W", batteryKWh: 3.2, connector: "15A Socket" },
];

const TIME_SLOTS = [
  { time: "09:00 - 09:45", status: "available" },
  { time: "10:00 - 10:45", status: "available" },
  { time: "11:00 - 11:45", status: "busy" },
  { time: "12:00 - 12:45", status: "available" },
  { time: "13:00 - 13:45", status: "available" },
  { time: "14:00 - 14:45", status: "available" },
  { time: "15:00 - 15:45", status: "available" },
  { time: "16:00 - 16:45", status: "busy" },
  { time: "17:00 - 17:45", status: "busy" },
  { time: "18:00 - 18:45", status: "available" },
  { time: "19:00 - 19:45", status: "available" },
  { time: "20:00 - 20:45", status: "available" },
];

export function SlotBookingModal({
  station,
  isOpen,
  onClose,
  onBookingSuccess,
}: SlotBookingModalProps) {
  const [vehicleClass, setVehicleClass] = useState<"2W" | "4W">("4W");
  const filteredVehicles = VEHICLE_PRESETS.filter((v) => v.class === vehicleClass);
  const [selectedVehicle, setSelectedVehicle] = useState(filteredVehicles[0]);

  const [dateOption, setDateOption] = useState<"today" | "tomorrow">("today");
  const [selectedSlot, setSelectedSlot] = useState("14:00 - 14:45");
  const [selectedBay, setSelectedBay] = useState("Bay 1 (Fast DC Gun A)");
  const [targetKWh, setTargetKWh] = useState(25);

  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  if (!isOpen) return null;

  const pricePerKWh = station.pricePerKWh || 16;
  const energyCost = targetKWh * pricePerKWh;
  const reservationFee = 0; // Promotional waiver
  const gst = energyCost * 0.05;
  const totalAmount = energyCost + reservationFee + gst;

  const handleClassChange = (c: "2W" | "4W") => {
    setVehicleClass(c);
    const first = VEHICLE_PRESETS.find((v) => v.class === c);
    if (first) {
      setSelectedVehicle(first);
      setTargetKWh(c === "2W" ? 3.0 : 25);
    }
  };

  const handleConfirm = () => {
    const today = new Date();
    const targetDate =
      dateOption === "today"
        ? today.toISOString().split("T")[0]
        : new Date(today.getTime() + 86400000).toISOString().split("T")[0];

    const bookingId = generateBookingId();
    const newBooking: Booking = {
      id: bookingId,
      stationId: station.id,
      stationName: station.name,
      operator: station.operator,
      address: station.address,
      city: station.city,
      date: targetDate,
      timeSlot: selectedSlot,
      bayNumber: selectedBay,
      connectorType: station.connectorType,
      powerKW: station.powerKW,
      vehicleId: selectedVehicle.id,
      vehicleName: selectedVehicle.name,
      targetKWh,
      durationMinutes: 45,
      pricePerKWh,
      totalCost: Math.round(totalAmount * 10) / 10,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      qrCodeText: `VOLTGRID-PASS-${bookingId}-${station.id}`,
      paymentStatus: "paid",
      razorpayPaymentId: `pay_rzp_${bookingId}`,
    };

    saveBooking(newBooking);
    setConfirmedBooking(newBooking);
    if (onBookingSuccess) onBookingSuccess(newBooking);
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-line bg-navy-900 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line/60 p-5 bg-navy-950/60">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-volt">
              EV Charging Reservation
            </span>
            <h2 className="text-xl font-bold text-ink">{station.name}</h2>
            <p className="text-xs text-mute">
              {station.operator} · {station.powerKW} kW {station.connectorType} · {station.address}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-mute hover:bg-navy-800 hover:text-ink transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {confirmedBooking ? (
          /* Confirmation & QR Pass View */
          <div className="p-6 text-center animate-fade-up">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-volt/15 text-volt border border-volt/30 mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-ink">Slot Reserved Successfully!</h3>
            <p className="text-xs text-mute mt-1">
              Your charging bay is guaranteed. Show this digital pass at the station or scan directly at the charger.
            </p>

            {/* QR Pass Box */}
            <div className="mt-5 mx-auto max-w-xs rounded-2xl border border-volt/30 bg-navy-950 p-5 shadow-xl">
              <div className="flex justify-center mb-3">
                <QrCodeSvg value={confirmedBooking.qrCodeText} size={150} />
              </div>
              <p className="text-[10px] text-mute uppercase tracking-widest font-mono">Pass Code</p>
              <p className="text-base font-bold text-volt font-mono">{confirmedBooking.id}</p>
              <div className="mt-3 border-t border-line/50 pt-2 text-xs text-mute flex justify-between">
                <span>{confirmedBooking.date}</span>
                <span className="font-semibold text-ink">{confirmedBooking.timeSlot}</span>
              </div>
              <div className="mt-1 text-xs text-mute flex justify-between">
                <span>Bay: {confirmedBooking.bayNumber}</span>
                <span className="text-emerald-400 font-medium">₹{confirmedBooking.totalCost}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-electric py-3 font-semibold text-white shadow-lg shadow-electric/30 hover:bg-blue-600 transition-colors"
              >
                <Navigation className="h-4 w-4" />
                Navigate to Station
              </a>
              <Link
                href="/bookings"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-navy-800 py-3 font-semibold text-ink hover:bg-navy-700 transition-colors"
                onClick={onClose}
              >
                View in My Bookings
              </Link>
            </div>
          </div>
        ) : (
          /* Multi-step Booking Form */
          <div className="p-6 space-y-5">
            {/* Step 1: Vehicle Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-mute flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5 text-electric" /> Select Your EV Model
                </label>
                <div className="inline-flex rounded-lg border border-line bg-navy-950 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleClassChange("2W")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${
                      vehicleClass === "2W" ? "bg-volt text-navy-950 font-bold" : "text-mute hover:text-ink"
                    }`}
                  >
                    <Bike className="h-3 w-3" /> 2-Wheeler
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClassChange("4W")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${
                      vehicleClass === "4W" ? "bg-electric text-white font-bold" : "text-mute hover:text-ink"
                    }`}
                  >
                    <Car className="h-3 w-3" /> 4-Wheeler
                  </button>
                </div>
              </div>

              <select
                value={selectedVehicle.id}
                onChange={(e) => {
                  const found = VEHICLE_PRESETS.find((v) => v.id === e.target.value);
                  if (found) setSelectedVehicle(found);
                }}
                className="w-full rounded-xl border border-line bg-navy-950 px-3.5 py-2.5 text-sm text-ink focus:border-electric focus:outline-none"
              >
                {filteredVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.batteryKWh} kWh · {v.connector})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Bay / Gun Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-mute mb-2 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-volt" /> Available Charging Bay & Gun
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedBay("Bay 1 (Fast DC Gun A)")}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    selectedBay === "Bay 1 (Fast DC Gun A)"
                      ? "border-volt bg-volt/10 shadow-sm"
                      : "border-line bg-navy-950/70 hover:border-line-strong"
                  }`}
                >
                  <span className="block text-xs font-semibold text-ink">Bay 1 (Gun A)</span>
                  <span className="block text-[11px] text-mute">{station.powerKW} kW · {station.connectorType}</span>
                  <span className="mt-1 inline-block text-[10px] text-emerald-400 font-medium">Ready Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBay("Bay 2 (Fast DC Gun B)")}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    selectedBay === "Bay 2 (Fast DC Gun B)"
                      ? "border-volt bg-volt/10 shadow-sm"
                      : "border-line bg-navy-950/70 hover:border-line-strong"
                  }`}
                >
                  <span className="block text-xs font-semibold text-ink">Bay 2 (Gun B)</span>
                  <span className="block text-[11px] text-mute">{station.powerKW} kW · {station.connectorType}</span>
                  <span className="mt-1 inline-block text-[10px] text-emerald-400 font-medium">Ready Now</span>
                </button>
              </div>
            </div>

            {/* Step 3: Date & Time Slot */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-mute flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-warn" /> Select Reservation Slot
                </label>
                <div className="flex gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setDateOption("today")}
                    className={`px-2.5 py-0.5 rounded-full transition-colors ${
                      dateOption === "today" ? "bg-navy-800 text-ink font-semibold border border-line" : "text-mute"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateOption("tomorrow")}
                    className={`px-2.5 py-0.5 rounded-full transition-colors ${
                      dateOption === "tomorrow" ? "bg-navy-800 text-ink font-semibold border border-line" : "text-mute"
                    }`}
                  >
                    Tomorrow
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                {TIME_SLOTS.map((s) => {
                  const isBusy = s.status === "busy";
                  const isSelected = selectedSlot === s.time;
                  return (
                    <button
                      key={s.time}
                      type="button"
                      disabled={isBusy}
                      onClick={() => setSelectedSlot(s.time)}
                      className={`rounded-lg px-2 py-2 text-xs font-medium transition-all ${
                        isBusy
                          ? "bg-navy-950/50 text-mute/50 border border-line/30 cursor-not-allowed line-through"
                          : isSelected
                            ? "bg-gradient-to-r from-volt to-emerald-400 text-navy-950 font-bold shadow"
                            : "bg-navy-950 text-ink border border-line hover:border-electric/50"
                      }`}
                    >
                      {s.time.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Target Energy Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-mute uppercase tracking-wider">Charging Target</span>
                <span className="font-bold text-volt font-mono">{targetKWh} kWh (~{Math.round((targetKWh / selectedVehicle.batteryKWh) * 100)}% pack)</span>
              </div>
              <input
                type="range"
                min={vehicleClass === "2W" ? 1 : 5}
                max={Math.min(60, selectedVehicle.batteryKWh)}
                step={vehicleClass === "2W" ? 0.5 : 2}
                value={targetKWh}
                onChange={(e) => setTargetKWh(parseFloat(e.target.value))}
                className="w-full accent-volt cursor-pointer"
              />
            </div>

            {/* Step 5: Pricing Breakdown */}
            <div className="rounded-xl border border-line/60 bg-navy-950 p-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-mute">
                <span>Energy tariff ({targetKWh} kWh @ ₹{pricePerKWh}/kWh)</span>
                <span className="text-ink font-mono font-medium">₹{energyCost.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-mute">
                <span>Slot reservation fee</span>
                <span className="text-volt font-medium">FREE (Promo waiver)</span>
              </div>
              <div className="flex justify-between text-mute">
                <span>Applicable GST (5%)</span>
                <span className="text-ink font-mono">₹{gst.toFixed(1)}</span>
              </div>
              <div className="border-t border-line/60 pt-2 flex justify-between text-sm font-bold text-ink">
                <span>Total Estimated</span>
                <span className="font-mono text-emerald-400">₹{totalAmount.toFixed(1)}</span>
              </div>
            </div>

            {/* Guarantee note */}
            <div className="flex items-center gap-2 text-[11px] text-mute">
              <ShieldCheck className="h-4 w-4 text-volt shrink-0" />
              <span>Guaranteed bay reservation. 15-minute grace period held from slot start.</span>
            </div>

            {/* Confirm CTA */}
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-volt to-emerald-400 py-3.5 font-bold text-navy-950 shadow-lg shadow-volt/40 hover:brightness-110 transition-all text-sm"
            >
              <Sparkles className="h-4 w-4" />
              Confirm & Generate QR Booking Pass
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
