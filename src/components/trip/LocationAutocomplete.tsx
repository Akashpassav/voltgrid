"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Loader2, Search } from "lucide-react";
import { useLocationSearch } from "@/lib/hooks/useLocationSearch";
import { searchPlaces } from "@/lib/data/places";

export function LocationAutocomplete({
  value,
  onSelect,
  onTextChange,
  hasError = false,
  placeholder = "Search for a location…",
  extraButton,
}: {
  value: string;
  onSelect: (label: string, coords: { lat: number; lng: number }) => void;
  onTextChange?: (text: string) => void;
  hasError?: boolean;
  placeholder?: string;
  extraButton?: React.ReactNode;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { results: remoteResults, loading, error } = useLocationSearch(query);

  // Parse exact "lat, lng" if entered directly
  const directCoord = useMemo(() => {
    const trimmed = query.trim();
    const parts = trimmed.split(/[\s,]+/);
    if (parts.length === 2) {
      const lat = Number(parts[0]);
      const lng = Number(parts[1]);
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      ) {
        return { label: `Coordinates (${lat.toFixed(5)}, ${lng.toFixed(5)})`, lat, lng };
      }
    }
    return null;
  }, [query]);

  // Seeded local places matching the typed text
  const localMatches = useMemo(() => {
    if (!query || query.trim().length < 2) return [];
    return searchPlaces(query.trim()).map((p) => ({
      label: p.label || p.name,
      lat: p.latitude,
      lng: p.longitude,
    }));
  }, [query]);

  // Combined results with deduplication
  const allResults = useMemo(() => {
    const list: Array<{ label: string; lat: number; lng: number }> = [];
    if (directCoord) {
      list.push(directCoord);
    }
    for (const loc of localMatches) {
      list.push(loc);
    }
    for (const r of remoteResults) {
      if (
        !list.some(
          (item) =>
            Math.abs(item.lat - r.lat) < 0.001 &&
            Math.abs(item.lng - r.lng) < 0.001,
        )
      ) {
        list.push(r);
      }
    }
    return list;
  }, [directCoord, localMatches, remoteResults]);

  // Keep the input in sync if the value is set from outside (e.g. the
  // "use my location" button resolving in the same From field).
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectItem(r: { label: string; lat: number; lng: number }) {
    onSelect(r.label, { lat: r.lat, lng: r.lng });
    setQuery(r.label);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (allResults.length > 0) {
        e.preventDefault();
        selectItem(allResults[0]);
      }
    }
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mute" />
          <input
            type="text"
            className={`field pl-8 transition-colors ${
              hasError
                ? "border-danger focus:border-danger focus:ring-danger/20"
                : ""
            }`}
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              onTextChange?.(e.target.value);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-electric" />
          )}
        </div>
        {extraButton}
      </div>

      {open && (query.trim().length >= 2 || error) && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-lg border border-electric/20 bg-navy-900/95 shadow-xl backdrop-blur">
          {error && allResults.length === 0 && (
            <p className="px-3 py-2.5 text-xs text-warn">{error}</p>
          )}
          {!error && !loading && allResults.length === 0 && query.trim().length >= 3 && (
            <p className="px-3 py-2.5 text-xs text-mute">No matches — try a different search or enter coordinates.</p>
          )}
          {allResults.map((r, i) => (
            <button
              key={`${r.lat}-${r.lng}-${i}`}
              type="button"
              onClick={() => selectItem(r)}
              className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-electric/10"
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-electric" />
              <span className="line-clamp-2 text-ink">{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}