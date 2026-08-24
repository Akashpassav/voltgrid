import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { SimBanner } from "@/components/layout/SimBanner";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "VoltGrid — EV Mobility Intelligence",
  description:
    "India-first EV route intelligence that predicts charging availability before you arrive.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-navy-950 text-ink">
        <SimBanner />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
