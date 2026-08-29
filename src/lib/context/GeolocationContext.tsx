"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { Coordinates } from "@/lib/types";

type GeoStatus = "idle" | "requesting" | "active" | "denied" | "unavailable" | "unsupported";

interface GeolocationContextValue {
  position: Coordinates | null;
  status: GeoStatus;
  errorMessage: string | null;
  requestLocation: () => void;
}

const GeolocationContext = createContext<GeolocationContextValue | null>(null);

export function GeolocationProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);

  const requestLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setStatus("unsupported");
      setErrorMessage("Geolocation is not supported in this browser.");
      return;
    }

    // Already watching — nothing new to trigger, existing state will keep updating.
    if (hasStartedRef.current && watchIdRef.current !== null) {
      return;
    }

    hasStartedRef.current = true;
    setStatus("requesting");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("active");
        setErrorMessage(null);
      },
      (err) => {
        let newStatus: GeoStatus = "unavailable";
        let message = "Could not determine your location.";
        if (err.code === err.PERMISSION_DENIED) {
          newStatus = "denied";
          message = "Location permission was denied.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          newStatus = "unavailable";
          message = "Location is currently unavailable.";
        } else if (err.code === err.TIMEOUT) {
          newStatus = "unavailable";
          message = "Location request timed out.";
        }
        setStatus(newStatus);
        setErrorMessage(message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <GeolocationContext.Provider value={{ position, status, errorMessage, requestLocation }}>
      {children}
    </GeolocationContext.Provider>
  );
}

export function useGeolocationContext() {
  const ctx = useContext(GeolocationContext);
  if (!ctx) {
    throw new Error("useGeolocationContext must be used within a GeolocationProvider");
  }
  return ctx;
}