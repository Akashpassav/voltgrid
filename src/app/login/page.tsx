"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserRole, ROLE_HOMEPAGES } from "@/lib/auth";
import Link from "next/link";
import {
  Zap,
  Car,
  Activity,
  Home,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
  Mail,
} from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const initialRole = (searchParams.get("role") as UserRole) || "driver";

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const session = {
      id: `usr_${Date.now()}`,
      name: email.split("@")[0] || "EV Enthusiast",
      email: email || "driver@voltgrid.io",
      role: selectedRole,
      isFirstLogin: false,
      createdAt: new Date().toISOString(),
    };

    login(session);

    const destination = redirectUrl || ROLE_HOMEPAGES[selectedRole];
    router.replace(destination);
  };

  const handleQuickDemo = (role: UserRole) => {
    const demoNames: Record<UserRole, string> = {
      driver: "Aditya (Driver)",
      operator: "Priya (Grid Operator)",
      host: "Karthik (Community Host)",
    };

    const session = {
      id: `usr_demo_${role}`,
      name: demoNames[role],
      email: `${role}@voltgrid.io`,
      role,
      isFirstLogin: false,
      createdAt: new Date().toISOString(),
    };

    login(session);
    router.replace(ROLE_HOMEPAGES[role]);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-volt/30 bg-volt/10 px-3.5 py-1 text-xs font-semibold text-volt mb-3">
            <Zap className="h-3.5 w-3.5 fill-volt" /> Single Account · Role-Scoped Access
          </div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">Sign In to VoltGrid</h1>
          <p className="mt-1.5 text-xs text-mute">
            Select your portal role to access real-time charging tools.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-line bg-navy-900/90 p-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSelectedRole("driver")}
            className={`flex flex-col items-center gap-1 rounded-xl py-2.5 transition-all ${
              selectedRole === "driver"
                ? "bg-volt text-navy-950 font-bold shadow-md shadow-volt/30"
                : "text-mute hover:text-ink"
            }`}
          >
            <Car className="h-4 w-4" />
            Driver
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("operator")}
            className={`flex flex-col items-center gap-1 rounded-xl py-2.5 transition-all ${
              selectedRole === "operator"
                ? "bg-electric text-white font-bold shadow-md shadow-electric/30"
                : "text-mute hover:text-ink"
            }`}
          >
            <Activity className="h-4 w-4" />
            Operator
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("host")}
            className={`flex flex-col items-center gap-1 rounded-xl py-2.5 transition-all ${
              selectedRole === "host"
                ? "bg-emerald-400 text-navy-950 font-bold shadow-md shadow-emerald-400/30"
                : "text-mute hover:text-ink"
            }`}
          >
            <Home className="h-4 w-4" />
            Host
          </button>
        </div>

        {/* Login Form */}
        <div className="glass-card rounded-2xl border-line p-6 shadow-2xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-mute uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@domain.com"
                  className="w-full rounded-xl border border-line bg-navy-950 py-2.5 pl-9 pr-3.5 text-xs text-ink placeholder:text-mute/60 focus:border-electric focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-mute uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-line bg-navy-950 py-2.5 pl-9 pr-3.5 text-xs text-ink placeholder:text-mute/60 focus:border-electric focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-volt to-emerald-400 py-3 text-xs font-bold text-navy-950 shadow-md shadow-volt/30 hover:brightness-110 transition-all cursor-pointer"
            >
              Sign In as {selectedRole.toUpperCase()}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="border-t border-line/60 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-mute text-center mb-2.5">
              1-Click Demo Login
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo("driver")}
                className="rounded-lg border border-line bg-navy-950 py-2 text-[11px] font-semibold text-volt hover:bg-navy-800 transition-colors"
              >
                Driver Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo("operator")}
                className="rounded-lg border border-line bg-navy-950 py-2 text-[11px] font-semibold text-electric hover:bg-navy-800 transition-colors"
              >
                Operator Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo("host")}
                className="rounded-lg border border-line bg-navy-950 py-2 text-[11px] font-semibold text-emerald-400 hover:bg-navy-800 transition-colors"
              >
                Host Demo
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-mute">
          Don&apos;t have an account yet?{" "}
          <Link href="/signup" className="font-semibold text-volt hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-xs text-mute">Loading login…</div>}>
      <LoginContent />
    </Suspense>
  );
}
