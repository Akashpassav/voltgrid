import { Radio } from "lucide-react";

export function SimBanner() {
  return (
    <div className="flex items-center justify-center gap-2 border-b border-electric/20 bg-electric/[0.06] px-3 py-1.5 text-center text-[11px] font-medium text-electric sm:text-xs">
      <Radio className="h-3.5 w-3.5 shrink-0 animate-pulse" />
      <span>
        Simulation Mode — station data is seeded for demonstration. Live charge-point APIs
        connect via OCPI.
      </span>
    </div>
  );
}