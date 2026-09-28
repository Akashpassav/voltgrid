"use client";

import React from "react";
import { PortalGuard } from "@/lib/auth/AuthContext";
import {
  Users,
  MapPin,
  Star,
  Zap,
  CheckCircle2,
  Calendar,
  Home,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

interface CommunityCharger {
  id: string;
  name: string;
  hostName: string;
  location: string;
  city: string;
  plugType: string;
  powerKW: number;
  tariffPerKWh: number;
  rating: number;
  reviewsCount: number;
  availability: string;
  amenities: string[];
}

const COMMUNITY_CHARGERS: CommunityCharger[] = [
  {
    id: "CH-01",
    name: "Green Villa Home Wallbox",
    hostName: "Karthik R.",
    location: "Besant Nagar, 4th Avenue",
    city: "Chennai",
    plugType: "Type 2 Wallbox",
    powerKW: 7.4,
    tariffPerKWh: 13,
    rating: 4.9,
    reviewsCount: 38,
    availability: "Daily 8 AM – 10 PM",
    amenities: ["Covered Parking", "CCTV Security", "Restroom Access"],
  },
  {
    id: "CH-02",
    name: "Indiranagar Solar 15A Plug",
    hostName: "Ananya S.",
    location: "12th Main, HAL 2nd Stage",
    city: "Bengaluru",
    plugType: "15A Industrial AC",
    powerKW: 3.3,
    tariffPerKWh: 11,
    rating: 4.8,
    reviewsCount: 52,
    availability: "24/7 Access",
    amenities: ["Solar Powered", "Gated Compound", "WiFi"],
  },
  {
    id: "CH-03",
    name: "Kovai Tech Park Shared Hub",
    hostName: "Praveen Kumar",
    location: "Avinashi Road, Peelamedu",
    city: "Coimbatore",
    plugType: "Type 2 Fast AC",
    powerKW: 11,
    tariffPerKWh: 14,
    rating: 5.0,
    reviewsCount: 19,
    availability: "Weekdays 9 AM – 7 PM",
    amenities: ["Driveway Access", "Coffee Shop Nearby"],
  },
  {
    id: "CH-04",
    name: "Alwarpet Gated EV Bay",
    hostName: "Meenakshi V.",
    location: "TTK Road, Alwarpet",
    city: "Chennai",
    plugType: "Type 2 Wallbox",
    powerKW: 7.4,
    tariffPerKWh: 14,
    rating: 4.9,
    reviewsCount: 26,
    availability: "Daily 7 AM – 11 PM",
    amenities: ["Security Guard", "Drinking Water"],
  },
];

export default function HostCommunityPage() {
  return (
    <PortalGuard allowedRole="host">
      <div className="min-h-screen bg-navy-950 py-10 px-4">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Host Portal · Verified Network
              </span>
              <h1 className="text-3xl font-extrabold text-ink mt-0.5">Featured Community Chargers</h1>
              <p className="mt-1 text-xs sm:text-sm text-mute">
                Explore peer-to-peer verified plugs shared by community hosts across Southern India.
              </p>
            </div>

            <Link
              href="/host/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-volt px-5 py-2.5 text-xs font-bold text-navy-950 shadow-md hover:brightness-110 transition-all self-start sm:self-auto"
            >
              List Your Charger Too
            </Link>
          </div>

          {/* Directory Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {COMMUNITY_CHARGERS.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-line bg-navy-900/90 p-6 shadow-xl flex flex-col justify-between hover:border-emerald-500/40 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                      COMMUNITY HOST
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {item.rating} ({item.reviewsCount} reviews)
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-ink">{item.name}</h3>
                    <p className="text-xs text-mute flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-mute" />
                      {item.location}, <strong className="text-ink">{item.city}</strong>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-line/40 pt-3">
                    <div className="rounded-xl bg-navy-950 p-2.5 border border-line/30">
                      <span className="text-[10px] text-mute uppercase block">Hardware</span>
                      <strong className="text-ink">{item.plugType} ({item.powerKW} kW)</strong>
                    </div>

                    <div className="rounded-xl bg-navy-950 p-2.5 border border-line/30">
                      <span className="text-[10px] text-mute uppercase block">Access Hours</span>
                      <strong className="text-ink">{item.availability}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.amenities.map((a) => (
                      <span key={a} className="rounded-lg bg-navy-950 px-2 py-0.5 text-[10px] text-mute border border-line">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 border-t border-line/50 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-mute uppercase block">Tariff</span>
                    <span className="text-lg font-mono font-bold text-emerald-400">
                      ₹{item.tariffPerKWh}/kWh
                    </span>
                  </div>

                  <span className="text-xs text-mute font-medium">
                    Host: <strong className="text-ink">{item.hostName}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalGuard>
  );
}
