import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { SimBanner } from "@/components/layout/SimBanner";
import { Footer } from "@/components/layout/Footer";
import { GeolocationProvider } from "@/lib/context/GeolocationContext";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { VoltBotAssistant } from "@/components/ai/VoltBotAssistant";

export const metadata: Metadata = {
  title: "VoltGrid — EV Charging Station Finder & Slot Booking Platform",
  description:
    "Real-time EV charging station locator, advance slot reservation with QR pass, AI journey copilot, and community charger sharing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-navy-950 text-ink">
        <AuthProvider>
          <GeolocationProvider>
            <SimBanner />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <VoltBotAssistant />
          </GeolocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}