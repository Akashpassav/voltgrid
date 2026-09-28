"use client";

export type PaymentStatus = "paid" | "unpaid" | "refunded";

export interface Booking {
  id: string;
  stationId: string;
  stationName: string;
  operator: string;
  address: string;
  city: string;
  date: string;
  timeSlot: string;
  bayNumber: string;
  connectorType: string;
  powerKW: number;
  vehicleId: string;
  vehicleName: string;
  targetKWh: number;
  durationMinutes: number;
  pricePerKWh: number;
  totalCost: number;
  status: "confirmed" | "active_charging" | "completed" | "cancelled";
  createdAt: string;
  qrCodeText: string;

  // Razorpay payment integration
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  finalKWhDelivered?: number;
  settlementAdjustment?: number; // e.g. extra charge or refund difference on stop charging
  invoiceNumber?: string;
}

const STORAGE_KEY = "voltgrid_bookings_v2";

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "VG-BK-89021",
    stationId: "VG-014",
    stationName: "Tambaram GST Energy Plaza",
    operator: "VoltGrid Demo CPO",
    address: "GST Road, Tambaram",
    city: "Tambaram",
    date: new Date().toISOString().split("T")[0],
    timeSlot: "15:00 - 15:45",
    bayNumber: "Bay 2 (DC Fast Gun A)",
    connectorType: "CCS2",
    powerKW: 60,
    vehicleId: "tata-nexon-ev-long-range",
    vehicleName: "Tata Nexon EV Max",
    targetKWh: 24,
    durationMinutes: 45,
    pricePerKWh: 16,
    totalCost: 384,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    qrCodeText: "VOLTGRID-PASS-VG-BK-89021-TAMBARAM",
    paymentStatus: "paid",
    razorpayOrderId: "order_mock_79812481",
    razorpayPaymentId: "pay_rzp_test_89021a",
    invoiceNumber: "INV-2026-89021",
  },
  {
    id: "VG-BK-74102",
    stationId: "VG-001",
    stationName: "Chennai Central EV Hub",
    operator: "Tata Power EZ Charge",
    address: "EVS Road, Park Town",
    city: "Chennai",
    date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
    timeSlot: "11:00 - 11:45",
    bayNumber: "Bay 1 (AC Type-2)",
    connectorType: "Type 2",
    powerKW: 7.2,
    vehicleId: "ather-450x-gen3",
    vehicleName: "Ather 450X Gen 3",
    targetKWh: 3.2,
    durationMinutes: 45,
    pricePerKWh: 14,
    totalCost: 44.8,
    status: "completed",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    qrCodeText: "VOLTGRID-PASS-VG-BK-74102-CHENNAI-CENTRAL",
    paymentStatus: "paid",
    razorpayOrderId: "order_mock_6104812",
    razorpayPaymentId: "pay_rzp_test_74102b",
    invoiceNumber: "INV-2026-74102",
    finalKWhDelivered: 3.3,
  },
];

export function getStoredBookings(): Booking[] {
  if (typeof window === "undefined") return INITIAL_BOOKINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BOOKINGS;
  }
}

export function saveBooking(booking: Booking): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredBookings();
    const updated = [booking, ...existing.filter((b) => b.id !== booking.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("voltgrid_bookings_changed"));
  } catch (e) {
    console.error("Failed to save booking to localStorage", e);
  }
}

export function updateBooking(id: string, updates: Partial<Booking>): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredBookings();
    const updated = existing.map((b) => (b.id === id ? { ...b, ...updates } : b));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("voltgrid_bookings_changed"));
  } catch (e) {
    console.error("Failed to update booking", e);
  }
}

export function updateBookingStatus(
  id: string,
  status: Booking["status"],
): void {
  updateBooking(id, { status });
}

export function generateBookingId(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `VG-BK-${num}`;
}
