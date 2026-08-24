import { Radio } from "lucide-react";

export function SimBanner() {
  return (
    <div className="flex items-center justify-center gap-2 border-b border-warn/30 bg-warn/10 px-3 py-1.5 text-center text-[11px] font-medium text-warn sm:text-xs">
      <Radio className="h-3.5 w-3.5 shrink-0" />
      <span>
        Live Status: Simulation Mode — station locations are static seed data.
        Occupancy, queues and failures are simulated. Live CPO APIs can be connected through OCPI.
      </span>
    </div>
  );
}
