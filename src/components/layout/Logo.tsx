import Link from "next/link";
import { Zap } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volt text-navy-950">
        <Zap className="h-4 w-4" fill="currentColor" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-wide text-ink">VoltGrid</span>
          <span className="block text-[10px] uppercase tracking-[0.18em] text-mute">
            Mobility intelligence
          </span>
        </span>
      )}
    </Link>
  );
}
