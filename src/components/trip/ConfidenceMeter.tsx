"use client";

import { cn } from "@/lib/utils/cn";
import type { RouteConfidence } from "@/lib/types";
import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";

export function ConfidenceMeter({
  confidence,
  compact = false,
}: {
  confidence: RouteConfidence;
  compact?: boolean;
}) {
  const tone =
    confidence.level === "HIGH"
      ? "text-volt"
      : confidence.level === "MODERATE"
        ? "text-warn"
        : "text-danger";
  const bar =
    confidence.level === "HIGH"
      ? "bg-volt"
      : confidence.level === "MODERATE"
        ? "bg-warn"
        : "bg-danger";
  const Icon =
    confidence.level === "HIGH" ? ShieldCheck : confidence.level === "MODERATE" ? Shield : ShieldAlert;

  return (
    <div className={cn("rounded-xl border border-line bg-navy-900 p-4", compact && "p-3")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-mute">Route Confidence</p>
          <p className={cn("mt-1 font-semibold tabular-nums", compact ? "text-2xl" : "text-4xl", tone)}>
            {confidence.score}%{" "}
            <span className="text-base font-medium tracking-wide">{confidence.level} CONFIDENCE</span>
          </p>
        </div>
        <Icon className={cn("h-8 w-8 shrink-0", tone)} />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy-700">
        <div className={cn("h-full rounded-full", bar)} style={{ width: `${confidence.score}%` }} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink/90">{confidence.explanation}</p>
      {!compact && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {confidence.factors.map((f) => (
            <li key={f.name} className="rounded-lg bg-navy-800 px-3 py-2">
              <div className="flex items-center justify-between text-xs text-mute">
                <span>{f.name}</span>
                <span className="font-mono text-ink">{f.score}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-mute">{f.note}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
