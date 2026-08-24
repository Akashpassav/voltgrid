"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const path = usePathname();
  if (path === "/route") return null;
  return (
    <footer className="border-t border-line bg-navy-950 px-4 py-4 text-xs text-mute">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>VoltGrid prototype · Simulation Mode · OCPI-ready ChargingProvider</p>
        <nav className="flex flex-wrap gap-3">
          <Link href="/planner" className="hover:text-ink">
            Planner
          </Link>
          <Link href="/infrastructure" className="hover:text-ink">
            Infrastructure
          </Link>
          <Link href="/operator" className="hover:text-ink">
            Operator
          </Link>
          <Link href="/demo" className="hover:text-ink">
            Demo
          </Link>
        </nav>
      </div>
    </footer>
  );
}
