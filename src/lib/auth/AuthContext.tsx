"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  UserSession,
  UserRole,
  getStoredSession,
  saveSession,
  clearSession,
  ROLE_HOMEPAGES,
} from "./index";

interface AuthContextType {
  session: UserSession | null;
  loading: boolean;
  login: (session: UserSession) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(getStoredSession());
    setLoading(false);

    const onSessionChanged = () => {
      setSession(getStoredSession());
    };

    window.addEventListener("voltgrid_session_changed", onSessionChanged);
    return () => window.removeEventListener("voltgrid_session_changed", onSessionChanged);
  }, []);

  const login = (newSession: UserSession) => {
    saveSession(newSession);
    setSession(newSession);
  };

  const logout = () => {
    clearSession();
    setSession(null);
  };

  const setRole = (role: UserRole) => {
    if (!session) return;
    const updated = { ...session, role };
    saveSession(updated);
    setSession(updated);
  };

  return (
    <AuthContext.Provider value={{ session, loading, login, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

/**
 * Route guard component for portals.
 * Redirects unauthenticated users to /login?redirect=...
 * Redirects wrong-role users to their appropriate portal homepage.
 */
export function PortalGuard({
  allowedRole,
  children,
}: {
  allowedRole: UserRole;
  children: ReactNode;
}) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}&role=${allowedRole}`);
      return;
    }

    if (session.role !== allowedRole) {
      // Redirect to user's assigned portal
      router.replace(ROLE_HOMEPAGES[session.role]);
      return;
    }

    // If driver on first login, redirect to vehicle profile setup
    if (
      session.role === "driver" &&
      session.isFirstLogin &&
      !session.defaultVehicle &&
      pathname !== "/driver/profile"
    ) {
      router.replace("/driver/profile?onboarding=1");
    }
  }, [session, loading, allowedRole, router, pathname]);

  if (loading || !session || session.role !== allowedRole) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
        <div className="h-8 w-8 rounded-full border-2 border-volt border-t-transparent animate-spin mb-4" />
        <p className="text-xs text-mute font-medium uppercase tracking-wider">
          Authenticating {allowedRole} portal session…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
