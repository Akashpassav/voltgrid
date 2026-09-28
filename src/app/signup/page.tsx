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
  User,
  Lock,
  Mail,
} from "lucide-react";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as UserRole) || "driver";

  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(initialRole);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isDriver = role === "driver";
    const session = {
      id: `usr_${Date.now()}`,
      name: name || "EV User",
      email: email || "driver@voltgrid.io",
      role,
      isFirstLogin: isDriver, // Required first-time vehicle step for drivers
      createdAt: new Date().toISOString(),
    };

    login(session);

    if (isDriver) {
      router.replace("/driver/profile?onboarding=1");
    } else {
      router.replace(ROLE_HOMEPAGES[role]);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-volt/30 bg-volt/10 px-3.5 py-1 text-xs font-semibold text-volt mb-3">
            <Zap className="h-3.5 w-3.5 fill-volt" /> Get Started with VoltGrid
          </div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">Create an Account</h1>
          <p className="mt-1.5 text-xs text-mute">
            Select your account type. Each account is scoped to one primary role.
          </p>
        </div>

        {/* Signup Card */}
        <div className="glass-card rounded-2xl border-line p-6 shadow-2xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-mute uppercase mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("driver")}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2.5 border transition-all text-xs ${
                    role === "driver"
                      ? "border-volt bg-volt/15 text-volt font-bold shadow-sm"
                      : "border-line bg-navy-950 text-mute hover:border-line-strong"
                  }`}
                >
                  <Car className="h-4 w-4" />
                  <span>EV Driver</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("operator")}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2.5 border transition-all text-xs ${
                    role === "operator"
                      ? "border-electric bg-electric/15 text-electric font-bold shadow-sm"
                      : "border-line bg-navy-950 text-mute hover:border-line-strong"
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  <span>Operator</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("host")}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2.5 border transition-all text-xs ${
                    role === "host"
                      ? "border-emerald-400 bg-emerald-400/15 text-emerald-300 font-bold shadow-sm"
                      : "border-line bg-navy-950 text-mute hover:border-line-strong"
                  }`}
                >
                  <Home className="h-4 w-4" />
                  <span>Host</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-mute uppercase mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anand Sharma"
                  className="w-full rounded-xl border border-line bg-navy-950 py-2.5 pl-9 pr-3.5 text-xs text-ink placeholder:text-mute/60 focus:border-electric focus:outline-none"
                />
              </div>
            </div>

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
                  placeholder="anand@example.com"
                  className="w-full rounded-xl border border-line bg-navy-950 py-2.5 pl-9 pr-3.5 text-xs text-ink placeholder:text-mute/60 focus:border-electric focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-mute uppercase mb-1">
                Create Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-line bg-navy-950 py-2.5 pl-9 pr-3.5 text-xs text-ink placeholder:text-mute/60 focus:border-electric focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-line/50 bg-navy-950/70 p-3 text-[11px] text-mute flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-volt shrink-0" />
              <span>
                {role === "driver"
                  ? "Next step: configure your default EV profile for instant slot booking."
                  : role === "operator"
                    ? "Full telemetric access to your owned CPO stations and charging bays."
                    : "Monetize and list your private charger with earnings protection."}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-volt to-emerald-400 py-3 text-xs font-bold text-navy-950 shadow-md shadow-volt/30 hover:brightness-110 transition-all cursor-pointer"
            >
              Sign Up as {role.toUpperCase()}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-mute">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-volt hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-xs text-mute">Loading signup…</div>}>
      <SignupContent />
    </Suspense>
  );
}
