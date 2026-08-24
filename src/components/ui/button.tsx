import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-volt text-navy-950 hover:bg-[#5ae7aa] font-semibold shadow-[0_0_0_1px_rgba(61,220,151,0.3)]",
  secondary:
    "bg-navy-700 text-ink hover:bg-navy-600 border border-line font-medium",
  ghost: "bg-transparent text-ink hover:bg-navy-800 border border-transparent",
  danger: "bg-danger text-white hover:bg-[#ff5c5c] font-semibold",
  warn: "bg-warn text-navy-950 hover:bg-[#ffb84a] font-semibold",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
