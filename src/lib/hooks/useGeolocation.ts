"use client";

import { useEffect, useRef, useState } from "react";
import type { Coordinates } from "@/lib/types";

type GeoStatus = "idle" | "requesting" | "active" | "denied" | "unavailable" | "unsupported";

interface GeoState {
  position: Coordinates | null;
  status: GeoStatus;
  errorMessage: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    position: null,
    status: "idle",
    errorMessage: null,
  });
  const watchIdRef = useRef<number | null>(null);

  const start = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState({ position: null, status: "unsupported", errorMessage: "Geolocation is not supported in this browser." });
      return;
    }

    setState((s) => ({ ...s, status: "requesting" }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          status: "active",
          errorMessage: null,
        });
      },
      (err) => {
        let status: GeoStatus = "unavailable";
        let message = "Could not determine your location.";
        if (err.code === err.PERMISSION_DENIED) {
          status = "denied";
          message = "Location permission was denied.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          status = "unavailable";
          message = "Location is currently unavailable.";
        } else if (err.code === err.TIMEOUT) {
          status = "unavailable";
          message = "Location request timed out.";
        }
        setState({ position: null, status, errorMessage: message });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );
  };

  const stop = () => {
    if (watchIdRef.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  useEffect(() => {
    return () => stop();
  }, []);

  return { ...state, start, stop };
}