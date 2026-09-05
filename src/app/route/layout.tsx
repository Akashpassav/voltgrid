/**
 * VoltGrid — /route segment layout (NEW FILE)
 *
 * Injects:
 *   1. CSS overrides (route-overrides.css) — fixes address overflow
 *   2. EmergencyFAB — floating ☎ EV Helpline button linking to /helpline
 *
 * No existing file is modified.
 */

import type { Metadata } from "next";
import "./route-overrides.css";
import { EmergencyFAB } from "@/components/trip/EmergencyFAB";

export const metadata: Metadata = {
  title: "Active Route — VoltGrid",
  description: "Live EV route guidance, charging stops, and real-time navigation.",
};

export default function RouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-vg-route className="contents">
      {children}
      {/* Floating helpline button — always visible on the route page */}
      <EmergencyFAB socPercent={50} />
    </div>
  );
}
