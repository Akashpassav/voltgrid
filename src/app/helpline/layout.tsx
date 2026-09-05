import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EV Emergency Assistance — VoltGrid",
  description:
    "Find the nearest charging station, battery swap station, or EV roadside assistance when your battery is low or depleted.",
};

export default function HelplineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
