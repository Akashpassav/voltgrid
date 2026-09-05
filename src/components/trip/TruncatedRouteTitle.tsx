"use client";

/**
 * TruncatedRouteTitle — NEW COMPONENT
 *
 * Renders an origin → destination route title with graceful truncation.
 * Long addresses are clamped to 2 lines and the full text is accessible
 * via a native HTML `title` attribute (tooltip on hover/focus).
 *
 * Props:
 *   origin      — the origin place name (may be a very long reverse-geocoded address)
 *   destination — the destination place name
 *   className   — optional extra Tailwind classes
 */

import { useState } from "react";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";

interface TruncatedRouteTitleProps {
  origin: string;
  destination: string;
  className?: string;
}

export function TruncatedRouteTitle({
  origin,
  destination,
  className = "",
}: TruncatedRouteTitleProps) {
  const [expanded, setExpanded] = useState(false);

  const fullText = `${origin} → ${destination}`;
  const isLong = fullText.length > 80;

  return (
    <div className={`w-full ${className}`}>
      {/* Main title with clamp-2 when not expanded */}
      <h1
        title={fullText}
        className={[
          "font-bold text-ink leading-snug",
          "break-words word-break-all",
          "text-xl sm:text-2xl",
          // When not expanded, clamp to 2 lines
          !expanded
            ? "overflow-hidden"
            : "",
        ].join(" ")}
        style={
          !expanded
            ? {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
                wordBreak: "break-word",
              }
            : { wordBreak: "break-word" }
        }
      >
        {/* Origin */}
        <span className="inline-flex items-baseline gap-1 flex-wrap">
          <MapPin
            className="inline h-4 w-4 text-volt shrink-0 relative top-0.5"
            aria-hidden
          />
          <span className="text-ink">{origin}</span>
        </span>

        {/* Arrow separator */}
        <span className="mx-1.5 text-mute font-normal" aria-hidden>
          →
        </span>

        {/* Destination */}
        <span className="text-mute font-medium">{destination}</span>
      </h1>

      {/* Expand / collapse toggle — only shown for genuinely long addresses */}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-mute hover:text-volt transition-colors"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse full address" : "Show full address"}
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              Show full address <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * TruncatedInlineAddress — compact single-line address for panel headers / banners.
 *
 * Renders a single truncated line with full address in a `title` tooltip.
 * Designed for the floating map navigation panel.
 */
export function TruncatedInlineAddress({
  address,
  className = "",
  maxLength = 55,
}: {
  address: string;
  className?: string;
  maxLength?: number;
}) {
  const isTruncated = address.length > maxLength;
  const display = isTruncated
    ? `${address.slice(0, maxLength).trimEnd()}…`
    : address;

  return (
    <span
      title={isTruncated ? address : undefined}
      className={`truncate block ${className}`}
      aria-label={address}
    >
      {display}
    </span>
  );
}
