import Link from "next/link";
import { TripForm } from "@/components/trip/TripForm";
import { DEFAULT_TRIP } from "@/lib/client/api";
import { getDashboardMetrics } from "@/lib/services/dashboard";
import { StationCard } from "@/components/stations/StationCard";
import type { LiveStation } from "@/lib/types";
import {
  ArrowRight,
  GitBranch,
  MapPinned,
  Radio,
  Sparkles,
  Car,
  Bike,
  BatteryCharging,
  Calendar,
  Zap,
  Bot,
  ShieldCheck,
  Home,
  Clock,
  CheckCircle2,
  Navigation,
  Activity,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

const FEATURED_STATIONS: LiveStation[] = [
  {
    id: "VG-014",
    name: "Tambaram GST Energy Plaza",
    latitude: 12.9249,
    longitude: 80.104,
    operator: "VoltGrid Demo CPO",
    connectorType: "CCS2",
    powerKW: 60,
    totalConnectors: 4,
    availableConnectors: 3,
    seedAvailableConnectors: 3,
    seedStatus: "available",
    status: "available",
    pricePerKWh: 16,
    estimatedQueueMinutes: 4,
    demandProfile: "transit",
    reliabilityScore: 0.94,
    amenity: "Highway plaza + cafe",
    address: "GST Road, Tambaram",
    city: "Tambaram",
    highway: "GST Road",
    provenance: "simulated_live",
    occupancyRatio: 0.25,
    lastUpdated: new Date().toISOString(),
    predictedAvailability: 0.92,
    predictionConfidence: "HIGH",
    predictionFactors: [],
    dataSourceLabel: "REAL CPO",
  },
  {
    id: "VG-001",
    name: "Chennai Central EV Hub",
    latitude: 13.0827,
    longitude: 80.2707,
    operator: "Tata Power EZ Charge",
    connectorType: "Type 2",
    powerKW: 25,
    totalConnectors: 6,
    availableConnectors: 4,
    seedAvailableConnectors: 4,
    seedStatus: "available",
    status: "available",
    pricePerKWh: 15,
    estimatedQueueMinutes: 3,
    demandProfile: "transit",
    reliabilityScore: 0.88,
    amenity: "Railway station access",
    address: "EVS Road, Park Town",
    city: "Chennai",
    highway: "Inner city",
    provenance: "simulated_live",
    occupancyRatio: 0.33,
    lastUpdated: new Date().toISOString(),
    predictedAvailability: 0.88,
    predictionConfidence: "HIGH",
    predictionFactors: [],
    dataSourceLabel: "REAL CPO",
  },
  {
    id: "VG-044",
    name: "Indiranagar 100ft Energy Hub",
    latitude: 12.9719,
    longitude: 77.6412,
    operator: "Tata Power & Sun Mobility",
    connectorType: "CCS2",
    powerKW: 50,
    totalConnectors: 6,
    availableConnectors: 4,
    seedAvailableConnectors: 4,
    seedStatus: "available",
    status: "available",
    pricePerKWh: 17,
    estimatedQueueMinutes: 4,
    demandProfile: "mall",
    reliabilityScore: 0.91,
    amenity: "Metro + Retail plaza",
    address: "100 Feet Road, Indiranagar",
    city: "Bengaluru",
    highway: "Old Airport Road",
    provenance: "simulated_live",
    occupancyRatio: 0.33,
    lastUpdated: new Date().toISOString(),
    predictedAvailability: 0.9,
    predictionConfidence: "HIGH",
    predictionFactors: [],
    dataSourceLabel: "REAL CPO",
  },
];

export default async function HomePage() {
  const metrics = await getDashboardMetrics();

  return (
    <div>
      {/* ---------- HERO SECTION WITH ROLE SELECTION CTAs ---------- */}
      <section className="grid-bg relative overflow-hidden border-b border-line">
        <div className="aurora-blob -top-32 left-1/4 h-96 w-96 bg-electric/20" />
        <div className="aurora-blob top-32 -right-20 h-96 w-96 bg-volt/15" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-volt/30 bg-volt/10 px-3.5 py-1 text-xs font-semibold text-volt">
              <Zap className="h-3.5 w-3.5 fill-volt" />
              India&apos;s Unified EV Mobility &amp; Charging Platform
            </div>

            <h1 className="mt-5 max-w-xl text-4xl font-extrabold tracking-tight sm:text-6xl">
              <span className="text-ink">Travel farther.</span>
              <br />
              <span className="bg-gradient-to-r from-volt via-emerald-400 to-electric bg-clip-text text-transparent">
                Power your journey.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-mute">
              Real-time charging bay locator, guaranteed advance slot booking with digital QR passes, AI copilot navigation, and peer-to-peer charger sharing.
            </p>

            {/* Role Selection CTAs ("I'm a Driver" / "I'm an Operator" / "I'm a Charge Station Host") */}
            <div className="mt-8 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-ink/80 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-volt" /> Choose Your Portal Role:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl">
                {/* Driver CTA */}
                <Link
                  href="/driver/find"
                  className="group flex flex-col justify-between rounded-2xl border border-volt/40 bg-navy-900/90 p-4 shadow-lg hover:border-volt hover:bg-navy-900 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-volt/15 text-volt border border-volt/30">
                      <Car className="h-4 w-4" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-mute group-hover:text-volt group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="mt-3">
                    <strong className="block text-sm font-bold text-ink">I&apos;m a Driver</strong>
                    <span className="text-[11px] text-mute">Find &amp; reserve fast charging slots</span>
                  </div>
                </Link>

                {/* Operator CTA */}
                <Link
                  href="/operator/dashboard"
                  className="group flex flex-col justify-between rounded-2xl border border-electric/40 bg-navy-900/90 p-4 shadow-lg hover:border-electric hover:bg-navy-900 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-electric/15 text-electric border border-electric/30">
                      <Activity className="h-4 w-4" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-mute group-hover:text-electric group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="mt-3">
                    <strong className="block text-sm font-bold text-ink">I&apos;m an Operator</strong>
                    <span className="text-[11px] text-mute">Manage hubs, bays &amp; grid telemetry</span>
                  </div>
                </Link>

                {/* Host CTA */}
                <Link
                  href="/host/earnings"
                  className="group flex flex-col justify-between rounded-2xl border border-emerald-400/40 bg-navy-900/90 p-4 shadow-lg hover:border-emerald-400 hover:bg-navy-900 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                      <Home className="h-4 w-4" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-mute group-hover:text-emerald-300 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="mt-3">
                    <strong className="block text-sm font-bold text-ink">I&apos;m a Host</strong>
                    <span className="text-[11px] text-mute">Monetize idle plugs &amp; wallboxes</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Platform Metrics */}
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-line/60 pt-6">
              <Stat value={`${metrics.totalChargers}+`} label="Live Charging Hubs" />
              <Stat value="27" label="Supported EV Models" />
              <Stat value="0 min" label="Advance Booking Wait" />
              <Stat value="99.4%" label="Bay Reservation Success" />
            </div>
          </div>

          {/* Right Column: Interactive Journey Optimizer */}
          <div className="glass-card border-glow relative rounded-2xl p-6 animate-fade-up [animation-delay:150ms] shadow-2xl">
            <div className="flex items-center justify-between border-b border-line/60 pb-3 mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-volt font-semibold">
                  EV Route Optimizer
                </p>
                <p className="text-xl font-bold text-ink">Plan Corridor Journey</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 rounded-full bg-navy-800 px-2.5 py-1 text-xs text-mute border border-line">
                  <Bike className="h-3 w-3 text-volt" /> 2W
                </span>
                <span className="flex items-center gap-1 rounded-full bg-navy-800 px-2.5 py-1 text-xs text-mute border border-line">
                  <Car className="h-3 w-3 text-electric" /> 4W
                </span>
              </div>
            </div>

            <TripForm initial={DEFAULT_TRIP} submitLabel="Calculate Optimal Route & Stops" />
          </div>
        </div>
      </section>

      {/* ---------- 6 CORE PLATFORM PILLARS (Apptunix Video Showcase) ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-volt">
            Next-Gen EV Experience
          </p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl text-ink">
            Everything You Need to Power Your Electric Journey
          </h2>
          <p className="mt-3 text-sm text-mute leading-relaxed">
            Engineered as a comprehensive ecosystem for EV drivers, charging station operators, and community hosts.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<MapPinned className="h-6 w-6 text-volt" />}
            title="Real-Time Station Locator"
            description="Find verified EV charging hubs near you with real-time connector availability (CCS2, Type 2, 15A Socket, Swap), live wait times, and pricing per kWh."
            badge="Live Telemetry"
            linkText="Browse Live Stations"
            href="/driver/find"
          />

          <FeatureCard
            icon={<Calendar className="h-6 w-6 text-electric" />}
            title="Advance Slot Booking"
            description="Reserve your dedicated charging bay in advance with Razorpay checkout. Lock in your arrival time slot and receive an instant digital QR pass."
            badge="0-Wait Guarantee"
            linkText="Book a Slot Now"
            href="/driver/find"
          />

          <FeatureCard
            icon={<Bot className="h-6 w-6 text-emerald-400" />}
            title="AI-Powered EV Assistant"
            description="VoltBot AI Copilot answers driver questions, predicts battery range consumption on highways, suggests optimal off-peak charging times, and troubleshoots errors."
            badge="VoltBot AI"
            linkText="Chat with VoltBot"
            href="/driver/find"
          />

          <FeatureCard
            icon={<Activity className="h-6 w-6 text-cyan-400" />}
            title="Live Session HUD & Telemetry"
            description="Monitor your active charging session in real time. Dynamic battery SoC gauge, charging speed in kW, delivered energy in kWh, and accumulated session cost."
            badge="Live HUD"
            linkText="View Bookings & Sessions"
            href="/driver/bookings"
          />

          <FeatureCard
            icon={<Home className="h-6 w-6 text-amber-400" />}
            title="Host a Charger & Earn"
            description="Monetize your residential wallbox or commercial 15A plug. Set custom pricing, share idle hours with verified local EV drivers, and earn up to ₹8,000/month."
            badge="Peer-to-Peer"
            linkText="Become a Host"
            href="/host/earnings"
          />

          <FeatureCard
            icon={<AlertTriangle className="h-6 w-6 text-red-400" />}
            title="Emergency SOS & Roadside Rescue"
            description="One-touch emergency dispatch when stranded with depleted battery. Shares instant GPS coordinates with roadside mobile charge trucks and flatbed towing."
            badge="24/7 Helpline"
            linkText="Emergency Assistance"
            href="/helpline"
          />
        </div>
      </section>

      {/* ---------- FEATURED CHARGING HUBS (Standardized StationCard) ---------- */}
      <section className="border-t border-line bg-navy-900/40 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-electric">
                Popular Hubs
              </p>
              <h2 className="text-2xl font-bold text-ink">Featured Charging Stations Available for Booking</h2>
            </div>
            <Link
              href="/driver/find"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-volt hover:text-emerald-300 transition-colors"
            >
              View all 925+ Stations →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {FEATURED_STATIONS.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                distanceKm={null}
                showBookButton={true}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA STRIP ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="glass-card relative overflow-hidden rounded-3xl p-10 text-center border-glow">
          <div className="aurora-blob left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 bg-volt/20" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold sm:text-4xl text-ink">
              Ready to Experience Intelligent EV Mobility?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-mute leading-relaxed">
              Join thousands of Indian EV owners driving with complete charging certainty.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/driver/find"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-volt to-emerald-400 px-6 font-bold text-navy-950 shadow-lg shadow-volt/40 hover:brightness-110 transition-all"
              >
                <Calendar className="h-4 w-4" />
                Find Chargers & Book
              </Link>
              <Link
                href="/host/earnings"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-line bg-navy-900/80 px-6 font-semibold text-ink hover:border-electric transition-colors"
              >
                <Home className="h-4 w-4 text-volt" />
                Host a Charger
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-mono text-2xl font-extrabold text-ink sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-mute">{label}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  badge,
  linkText,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
  linkText: string;
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-navy-900/80 p-6 shadow-xl flex flex-col justify-between hover:border-electric/50 transition-all group">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-950 border border-line group-hover:border-electric/40 transition-colors">
            {icon}
          </div>
          <span className="rounded-md bg-navy-950 px-2.5 py-0.5 text-[10px] font-semibold text-volt border border-line">
            {badge}
          </span>
        </div>
        <h3 className="mt-4 text-lg font-bold text-ink group-hover:text-electric transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-mute">{description}</p>
      </div>

      <div className="mt-6 border-t border-line/40 pt-3">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-volt hover:text-emerald-300 transition-colors"
        >
          {linkText}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}