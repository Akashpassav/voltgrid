"use client";

import { useEffect, useRef, useState } from "react";

export interface LocationSearchResult {
  label: string;
  lat: number;
  lng: number;
}

// Bounding box covering Tamil Nadu, Puducherry, and Karnataka combined:
// West: 74.0°E (coastal Karnataka / Karwar / Mangaluru)
// North: 18.5°N (northern Karnataka / Bidar)
// East: 80.5°E (coastal Tamil Nadu / Chennai)
// South: 8.0°N (Kanyakumari)
const VIEWBOX = "74.0,18.5,80.5,8.0"; // left(west),top(north),right(east),bottom(south)

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