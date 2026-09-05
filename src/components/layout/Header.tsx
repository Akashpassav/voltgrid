"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/planner", label: "Route Planner" },
  { href: "/infrastructure", label: "Infrastructure" },
  { href: "/operator", label: "Operator & Grid" },
  { href: "/demo", label: "Evaluator Sandbox" },
  { href: "/helpline", label: "EV Helpline" },
];

export function Header() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-navy-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-1 overflow-x-auto text-sm">
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-sm font-medium text-mute transition-colors hover:text-ink",
                  active && "text-ink",
                )}
              >
                {active && (
                  <span className="absolute inset-0 rounded-lg bg-navy-800 shadow-[0_0_20px_-6px] shadow-electric/50" />
                )}
                <span className="relative">{l.label}</span>
                {active && (
                  <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-gradient-to-r from-electric to-volt" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}