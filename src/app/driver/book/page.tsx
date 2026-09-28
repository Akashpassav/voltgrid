"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortalGuard, useAuth } from "@/lib/auth/AuthContext";
import { apiGet, apiPost } from "@/lib/client/api";
import { Booking, generateBookingId, saveBooking } from "@/lib/store/bookings";
import { openRazorpayCheckout } from "@/lib/client/razorpay";
import { QrCodeSvg } from "@/components/ui/QrCodeSvg";
import { INDIAN_VEHICLE_PRESETS, VehiclePresetItem } from "@/lib/data/vehicle-presets";
import type { LiveStation } from "@/lib/types";
import {
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
  ArrowLeft,
  Lock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

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

function DriverBookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stationId = searchParams.get("stationId") || "VG-014";

  const { session } = useAuth();

  const [station, setStation] = useState<LiveStation | null>(null);
  const [loadingStation, setLoadingStation] = useState(true);

  // Pre-select vehicle from user's stored profile if available, else default to preset
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePresetItem>(() => {
    if (session?.defaultVehicle) {
      const match = INDIAN_VEHICLE_PRESETS.find((v) => v.id === session.defaultVehicle?.id);
      if (match) return match;
    }
    return INDIAN_VEHICLE_PRESETS[0];
  });

  const [dateOption, setDateOption] = useState<"today" | "tomorrow">("today");
  const [selectedSlot, setSelectedSlot] = useState("14:00 - 14:45");
  const [selectedBay, setSelectedBay] = useState("Bay 1 (DC Fast Gun A)");
  const [targetKWh, setTargetKWh] = useState(25);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Fetch station details
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const json = await apiGet<{ station: LiveStation }>(`/api/stations/${stationId}`);
        if (!cancelled && json.station) {
          setStation(json.station);
          setLoadingStation(false);
        }
      } catch {
        // Fallback demo station if not found
        if (!cancelled) {
          setStation({
            id: stationId,
            name: "Tambaram GST Energy Plaza",
            latitude: 12.9249,
            longitude: 80.104,
            operator: "VoltGrid CPO Network",
            connectorType: "CCS2",
            powerKW: 60,
            totalConnectors: 4,
            availableConnectors: 3,
            seedAvailableConnectors: 3,
            seedStatus: "available",
            status: "available",
            pricePerKWh: 16,
            estimatedQueueMinutes: 5,
            demandProfile: "transit",
            reliabilityScore: 0.94,
            amenity: "Highway plaza + cafe",
            address: "GST Road, Tambaram",
            city: "Tambaram",
            highway: "GST Road",
            provenance: "simulated_live",
            occupancyRatio: 0.25,
            lastUpdated: new Date().toISOString(),
            predictedAvailability: 0.9,
            predictionConfidence: "HIGH",
            predictionFactors: [],
            dataSourceLabel: "REAL CPO",
          });
          setLoadingStation(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stationId]);

  // Adjust default target kWh based on vehicle class
  useEffect(() => {
    if (selectedVehicle.class === "2W" && targetKWh > 5) {
      setTargetKWh(3.0);
    } else if (selectedVehicle.class === "4W" && targetKWh < 10) {
      setTargetKWh(25.0);
    }
  }, [selectedVehicle, targetKWh]);

  if (loadingStation || !station) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-xs text-mute">
        <Zap className="h-6 w-6 text-volt animate-bounce mb-2" />
        Loading station details for slot reservation…
      </div>
    );
  }

  const pricePerKWh = station.pricePerKWh || 16;
  const energyCost = targetKWh * pricePerKWh;
  const reservationFee = 0; // Waived
  const gst = energyCost * 0.05;
  const totalAmount = Math.round((energyCost + reservationFee + gst) * 10) / 10;

  // Razorpay Checkout flow
  const handlePayAndConfirm = async () => {
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      // Step 1: Request server-side Razorpay Order
      const orderRes = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          receipt: `rcpt_${Date.now()}`,
          notes: {
            stationId: station.id,
            vehicle: selectedVehicle.name,
            slot: selectedSlot,
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success && !orderData.orderId) {
        throw new Error(orderData.error || "Failed to initiate payment gateway.");
      }

      // Step 2: Open Razorpay Checkout modal
      const keyId = orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_VoltGridDemoKey";

      await openRazorpayCheckout({
        key: keyId,
        amount: orderData.amount,
        currency: "INR",
        name: "VoltGrid EV Charging",
        description: `Slot Booking: ${station.name} (${selectedSlot})`,
        order_id: orderData.orderId,
        prefill: {
          name: session?.name || "EV Driver",
          email: session?.email || "driver@voltgrid.io",
          contact: "+919876543210",
        },
        theme: {
          color: "#3ddc97",
        },
        handler: async (paymentResponse) => {
          try {
            // Step 3: Verify signature on server-side
            const verifyRes = await fetch("/api/payments/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(paymentResponse),
            });

            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
              setPaymentError("Payment verification failed. Please try again.");
              setIsProcessingPayment(false);
              return;
            }

            // Step 4: Create confirmed reservation with payment ID
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
              totalCost: totalAmount,
              status: "confirmed",
              createdAt: new Date().toISOString(),
              qrCodeText: `VOLTGRID-PASS-${bookingId}-${station.id}`,

              // Razorpay details
              paymentStatus: "paid",
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            };

            saveBooking(newBooking);
            setConfirmedBooking(newBooking);
            setIsProcessingPayment(false);
          } catch (vErr: unknown) {
            const message = vErr instanceof Error ? vErr.message : "Failed to finalize booking.";
            setPaymentError(message);
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
          },
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start checkout. Please try again.";
      setPaymentError(message);
      setIsProcessingPayment(false);
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;

  return (
    <PortalGuard allowedRole="driver">
      <div className="min-h-screen bg-navy-950 py-10 px-4">
        <div className="mx-auto max-w-3xl space-y-6">
          <Link
            href="/driver/find"
            className="inline-flex items-center gap-1.5 text-xs text-mute hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Station Finder
          </Link>

          {confirmedBooking ? (
            /* Confirmation & Razorpay Receipt View */
            <div className="rounded-3xl border border-volt/40 bg-navy-900 p-8 shadow-2xl text-center space-y-6 animate-fade-up">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-volt/20 text-volt border border-volt/40">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                  RAZORPAY PAYMENT VERIFIED (PAID)
                </span>
                <h1 className="text-3xl font-extrabold text-ink mt-3">Charging Slot Reserved!</h1>
                <p className="text-xs text-mute mt-1">
                  Your dedicated charging bay is locked. Present your digital pass on arrival or scan at the charger screen.
                </p>
              </div>

              {/* Digital Pass Card */}
              <div className="mx-auto max-w-sm rounded-2xl border border-volt/30 bg-navy-950 p-6 shadow-xl space-y-4">
                <div className="flex justify-center">
                  <QrCodeSvg value={confirmedBooking.qrCodeText} size={160} />
                </div>
                <div>
                  <p className="text-[10px] text-mute uppercase tracking-widest font-mono">Pass Code</p>
                  <p className="text-lg font-bold text-volt font-mono">{confirmedBooking.id}</p>
                </div>
                <div className="border-t border-line/60 pt-3 text-xs text-mute space-y-1">
                  <div className="flex justify-between">
                    <span>Station:</span>
                    <strong className="text-ink truncate max-w-[200px]">{confirmedBooking.stationName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Slot:</span>
                    <strong className="text-ink">{confirmedBooking.date} · {confirmedBooking.timeSlot}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Bay & Gun:</span>
                    <strong className="text-volt">{confirmedBooking.bayNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Razorpay Payment ID:</span>
                    <span className="font-mono text-emerald-400">{confirmedBooking.razorpayPaymentId}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric px-6 py-3 text-xs font-bold text-white shadow-md shadow-electric/30 hover:bg-blue-600 transition-colors"
                >
                  <Navigation className="h-4 w-4" />
                  Navigate with Google Maps
                </a>

                <Link
                  href="/driver/session"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-volt to-emerald-400 px-6 py-3 text-xs font-bold text-navy-950 shadow-md shadow-volt/30 hover:brightness-110 transition-all"
                >
                  <Zap className="h-4 w-4 fill-navy-950" />
                  Launch Live Charging HUD
                </Link>

                <Link
                  href="/driver/bookings"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-navy-800 px-5 py-3 text-xs font-semibold text-ink hover:bg-navy-700 transition-colors"
                >
                  My Bookings
                </Link>
              </div>
            </div>
          ) : (
            /* Booking Form with Pre-Selected Default Vehicle & Razorpay */
            <div className="rounded-3xl border border-line bg-navy-900/95 p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Header */}
              <div className="border-b border-line/60 pb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-volt">
                  Step 1 of 2: Bay & Slot Reservation
                </span>
                <h1 className="text-2xl font-extrabold text-ink mt-0.5">{station.name}</h1>
                <p className="text-xs text-mute mt-1">
                  {station.operator} · {station.powerKW} kW {station.connectorType} · {station.address}, {station.city}
                </p>
              </div>

              {paymentError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Vehicle Preset Selector (Pre-selected from Profile) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-mute flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-electric" /> Vehicle (Pre-Selected from Profile)
                  </label>
                  <Link
                    href="/driver/profile"
                    className="text-[11px] font-semibold text-volt hover:underline"
                  >
                    Edit Vehicle Profile →
                  </Link>
                </div>

                <select
                  value={selectedVehicle.id}
                  onChange={(e) => {
                    const found = INDIAN_VEHICLE_PRESETS.find((v) => v.id === e.target.value);
                    if (found) setSelectedVehicle(found);
                  }}
                  className="w-full rounded-xl border border-line bg-navy-950 px-4 py-3 text-xs sm:text-sm text-ink focus:border-electric focus:outline-none"
                >
                  {INDIAN_VEHICLE_PRESETS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.class} · {v.batteryKWh} kWh · {v.connectorType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bay & Gun Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-mute mb-2">
                  Available Charging Bay
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedBay("Bay 1 (DC Fast Gun A)")}
                    className={`rounded-xl border p-3.5 text-left transition-all ${
                      selectedBay === "Bay 1 (DC Fast Gun A)"
                        ? "border-volt bg-volt/10 shadow-sm"
                        : "border-line bg-navy-950/80 hover:border-line-strong"
                    }`}
                  >
                    <span className="block text-xs font-bold text-ink">Bay 1 (Fast Gun A)</span>
                    <span className="block text-[11px] text-mute">{station.powerKW} kW · {station.connectorType}</span>
                    <span className="mt-1 inline-block text-[10px] text-emerald-400 font-semibold">Available Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedBay("Bay 2 (DC Fast Gun B)")}
                    className={`rounded-xl border p-3.5 text-left transition-all ${
                      selectedBay === "Bay 2 (DC Fast Gun B)"
                        ? "border-volt bg-volt/10 shadow-sm"
                        : "border-line bg-navy-950/80 hover:border-line-strong"
                    }`}
                  >
                    <span className="block text-xs font-bold text-ink">Bay 2 (Fast Gun B)</span>
                    <span className="block text-[11px] text-mute">{station.powerKW} kW · {station.connectorType}</span>
                    <span className="mt-1 inline-block text-[10px] text-emerald-400 font-semibold">Available Now</span>
                  </button>
                </div>
              </div>

              {/* Date & Time Slot Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-mute">
                    Reservation Time Slot
                  </label>
                  <div className="flex gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setDateOption("today")}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        dateOption === "today" ? "bg-navy-800 text-ink font-bold border border-line" : "text-mute"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateOption("tomorrow")}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        dateOption === "tomorrow" ? "bg-navy-800 text-ink font-bold border border-line" : "text-mute"
                      }`}
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {TIME_SLOTS.map((s) => {
                    const isBusy = s.status === "busy";
                    const isSelected = selectedSlot === s.time;
                    return (
                      <button
                        key={s.time}
                        type="button"
                        disabled={isBusy}
                        onClick={() => setSelectedSlot(s.time)}
                        className={`rounded-xl px-2.5 py-2.5 text-xs font-medium transition-all ${
                          isBusy
                            ? "bg-navy-950/40 text-mute/40 border border-line/20 cursor-not-allowed line-through"
                            : isSelected
                              ? "bg-gradient-to-r from-volt to-emerald-400 text-navy-950 font-bold shadow-md"
                              : "bg-navy-950 text-ink border border-line hover:border-electric"
                        }`}
                      >
                        {s.time.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Energy Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-mute uppercase tracking-wider">Charging Target</span>
                  <span className="text-volt font-mono font-bold">
                    {targetKWh} kWh (~{Math.round((targetKWh / selectedVehicle.batteryKWh) * 100)}% pack)
                  </span>
                </div>
                <input
                  type="range"
                  min={selectedVehicle.class === "2W" ? 1 : 5}
                  max={Math.min(60, selectedVehicle.batteryKWh)}
                  step={selectedVehicle.class === "2W" ? 0.5 : 2}
                  value={targetKWh}
                  onChange={(e) => setTargetKWh(parseFloat(e.target.value))}
                  className="w-full accent-volt cursor-pointer"
                />
              </div>

              {/* Tariff & Payment Summary */}
              <div className="rounded-2xl border border-line/60 bg-navy-950 p-5 space-y-2 text-xs">
                <div className="flex justify-between text-mute">
                  <span>Energy tariff ({targetKWh} kWh @ ₹{pricePerKWh}/kWh)</span>
                  <span className="text-ink font-mono font-semibold">₹{energyCost.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-mute">
                  <span>Slot holding reservation fee</span>
                  <span className="text-volt font-semibold">FREE (Promotional Waiver)</span>
                </div>
                <div className="flex justify-between text-mute">
                  <span>GST (5%)</span>
                  <span className="text-ink font-mono">₹{gst.toFixed(1)}</span>
                </div>
                <div className="border-t border-line/60 pt-2 flex justify-between text-sm font-bold text-ink">
                  <span>Total Payable via Razorpay</span>
                  <span className="font-mono text-emerald-400 text-base">₹{totalAmount.toFixed(1)}</span>
                </div>
              </div>

              {/* Razorpay Guaranteed Security Note */}
              <div className="rounded-xl border border-line/50 bg-navy-950/60 p-3 flex items-center justify-between text-[11px] text-mute">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-volt shrink-0" />
                  <span>256-bit encrypted checkout via Razorpay (UPI, Credit/Debit, Netbanking)</span>
                </div>
                <span className="font-mono font-semibold text-ink">Test Mode</span>
              </div>

              {/* Razorpay Pay & Confirm CTA */}
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handlePayAndConfirm}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-volt to-emerald-400 py-3.5 text-sm font-extrabold text-navy-950 shadow-lg shadow-volt/40 hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                {isProcessingPayment ? "Opening Razorpay Gateway…" : `Pay ₹${totalAmount.toFixed(1)} & Lock Slot`}
              </button>
            </div>
          )}
        </div>
      </div>
    </PortalGuard>
  );
}

export default function DriverBookPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-xs text-mute">Loading booking…</div>}>
      <DriverBookContent />
    </Suspense>
  );
}
