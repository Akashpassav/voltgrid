import type { DrivingPreference, OptimizeResponse, TripRequest } from "@/lib/types";

export const TRIP_STORAGE_KEY = "voltgrid.trip";
export const RESULT_STORAGE_KEY = "voltgrid.result";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    if (res.status === 504) {
      throw new Error("Server gateway timed out (504). Please try again.");
    }
    throw new Error(`Request failed (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return json as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    if (res.status === 504) {
      throw new Error("The calculation timed out (504 Gateway Timeout). Please retry.");
    }
    throw new Error(`Server returned status ${res.status}`);
  }
  if (!res.ok && json && typeof json === "object" && "ok" in json) {
    return json as T;
  }
  if (!res.ok) {
    const errorObj = json as { message?: string } | undefined;
    throw new Error(errorObj?.message || `Request failed (${res.status})`);
  }
  return json as T;
}

export function saveTrip(trip: TripRequest): void {
  sessionStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(trip));
}

export function loadTrip(): TripRequest | null {
  const raw = sessionStorage.getItem(TRIP_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TripRequest;
  } catch {
    return null;
  }
}

export function saveResult(result: OptimizeResponse): void {
  sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
}

export function loadResult(): OptimizeResponse | null {
  const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OptimizeResponse;
  } catch {
    return null;
  }
}

export const DEFAULT_TRIP: TripRequest = {
  originId: "",
  destinationId: "",
  vehicleId: "ather-450x",
  socPercent: 68,
  preference: "fastest" as DrivingPreference,
};
