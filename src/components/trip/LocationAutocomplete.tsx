"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, Search } from "lucide-react";
import { useLocationSearch } from "@/lib/hooks/useLocationSearch";

export function LocationAutocomplete({
  value,
  onSelect,
  placeholder = "Search for a location…",
  extraButton,
}: {
  value: string;
  onSelect: (label: string, coords: { lat: number; lng: number }) => void;
  placeholder?: string;
  extraButton?: React.ReactNode;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { results, loading, error } = useLocationSearch(query);

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

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mute" />
          <input
            type="text"
            className="field pl-8"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-electric" />
          )}
        </div>
        {extraButton}
      </div>

      {open && (query.trim().length >= 3 || error) && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-lg border border-electric/20 bg-navy-900/95 shadow-xl backdrop-blur">
          {error && (
            <p className="px-3 py-2.5 text-xs text-warn">{error}</p>
          )}
          {!error && !loading && results.length === 0 && query.trim().length >= 3 && (
            <p className="px-3 py-2.5 text-xs text-mute">No matches — try a different search.</p>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.lat}-${r.lng}-${i}`}
              type="button"
              onClick={() => {
                onSelect(r.label, { lat: r.lat, lng: r.lng });
                setQuery(r.label);
                setOpen(false);
              }}
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