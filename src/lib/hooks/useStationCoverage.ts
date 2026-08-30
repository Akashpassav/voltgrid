"use client";

import { useEffect, useState } from "react";
import type { LiveStation } from "@/lib/types";

export function useStationCoverage() {
  const [stations, setStations] = useState<LiveStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stations/coverage")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setStations(data.stations ?? []);
        setStale(Boolean(data.stale));
        if (data.error) setError(data.error);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load station coverage:", err);
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

  return { stations, loading, error, stale };
}