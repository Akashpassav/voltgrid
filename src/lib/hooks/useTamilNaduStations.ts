"use client";

import { useEffect, useState } from "react";
import type { LiveStation } from "@/lib/types";

export function useTamilNaduStations() {
  const [stations, setStations] = useState<LiveStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stations/tamilnadu")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        setStations(data.stations ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load Tamil Nadu stations:", err);
          setError("Unable to load charging station data.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { stations, loading, error };
}