import type { Metadata } from "next";
import { IBM_Plex_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { SimBanner } from "@/components/layout/SimBanner";
import { Footer } from "@/components/layout/Footer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const ibm = IBM_Plex_Mono({
  variable: "--font-ibm",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VoltGrid — EV Mobility Intelligence",
  description:
    "India-first EV route intelligence that predicts charging availability before you arrive.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${ibm.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-navy-950 text-ink">
        <SimBanner />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
