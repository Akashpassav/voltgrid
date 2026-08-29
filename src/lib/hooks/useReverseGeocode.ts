"use client";

import { useState } from "react";
import type { Coordinates } from "@/lib/types";

export function useReverseGeocode() {
  const [loading, setLoading] = useState(false);

  const reverseGeocode = async (coords: Coordinates): Promise<string> => {
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "en" },
      });
      if (!res.ok) throw new Error(`Nominatim responded with ${res.status}`);
      const data = await res.json();
      return data?.display_name ?? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
      return `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
    } finally {
      setLoading(false);
    }
  };

  return { reverseGeocode, loading };
}