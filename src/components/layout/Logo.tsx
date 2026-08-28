import Link from "next/link";
import { Zap } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-electric to-volt shadow-[0_0_16px_-2px] shadow-electric/60 transition-transform group-hover:scale-105">
        <Zap className="h-4 w-4 text-navy-950" fill="currentColor" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-bold tracking-wide text-ink">VoltGrid</span>
          <span className="block text-[10px] uppercase tracking-[0.18em] text-mute">
            Energy Intelligence
          </span>
        </span>
      )}
    </Link>
  );
}