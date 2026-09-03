"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";

export function Footer() {
  const path = usePathname();
  if (path === "/route") return null;
  return (
    <footer className="border-t border-line bg-navy-950 px-4 py-6 text-xs text-mute">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-electric" />
          <p>VoltGrid — EV Mobility Intelligence Platform</p>
        </div>
        <nav className="flex flex-wrap gap-4">
          <Link href="/planner" className="transition-colors hover:text-ink">
            Route Planner
          </Link>
          <Link href="/infrastructure" className="transition-colors hover:text-ink">
            Infrastructure
          </Link>
          <Link href="/operator" className="transition-colors hover:text-ink">
            Operator & Grid
          </Link>
          <Link href="/demo" className="transition-colors hover:text-ink">
            Evaluator Sandbox
          </Link>
        </nav>
      </div>
    </footer>
  );
}