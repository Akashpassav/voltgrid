"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

interface TooltipProps {
  content: string;
  title?: string;
  children?: React.ReactNode;
}

export function InfoTooltip({ content, title, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <span
      ref={containerRef}
      className="relative inline-flex items-center align-middle ml-1"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-mute transition-colors hover:text-ink focus:outline-none focus:ring-1 focus:ring-volt"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-label={title || "Information"}
        aria-expanded={open}
      >
        {children || <Info className="h-3 w-3" />}
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-60 -translate-x-1/2 rounded-lg border border-line bg-navy-950 p-2.5 text-xs text-ink/90 shadow-xl shadow-navy-950/80 backdrop-blur-md pointer-events-none"
        >
          {title && <span className="block font-semibold text-volt mb-1">{title}</span>}
          <span className="block font-normal leading-relaxed text-slate-300">{content}</span>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-line" />
        </span>
      )}
    </span>
  );
}