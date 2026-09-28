"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Calendar,
  Zap,
  ShieldAlert,
  Car,
  Activity,
  Home,
  LogOut,
  User,
  PlusCircle,
} from "lucide-react";

export function Header() {
  const path = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Role-scoped navigation links
  const links = (() => {
    if (session?.role === "driver") {
      return [
        { href: "/driver/find", label: "Find & Book" },
        { href: "/driver/route", label: "Route Planner" },
        { href: "/driver/bookings", label: "My Bookings" },
        { href: "/driver/profile", label: "Vehicle Profile" },
      ];
    }
    if (session?.role === "operator") {
      return [
        { href: "/operator/dashboard", label: "Hub Dashboard" },
        { href: "/operator/bookings", label: "Reservations Grid" },
        { href: "/operator/network", label: "Network Grid" },
        { href: "/operator/sos", label: "SOS Incidents" },
      ];
    }
    if (session?.role === "host") {
      return [
        { href: "/host/earnings", label: "Earnings Estimator" },
        { href: "/host/register", label: "Register Plug" },
        { href: "/host/community", label: "Community Hubs" },
        { href: "/host/profile", label: "My Chargers" },
      ];
    }
    // Guest / Public navigation
    return [
      { href: "/driver/find", label: "Find Chargers" },
      { href: "/planner", label: "Route Planner" },
      { href: "/host/earnings", label: "Host a Charger" },
      { href: "/helpline", label: "EV SOS & Helpline" },
    ];
  })();

  const roleBadge = (() => {
    if (!session) return null;
    if (session.role === "driver") {
      return { label: "DRIVER", color: "bg-volt/15 text-volt border-volt/30" };
    }
    if (session.role === "operator") {
      return { label: "OPERATOR", color: "bg-electric/15 text-electric border-electric/30" };
    }
    return { label: "HOST", color: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30" };
  })();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-navy-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-3">
          <Logo />
          {roleBadge && (
            <span
              className={`hidden sm:inline-block rounded-full px-2.5 py-0.5 text-[9px] font-extrabold tracking-widest border ${roleBadge.color}`}
            >
              {roleBadge.label}
            </span>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-1 overflow-x-auto text-sm">
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-lg px-3 py-1.5 text-xs font-semibold text-mute transition-colors hover:text-ink whitespace-nowrap",
                  active && "text-ink font-bold",
                  l.href.includes("sos") && "text-red-400 hover:text-red-300",
                )}
              >
                {active && (
                  <span className="absolute inset-0 rounded-lg bg-navy-800 shadow-[0_0_20px_-6px] shadow-electric/50" />
                )}
                <span className="relative flex items-center gap-1.5">{l.label}</span>
                {active && (
                  <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-gradient-to-r from-electric to-volt" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side CTAs */}
        <div className="flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-2.5">
              <span className="hidden sm:inline-block text-xs font-medium text-mute">
                Hi, <strong className="text-ink">{session.name.split(" ")[0]}</strong>
              </span>

              {session.role === "driver" && (
                <Link
                  href="/driver/find"
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-volt to-emerald-400 px-3.5 py-1.5 text-xs font-bold text-navy-950 shadow-md shadow-volt/30 hover:brightness-110 transition-all"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Book Slot
                </Link>
              )}

              {session.role === "host" && (
                <Link
                  href="/host/register"
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-volt px-3.5 py-1.5 text-xs font-bold text-navy-950 shadow-md hover:brightness-110 transition-all"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  List Plug
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="flex items-center gap-1 rounded-lg border border-line bg-navy-900 p-1.5 text-xs text-mute hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl border border-line bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-ink hover:border-electric transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-volt to-emerald-400 px-3.5 py-1.5 text-xs font-bold text-navy-950 shadow-md shadow-volt/30 hover:brightness-110 transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="flex md:hidden overflow-x-auto px-4 py-2 border-t border-line/50 gap-2 bg-navy-950 text-xs">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap px-2.5 py-1 rounded-md ${
              path === l.href ? "bg-navy-800 text-ink font-bold" : "text-mute"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </header>
  );
}