"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, Loader2, AlertTriangle } from "lucide-react";
import { useGeolocationContext } from "@/lib/context/GeolocationContext";
import { useReverseGeocode } from "@/lib/hooks/useReverseGeocode";
import type { Coordinates } from "@/lib/types";

export function LocationButton({
  onResolved,
}: {
  onResolved: (address: string, coords: Coordinates) => void;
}) {
  const geo = useGeolocationContext();
  const { reverseGeocode, loading: geocoding } = useReverseGeocode();
  const [awaitingFix, setAwaitingFix] = useState(false);
  const resolvedForRef = useRef<string | null>(null);

  const busy = geo.status === "requesting" || geocoding || awaitingFix;
  const hasIssue = geo.status === "denied" || geo.status === "unavailable" || geo.status === "unsupported";

  const resolve = async (coords: Coordinates) => {
    const key = `${coords.lat},${coords.lng}`;
    if (resolvedForRef.current === key) return; // avoid duplicate resolves for the same fix
    resolvedForRef.current = key;
    const address = await reverseGeocode(coords);
    onResolved(`Current Location — ${address}`, coords);
    setAwaitingFix(false);
  };

  const handleClick = () => {
    if (geo.position) {
      resolve(geo.position);
      return;
    }
    setAwaitingFix(true);
    geo.requestLocation();
  };

  // If we were waiting on a fresh permission grant and a position just arrived, resolve it.
  useEffect(() => {
    if (awaitingFix && geo.position && geo.status === "active") {
      resolve(geo.position);
    }
    if (awaitingFix && hasIssue) {
      setAwaitingFix(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.position, geo.status]);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        title={hasIssue ? "Location access denied — enter your starting point manually" : "Use my current location"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-electric/30 bg-electric/10 text-electric transition-all hover:bg-electric/20 hover:shadow-[0_0_16px_-2px] hover:shadow-electric/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : hasIssue ? (
          <AlertTriangle className="h-4 w-4 text-warn" />
        ) : (
          <LocateFixed className="h-4 w-4" />
        )}
      </button>

      {hasIssue && (
        <div className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-lg border border-warn/30 bg-navy-900 p-2.5 text-xs text-ink shadow-xl">
          {geo.errorMessage || "Location access denied"} — please enter your starting point manually.
        </div>
      )}
    </div>
  );
}