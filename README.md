# VoltGrid — Intelligent EV Energy & Route Optimization Platform

> Real-time, energy-aware navigation and charging intelligence for multi-class electric vehicles across intercity corridors in Tamil Nadu and Southern India.

---

## Overview

**VoltGrid** is an intelligent electric vehicle (EV) route optimization platform engineered to eliminate range anxiety and charging uncertainty. Unlike generic mapping applications that merely display pins on a map or calculate standard driving distances, VoltGrid treats **battery state of charge (SoC)**, **payload dynamics**, **ambient temperature**, and **charging-point availability at estimated time of arrival (ETA)** as first-class constraints in the routing decision.

VoltGrid provides end-to-end routing intelligence for both **2-Wheeler (Light EV)** and **4-Wheeler (Passenger EV)** vehicles, evaluating over **925 real-world charging stations** across Tamil Nadu and Bengaluru to produce deterministic, safe, and legally compliant journey plans.

---

## Problem Statement

Intercity travel in electric vehicles across India presents unique operational challenges:

1. **Pack Size & Range Asymmetry**: A 2-wheeler with a 2.5–3.7 kWh battery pack cannot absorb unexpected highway detours, whereas a 4-wheeler with a 40–80 kWh pack requires high-power DC fast-charging plazas along expressways.
2. **Dynamic Energy Variances**: Real-world energy consumption varies dramatically based on passenger count, pillion aerodynamic drag, cargo weight, road gradients, and cruising speeds. Claimed ARAI/IDC laboratory ranges routinely fail on national highways.
3. **Charger Reliability & Queuing**: Drivers frequently arrive at public chargers only to discover that connectors are offline, occupied with long queues, or incompatible with their vehicle connector.
4. **Lack of Autonomous Recovery**: Existing navigation systems fail to adapt when a chosen charging stop experiences an outage while the driver is in transit.

---

## Solution

VoltGrid solves range anxiety through an integrated, physics-backed optimization pipeline:

- **First-Principles Energy Model**: Non-linear battery consumption calculations factoring in speed, aerodynamic drag, vehicle mass, passenger payload, elevation gradient, and ambient weather.
- **Pairwise Road-Network Routing**: High-precision turn-by-turn road geometry generated via the Open Source Routing Machine (OSRM).
- **Predictive Availability Scoring**: Multi-factor logistic availability forecasting evaluating historical operator uptime, time-of-day demand profiles, queue times, and arrival-time probability.
- **Direct-Feasibility First**: If the destination is safely reachable with the user's desired arrival buffer, all charging detours are bypassed automatically.
- **Sequential Multi-Stop Highway Routing**: Progressive forward stop selection down major corridors (e.g., NH-38, NH-44) ensuring balanced leg distances and continuous destination convergence.
- **Autonomous Outage Recovery**: In-transit monitoring that automatically recalculates alternative routes the moment a recommended charger goes offline.
- **Overnight Stay Recommendations**: If an EV cannot complete a route within a single operating day, the platform queries OpenStreetMap's Overpass API to locate nearby lodging with accessible charging points.

---

## Key Features

- **Multi-Class Vehicle Support**: Calibrated energy characteristics for 26 Indian electric vehicles (14 two-wheelers, 12 four-wheelers).
- **Dynamic Vehicle Spec Card**: Live real-time calculations of usable energy (kWh), nominal consumption (Wh/km), battery chemistry (LFP vs. NMC), and safe range.
- **Contextual Speed Range Guidance**: MoRTH-aligned planning speed bands (Fastest, Energy Efficient, Max Reliability) with statutory limit disclaimers.
- **State-Wide Charging Coverage**: Aggregation of 925+ verified charging stations across Tamil Nadu and Bengaluru.
- **Dynamic Arrival SoC Targets**: Custom destination safety reserve configuration ensuring the vehicle arrives with desired residual charge.
- **Route Confidence Scoring**: Transparent, multi-factor confidence rating (0–100%) incorporating battery margins, corridor charger density, and real-time uptime.
- **Evaluation & Operator Sandbox**: Dedicated presentation console for evaluators to simulate charger outages, traffic spikes, grid demand surges, and autonomous re-routing.
- **Hardened API Security**: Zero-dependency boundary validation via Zod, rate limiting, request-size capping, explicit CORS whitelisting, and strict security headers (CSP, HSTS, X-Frame-Options).

---

## System Architecture

```
                                 ┌─────────────────────────────────┐
                                 │       React 19 / Next.js        │
                                 │     Tailwind CSS + Leaflet      │
                                 └────────────────┬────────────────┘
                                                  │ HTTP / JSON
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │      API Route Handlers         │
                                 │   (/api/optimize-route, etc.)   │
                                 └────────────────┬────────────────┘
                                                  │
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │     API Security & Defense      │
                                 │  • Zod Payload Schema Parsing   │
                                 │  • In-Memory IP Rate Limiting   │
                                 │  • 128 KiB Request-Size Cap     │
                                 │  • Explicit Origin CORS Guard   │
                                 └────────────────┬────────────────┘
                                                  │ Validated TripRequest
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │   VoltGrid Optimization Core   │
                                 │   (src/lib/services/optimize)   │
                                 └──────┬──────────────────┬───────┘
                                        │                  │
                ┌───────────────────────┘                  └───────────────────────┐
                ▼                                                                  ▼
┌──────────────────────────────┐                                    ┌──────────────────────────────┐
│     Domain Energy Models     │                                    │    Network & Infrastructure  │
│ • First-Principles Battery   │                                    │ • Hybrid Charging Provider   │
│ • Vehicle Catalogue (2W/4W)  │                                    │ • 42 Seeded Corridor Hubs    │
│ • Payload & Gradient Loss    │                                    │ • 883 Cached OCM Stations    │
│ • Chemistry Limits (LFP/NMC) │                                    │ • Logistic Availability ML   │
└───────────────┬──────────────┘                                    └──────────────┬───────────────┘
                │                                                                  │
                └───────────────────────┐                  ┌───────────────────────┘
                                        ▼                  ▼
                                 ┌─────────────────────────────────┐
                                 │     External Integrations       │
                                 │ • OSRM (Road Geometry Engine)   │
                                 │ • Open Charge Map (Station POIs)│
                                 │ • Nominatim (Place Geocoding)   │
                                 │ • Overpass (Overnight Stays)    │
                                 └────────────────┬────────────────┘
                                                  │
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │     Optimized EV Route Plan     │
                                 │ Waypoints • Stops • Delta SoC   │
                                 │ Detours • Costs • Confidence %  │
                                 └─────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server components, route handlers, production edge optimizations |
| **Language** | TypeScript 5 | End-to-end static type safety across schemas and models |
| **Styling** | Tailwind CSS 4 | Responsive dark-mode interface, glassmorphism, accessible focus rings |
| **Mapping** | Leaflet + React-Leaflet | Open-source road mapping using Carto dark tile layers |
| **Icons & UI** | Lucide React | Semantic accessible iconography |
| **Validation** | Zod 3 | Strict runtime boundary validation for all API inputs |
| **Testing** | Vitest 3 | Unit, regression, and security testing suite |
| **Road Routing** | OSRM Driving API | High-precision turn-by-turn road geometries and driving durations |
| **Place Search** | OpenStreetMap Nominatim | Bounded geocoding and autocomplete for Tamil Nadu & Karnataka |
| **Charging POIs**| Open Charge Map (OCM) | Statewide charging infrastructure database |
| **Lodging POIs** | OSM Overpass API | Boundary query engine for overnight accommodation near chargers |

---

## EV Routing Architecture

VoltGrid executes routing in four sequential phases:

1. **Direct Feasibility Assessment**:
   The engine requests point-to-point road geometry from OSRM (`routeBetween(origin, destination)`). It passes the full geometry through the battery physics simulator. If the estimated arrival SoC is greater than or equal to the requested arrival reserve, the trip is marked **Direct Reachable** with 0 charging stops.

2. **Directional Candidate Filtering**:
   If charging is required, all 925+ charging stations are filtered using bounding-box spatial checks. Stations that cause excessive backward detours or exceed the current reachable range are eliminated.

3. **Multi-Stop Forward Progress Planning**:
   For multi-stop intercity corridors, `findMultiStop` progressively finds charging stops toward the destination:
   - Enforces forward progress: each selected station must bring the vehicle strictly closer to the destination than the previous station (`distToDest < currentDistToDest - 1.0 km`).
   - Retains a `visitedIds` set to eliminate circular loops.
   - Calculates target departure SoC based on remaining distance, preventing overcharging and battery degradation.

4. **Multi-Attribute Station Scoring**:
   Candidate stations are scored using a weighted multi-criteria function:
   $$\text{Score} = w_a \cdot P_{\text{avail}} - w_d \cdot D_{\text{detour}} - w_t \cdot T_{\text{charge+queue}} + w_r \cdot R_{\text{station}} - w_c \cdot C_{\text{cost}}$$
   Weights dynamically adapt to the user's driving preference.

---

## Battery & Energy Model

Energy modeling uses a deterministic, first-principles physical formulation:

$$\text{Usable Energy (kWh)} = \text{Capacity}_{\text{pack}} \times \frac{\text{SoC}_{\text{start}} - \text{SoC}_{\text{reserve}}}{100}$$

$$\text{Adjusted Rate (Wh/km)} = \text{Base Rate} \times M_{\text{occupancy}} \times M_{\text{terrain}} \times M_{\text{traffic}} \times M_{\text{weather}} + P_{\text{cargo}}$$

$$\text{Effective Range (km)} = \frac{\text{Usable Energy (kWh)} \times 1000}{\text{Adjusted Rate (Wh/km)}}$$

### Parameters:
- **Base Consumption**: Factory-calibrated testing baseline (e.g., 36 Wh/km for Ather 450X, 146 Wh/km for Tata Nexon EV).
- **Occupancy Multiplier**:
  - *2-Wheelers*: 1.00 (solo rider) or 1.15 (rider + pillion passenger with frontal aerodynamic drag).
  - *4-Wheelers*: 1.00 (driver) scaling by +3.5% per additional passenger.
- **Cargo Penalty**: Additive consumption penalty (+0.04 Wh/km per kg of luggage).
- **Terrain Factor**: Evaluates elevation grade along road segments.
- **Chemistry Profile**:
  - **LFP (Lithium Iron Phosphate)**: High thermal stability, allows routine charging to 100%.
  - **NMC (Nickel Manganese Cobalt)**: Higher energy density, recommended charging ceiling of 85–90% to prevent cell wear.

---

## 2-Wheeler vs. 4-Wheeler

| Characteristic | 2-Wheeler (Light EV) | 4-Wheeler (Passenger EV) |
|---|---|---|
| **Typical Battery Capacity** | 2.0 – 5.1 kWh | 24.0 – 82.6 kWh |
| **Typical Effective Range** | 45 – 140 km | 180 – 500 km |
| **Nominal Consumption** | 30 – 45 Wh/km | 120 – 165 Wh/km |
| **Charging Interface** | Standard 15A/16A Industrial AC Socket | CCS-2 DC Fast Charging (30–150 kW) / Type 2 AC |
| **Cruising Sensitivity** | High wind resistance / pillion weight | Expressway speeds (70–100 km/h) / cabin AC load |
| **Speed Range (Fastest)** | 50 – 65 km/h | 70 – 90 km/h |
| **Speed Range (Efficient)** | 40 – 50 km/h | 55 – 70 km/h |
| **Speed Range (Reliable)** | 40 – 55 km/h | 60 – 75 km/h |

---

## Charging Infrastructure

VoltGrid's charging layer combines two integrated datasets via `HybridChargingProvider`:

1. **GST Corridor Seeded Network (42 Stations)**:
   - High-density coverage along the Chennai → Chengalpattu → Villupuram corridor.
   - Live simulated occupancy, dynamic queue modeling, and scenario injection capabilities.
2. **Open Charge Map Statewide Network (883 Stations)**:
   - Real-world POIs spanning Chennai, Coimbatore, Madurai, Salem, Trichy, Tirunelveli, Puducherry, and Bengaluru.
   - Filtered through geographic bounding boxes to ensure data integrity within state borders.
   - Cached locally on disk (`.data/station-coverage.json`) with a 24-hour TTL for offline reliability.

Total active charging points tracked: **925 stations**.

---

## Long-Distance Route Planning

On long journeys where the distance exceeds single-charge vehicle limits:

- **Pairwise Segment Routing**: OSRM routes each leg independently (`Origin → Stop 1`, `Stop 1 → Stop 2`, etc.) to eliminate routing snapping artifacts.
- **Balanced Halfway Search**: Single-stop routes target chargers located near the midpoint of the route.
- **Bounding Box Optimization**: Fast coordinate pre-filtering excludes candidate stations outside the corridor bounding box, reducing route calculation time to under 1 second.
- **Arrival Guarantee**: Ensures the vehicle arrives at every intermediate stop with at least the safety reserve, and at the final destination with the user's requested arrival SoC.

---

## Route Optimization Preferences

The user can choose from three optimization objectives:

1. **Fastest**:
   - Prioritizes minimum total travel time (driving duration + charging turnaround).
   - Favors high-speed highway corridors and maximum kW fast-charging hubs.
2. **Energy Efficient**:
   - Minimizes total energy consumed (Wh/km).
   - Optimizes for aerodynamic efficiency sweet spots to conserve battery and minimize the number of charging stops.
3. **Max Reliability**:
   - Prioritizes charging stations with historically high operational uptime and low queue times.
   - Favors established CPO hubs with multiple charging connectors.

*Regulatory Note*: Planning speed ranges reflect algorithmic energy modeling. Actual road travel must strictly comply with posted Indian road speed limits and traffic conditions.

---

## Geolocation

- **Real-Time Place Search**: Client-side debounced search using OpenStreetMap Nominatim, bounded to Tamil Nadu, Puducherry, and Karnataka.
- **Seeded Landmark Cache**: 19 pre-configured key transportation hubs (Chennai Central, Guindy, Tambaram, Salem, Trichy, Madurai, Bengaluru Silk Board, etc.) for instant zero-latency selection.
- **Direct Coordinate Entry**: Fully supports typing raw latitude and longitude coordinates (`lat, lng`).
- **Current Location**: Integrates browser Geolocation API (`navigator.geolocation`) with reverse geocoding fallback.

---

## Vehicle Catalogue

VoltGrid includes 26 calibrated Indian electric vehicle profiles:

### Two-Wheelers (14 Models)
- Ather 450X (3.7 kWh, NMC)
- Ather 450S (2.9 kWh, NMC)
- Ather Apex (3.7 kWh, NMC)
- Ola S1 Pro Gen 2 (4.0 kWh, NMC)
- Ola S1 Air (3.0 kWh, LFP)
- Ola S1 X+ (3.0 kWh, LFP)
- TVS iQube (3.04 kWh, NMC)
- TVS iQube ST (5.1 kWh, NMC)
- Bajaj Chetak (2.88 kWh, NMC)
- Bajaj Chetak 35 Series (3.5 kWh, NMC)
- Hero Vida V1 Pro (3.94 kWh, NMC)
- Revolt RV400 (3.24 kWh, NMC)
- Simple One (5.0 kWh, NMC)
- Ampere Magnus EX (2.3 kWh, NMC)

### Four-Wheelers (12 Models)
- Tata Nexon EV Long Range (40.5 kWh, LFP)
- Tata Punch EV (25.0 kWh, LFP)
- Tata Curvv EV (55.0 kWh, LFP)
- Tata Tiago EV (24.0 kWh, LFP)
- Mahindra XUV400 EV (39.4 kWh, NMC)
- Mahindra XUV 3XO EV (34.5 kWh, LFP)
- Mahindra BE 6 (59.0 kWh, LFP)
- MG ZS EV (50.3 kWh, LFP)
- Maruti Suzuki e Vitara (49.0 kWh, LFP)
- Hyundai Ioniq 5 (72.6 kWh, NMC)
- Kia EV6 (77.4 kWh, NMC)
- BYD Seal (82.56 kWh, LFP)

---

## Overnight Stay Recommendations

When an EV with a small battery pack attempts an extreme distance that cannot be completed within a single operating day (e.g., Chennai to Madurai on a 2W without sufficient intermediate charging points):

- The engine determines the furthest point safely reached before complete battery depletion.
- It queries the **OpenStreetMap Overpass API** within an 8 km radius of that point for verified accommodations (`tourism=hotel`, `tourism=guest_house`, `tourism=motel`).
- Identifies the nearest online charging station within 6 km of each lodging option.
- Gracefully degrades: if the Overpass API is unavailable or times out, the engine returns an empty lodging list without crashing the primary route calculation.

---

## Operator / Demo Controls

A dedicated collapsible **Operator / Evaluator Sandbox** allows technical evaluators and judges to test real-time system behaviors:

1. **Simulate Outage (`fail-recommended`)**: Marks the recommended charger as offline in memory. Triggers immediate autonomous client-side re-routing.
2. **Corridor Surge Demand (`high-demand`)**: Injects a 1.6x multiplier on corridor charging demand to demonstrate predictive queue changes.
3. **Traffic Congestion (`traffic`)**: Injects a 1.35x traffic multiplier, showing the impact on Wh/km energy consumption and travel time.
4. **Reset Simulation (`reset`)**: Restores all chargers, traffic, and grid variables to baseline operational status.
5. **Freeze 3:40 PM IST (`demo-clock`)**: Sets a deterministic time of day for repeatable presentation demonstrations.
6. **Live IST Clock (`live-clock`)**: Resynchronizes availability predictions with current system time.

---

## APIs & External Services

| Service | Protocol | Endpoint | Auth | Purpose | Fallback Behavior |
|---|---|---|---|---|---|
| **OSRM Driving** | HTTPS | `https://router.project-osrm.org` | None | Turn-by-turn road geometry and duration | Straight-line haversine distance + 10s timeout |
| **OSM Nominatim** | HTTPS | `https://nominatim.openstreetmap.org` | None | Location autocomplete & geocoding | Local seeded place registry |
| **Open Charge Map** | HTTPS | `https://api.openchargemap.io/v3/poi` | API Key (`OCM_API_KEY`) | Regional charging station POIs | Disk cache (`.data/station-coverage.json`) |
| **OSM Overpass** | HTTPS | `https://overpass-api.de/api/interpreter` | None | Nearby overnight accommodations | Empty lodging array (non-blocking) |
| **Carto Dark Tiles** | HTTPS | `https://basemaps.cartocdn.com` | None | Dark-mode Leaflet base map tiles | Built-in Leaflet layer controls |

---

## API Safety & Security

VoltGrid implements defense-in-depth principles across its public and internal API surfaces:

- **Zod Runtime Validation**: Every incoming payload is validated against strict Zod schemas before reaching business logic. Unknown or malicious fields are rejected with HTTP 400.
- **Request Size Capping**: JSON request bodies are strictly capped at 128 KiB to prevent memory exhaustion and Denial of Service (DoS) attacks.
- **In-Memory Rate Limiting**: Token-bucket rate limiting enforces a baseline limit of 120 requests/minute per client, with stricter limits on re-routing and simulation endpoints. Returns HTTP 429 with `Retry-After`.
- **Server-Side Secrets**: `OCM_API_KEY` is stored strictly in server-side environment variables and is never exposed in client bundles or public responses.
- **CORS Whitelisting**: Strict origin validation. Only the configured `NEXT_PUBLIC_APP_URL` and local development origins are permitted. Wildcards (`*`) are prohibited.
- **Security Headers**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy (CSP)`: Restricts script, style, image, and network connect sources strictly to authorized service hosts.

---

## Data Flow

```
User submits trip parameters in TripForm
  │
  ├─► [Client-Side Validation]: Checks for non-empty origin & destination
  │
  └─► POST /api/optimize-route
        │
        ├─► [Security Middleware]: Validates Origin header (CORS) & IP rate limit
        ├─► [JSON Guard]: Caps body at 128 KiB, verifies application/json Content-Type
        ├─► [Zod Schema]: Parses and validates originId, destinationId, vehicleId, etc.
        │
        ▼
   Optimizer Core
        │
        ├─► Resolves Vehicle profile from catalogue (battery kWh, base Wh/km, chemistry)
        ├─► Calculates initial usable energy & battery safety reserve
        ├─► Calls OSRM for direct road path between origin and destination
        ├─► Simulates energy consumption over full geometry
        │
        ├─► Is destination reachable with required arrival SoC?
        │     ├─► YES: Return direct route (0 charging stops)
        │     └─► NO:
        │           ├─► Filter 925+ stations by corridor bounding box
        │           ├─► Score stations by detour, availability, queue, power, cost
        │           ├─► Multi-stop sequential planning down corridor
        │           ├─► If completely unreachable: Query Overpass for overnight stays
        │
        ▼
   HTTP 200 JSON Response
        │
        ▼
   Frontend Presentation
        ├─► Renders interactive Leaflet map with colored route polyline & stops
        ├─► Displays route summary KPIs (ETA, distance, arrival SoC, stop count)
        ├─► Renders sequential ChargingStopCards with visual recharge delta bars
        ├─► Renders first-principles BatteryExplainer physics equation
        └─► Displays Route Confidence score and vehicle recommendations
```

---

## Project Structure

```
voltgrid/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Automated CI quality and security workflow
├── .data/
│   └── station-coverage.json      # Persistent local cache of 883 OCM stations
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # API Route Handlers (optimize, reroute, stations, etc.)
│   │   ├── demo/                  # Evaluator demonstration panel
│   │   ├── infrastructure/        # Charging network analytics dashboard
│   │   ├── operator/              # Operator & grid intelligence view
│   │   ├── planner/               # Trip planning view
│   │   ├── route/                 # Route results, interactive map, and cards
│   │   ├── stations/[id]/         # Station detail and availability prediction
│   │   ├── layout.tsx             # Root layout with header and simulation banner
│   │   └── page.tsx               # Multi-class EV landing page
│   ├── components/
│   │   ├── demo/                  # DemoControls component
│   │   ├── layout/                # Header, Footer, Logo, SimBanner
│   │   ├── map/                   # RouteMap, MapCanvas (Leaflet dynamic import)
│   │   ├── trip/                  # TripForm, ChargingStopCard, BatteryExplainer, etc.
│   │   └── ui/                    # Button, Card, Badge, InfoTooltip
│   └── lib/
│       ├── algorithms/            # Charging stop ranking and Dijkstra graph
│       ├── api/                   # Security utilities (Zod parsing, rate limiting, CORS)
│       ├── client/                # Client API helpers and session persistence
│       ├── data/                  # Vehicles (26), Stations (42), Places (19)
│       ├── hooks/                 # useLocationSearch hook (Nominatim autocomplete)
│       ├── models/                # Battery physics and route confidence models
│       ├── services/              # Optimize, OSRM, Coverage, Stays, Dashboard
│       ├── store/                 # In-memory simulation state
│       └── types/                 # TypeScript domain interfaces
├── next.config.ts                 # Security headers and CSP configuration
├── package.json                   # Dependencies and scripts
└── vitest.config.ts               # Test suite configuration
```

---

## Environment Variables

Copy `.env.example` to `.env.local` to configure optional server variables:

```bash
# Public application URL for CORS whitelist
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Set to 1 only when running behind a trusted reverse proxy (e.g. Nginx, Cloudflare)
TRUST_PROXY=

# Server-only Open Charge Map API key for fresh statewide POI fetching
OCM_API_KEY=

# Optional routing token placeholders
MAPBOX_ACCESS_TOKEN=
DATABASE_URL=
```

> **Security Rule**: Secrets like `OCM_API_KEY` must never be prefixed with `NEXT_PUBLIC_`. Variables without `NEXT_PUBLIC_` are kept strictly on the Node.js server and are never bundled into client JavaScript.

---

## Testing

VoltGrid includes a comprehensive automated test suite powered by Vitest:

```bash
npm test
```

### Test Coverage:
- **`optimizer.test.ts` (31 tests)**: Validates single-stop insertion, multi-stop planning, forward directional convergence, midpoint pre-filtering, and out-of-range fallbacks.
- **`security.test.ts` (7 tests)**: Validates Zod input parsing, 128 KiB request-size limits, rate-limit blocking (HTTP 429), CORS origin checks, and station ID sanitization.
- **`battery-load.test.ts` (4 tests)**: Tests payload consumption multipliers, pillion aerodynamic drag, and luggage penalties.
- **`desired-battery.test.ts` (2 tests)**: Verifies destination arrival battery constraints and manufacturer safety reserves.

Total: **44 unit tests passing (100%)**.

---

## CI/CD

Continuous Integration is enforced via GitHub Actions on every push and pull request (`.github/workflows/ci.yml`):

1. **Clean Installation**: `npm ci` with reproducible dependency locks.
2. **Supply Chain Audit**: `npm audit --audit-level=high` blocks builds on critical package vulnerabilities.
3. **Static Typecheck**: `tsc --noEmit` validates TypeScript types across the entire project.
4. **Code Quality**: `eslint` validates adherence to code quality and style rules.
5. **Automated Tests**: `vitest run` executes all 44 unit tests.
6. **Production Build**: `next build` validates that all static and dynamic pages compile successfully.

---

## Installation & Running

### Prerequisites
- Node.js 20.x or 22.x
- npm 10.x+

### Setup
```bash
# 1. Clone repository
git clone https://github.com/Akashpassav/voltgrid.git
cd voltgrid

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local

# 4. Verify test suite
npm test

# 5. Build and launch
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Considerations

While VoltGrid is fully functional as an architectural prototype, deploying to high-traffic production environments would benefit from:

- **Self-Hosted OSRM Instance**: Hosting dedicated OSRM or Valhalla routing containers on internal infrastructure to eliminate reliance on the public demo instance.
- **Centralized Rate Limiting**: Transitioning the current in-process memory rate limiter to a shared Redis store for multi-instance horizontal scaling.
- **OCPI Protocol Integration**: Connecting to live Charge Point Operator (CPO) backends via the Open Charge Point Interface (OCPI) protocol for live, real-time connector occupancy.
- **Authentication & RBAC**: Implementing enterprise identity management (OAuth 2.0 / OIDC) for operator management views.
- **Web Application Firewall (WAF)**: Deploying behind Cloudflare or AWS WAF for edge DDoS mitigation and TLS termination.

---

## Limitations

- **Elevation Model**: Road gradient modeling is calibrated for major highway corridors; mountainous ghat sections currently use regional estimates.
- **Public OSRM Demo Server**: Road routing uses the public project-osrm.org instance, which is subject to network latency and external availability.
- **Static Station Provenance**: While charging station locations and power ratings are real (sourced from Open Charge Map), real-time connector status is simulated for demonstration purposes.

---

## License

MIT License. Designed and developed for energy-aware EV mobility intelligence.