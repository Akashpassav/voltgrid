"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/planner", label: "Route planner" },
  { href: "/infrastructure", label: "Infrastructure" },
  { href: "/operator", label: "Operator" },
  { href: "/demo", label: "Demo controls" },
];

export function Header() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-navy-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-1 overflow-x-auto text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm text-mute hover:text-ink hover:bg-navy-800",
                path === l.href && "text-volt bg-navy-800",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
