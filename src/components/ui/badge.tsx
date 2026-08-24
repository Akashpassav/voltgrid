import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

const tones = {
  green: "bg-volt/15 text-volt border-volt/30",
  amber: "bg-warn/15 text-warn border-warn/30",
  red: "bg-danger/15 text-danger border-danger/30",
  blue: "bg-info/15 text-info border-info/30",
  mute: "bg-navy-700 text-mute border-line",
};

export function Badge({
  className,
  tone = "mute",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
