"use client";

export type UserRole = "driver" | "operator" | "host";

export interface VehicleProfile {
  id: string;
  name: string;
  brand: string;
  class: "2W" | "4W";
  connectorType: string;
  batteryKWh: number;
  maxChargeKW: number;
  regNumber?: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isFirstLogin?: boolean;
  defaultVehicle?: VehicleProfile;
  createdAt: string;
}

const SESSION_KEY = "voltgrid_user_session_v1";

export const ROLE_HOMEPAGES: Record<UserRole, string> = {
  driver: "/driver/find",
  operator: "/operator/dashboard",
  host: "/host/earnings",
};

export function getStoredSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Also store in cookie for basic middleware / SSR compatibility
  document.cookie = `voltgrid_role=${session.role}; path=/; max-age=2592000`;
  document.cookie = `voltgrid_session=1; path=/; max-age=2592000`;
  window.dispatchEvent(new Event("voltgrid_session_changed"));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  document.cookie = "voltgrid_role=; path=/; max-age=0";
  document.cookie = "voltgrid_session=; path=/; max-age=0";
  window.dispatchEvent(new Event("voltgrid_session_changed"));
}

export function updateSessionVehicle(vehicle: VehicleProfile): void {
  const current = getStoredSession();
  if (!current) return;
  const updated: UserSession = {
    ...current,
    defaultVehicle: vehicle,
    isFirstLogin: false,
  };
  saveSession(updated);
}
