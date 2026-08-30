"use client";

import { useEffect, useRef, useState } from "react";

export interface LocationSearchResult {
  label: string;
  lat: number;
  lng: number;
}

// Soft-biased toward Tamil Nadu + Bengaluru combined (not a hard restriction —
// Nominatim's viewbox without `bounded=1` nudges ranking, it doesn't exclude
// results elsewhere, so a search for a genuinely different place still works).
const VIEWBOX = "76.2,13.6,80.5,8.0"; // left,top,right,bottom

export function useLocationSearch(query: string) {
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const thisRequestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        trimmed,
      )}&format=json&countrycodes=in&limit=5&viewbox=${VIEWBOX}`;

      fetch(url, { headers: { "Accept-Language": "en" } })
        .then((res) => {
          if (!res.ok) throw new Error(`Nominatim responded with ${res.status}`);
          return res.json();
        })
        .then((data: Array<{ display_name: string; lat: string; lon: string }>) => {
          if (requestIdRef.current !== thisRequestId) return; // stale response, ignore
          setResults(
            data.map((d) => ({
              label: d.display_name,
              lat: Number(d.lat),
              lng: Number(d.lon),
            })),
          );
        })
        .catch((err) => {
          if (requestIdRef.current !== thisRequestId) return;
          console.error("Location search failed:", err);
          setError("Search unavailable — you can still enter a location manually.");
          setResults([]);
        })
        .finally(() => {
          if (requestIdRef.current === thisRequestId) setLoading(false);
        });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { results, loading, error };
}