"use client";

/**
 * EmergencyFAB — NEW COMPONENT
 *
 * A Floating Action Button that provides always-visible access to the
 * EV Helpline / Emergency Assistance page (/helpline).
 *
 * Behavior:
 *   - Normal (SOC > 25%): Subtle ☎ EV Helpline link, ghost styling
 *   - Low (SOC 15–25%):   Amber warning button
 *   - Critical (SOC ≤ 15%): Pulsing red 🆘 Emergency button
 *   - Stranded (SOC ≤ 5%): Pulsing red, max urgency
 *
 * The FAB is positioned to avoid overlapping the Leaflet recenter button.
 * It links to /helpline?soc=<value> so the helpline page can show
 * contextually appropriate content.
 *
 * IMPORTANT: This component does NOT modify any existing file.
 * It is imported exclusively by the new route/layout.tsx.
 */

import Link from "next/link";
import { PhoneCall, AlertTriangle } from "lucide-react";

interface EmergencyFABProps {
  /** State of charge percent — drives urgency display */
  socPercent: number;
}

export function EmergencyFAB({ socPercent }: EmergencyFABProps) {
  const isStranded = socPercent <= 5;
  const isCritical = socPercent <= 15;
  const isLow = socPercent <= 25;

  if (isStranded || isCritical) {
    return (
      <Link
        href={`/helpline?soc=${Math.round(socPercent)}`}
        aria-label="Open EV Emergency Assistance"
        className={[
          "fixed bottom-20 right-4 z-[1100]",
          "flex items-center gap-2",
          "rounded-full px-4 py-2.5 shadow-2xl",
          "bg-red-600 text-white font-bold text-xs",
          "border-2 border-red-400",
          "transition-all hover:bg-red-500 active:scale-95",
          isStranded ? "animate-pulse" : "",
        ].join(" ")}
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>🆘 Emergency</span>
      </Link>
    );
  }

  if (isLow) {
    return (
      <Link
        href={`/helpline?soc=${Math.round(socPercent)}`}
        aria-label="Open EV Helpline — Battery Low"
        className={[
          "fixed bottom-20 right-4 z-[1100]",
          "flex items-center gap-2",
          "rounded-full px-3.5 py-2 shadow-xl",
          "bg-amber-500/90 text-navy-950 font-semibold text-xs",
          "border border-amber-400",
          "transition-all hover:bg-amber-400 active:scale-95",
        ].join(" ")}
      >
        <PhoneCall className="h-3.5 w-3.5 shrink-0" />
        <span>⚠ EV Helpline</span>
      </Link>
    );
  }

  // Normal — discreet, doesn't distract from navigation
  return (
    <Link
      href="/helpline"
      aria-label="Open EV Helpline"
      className={[
        "fixed bottom-20 right-4 z-[1100]",
        "flex items-center gap-1.5",
        "rounded-full px-3 py-1.5 shadow-lg",
        "bg-navy-900/90 text-mute text-xs font-medium",
        "border border-line/60 backdrop-blur",
        "transition-all hover:text-ink hover:border-volt/40 hover:bg-navy-800",
        "active:scale-95",
      ].join(" ")}
    >
      <PhoneCall className="h-3 w-3 shrink-0" />
      <span>☎ EV Helpline</span>
    </Link>
  );
}
