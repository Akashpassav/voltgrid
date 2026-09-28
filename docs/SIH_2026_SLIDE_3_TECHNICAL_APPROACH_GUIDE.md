# VoltGrid — SIH 2026 Slide 3: Technical Approach Master Guide

> **Official SIH Presentation Template — Slide 3**: Technologies to be used (programming languages, frameworks, hardware, etc.) and Methodology/Process for implementation (flow charts, architecture, working prototype).  
> **Platform**: VoltGrid EV Mobility & Energy-Aware Routing Intelligence Platform.  
> **Reference Standard**: SIH 2026 Evaluation Rubric & PowerHouse Slide-by-Slide Defense Series.

---

## Executive Summary

Slide 2 made the jury understand **WHAT** the problem and solution are. **Slide 3 has one singular mission: make the jury understand HOW it actually works, and prove that the technical implementation is real, buildable, and grounded in sound engineering.**

According to official SIH evaluators, teams fail Slide 3 in two ways:
1. **Too basic**: Generic technology dumping (*"HTML, CSS, JavaScript, Python"*) with zero justification.
2. **Too technical**: Dense enterprise buzzwords and unreadable 40-box diagrams that a jury cannot scan in 15 seconds.

Winning presentations use the **Justified Tech Stack Formula** (`Technology → What It Does → Why It Is Used`) and anchor the slide around a clear **Input → Process → Decision → Output** architecture diagram supported by verifiable **Proof of Work**.

---

## 1. The 3 Core Sections of Slide 3

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SLIDE 3: TECHNICAL APPROACH SKELETON                            │
├────────────────────────────┬────────────────────────────┬──────────────────────────────┤
│ 1. JUSTIFIED TECH STACK    │ 2. ARCHITECTURE DIAGRAM    │ 3. PROOF OF WORK & EVIDENCE  │
│ (Name it, then justify it) │ (Input ──► Process ──►     │ (Verifiable, real metrics)   │
│ • Next.js 16 + React 19    │   Decision ──► Output)     │ • 54/54 automated tests pass │
│ • Leaflet & CartoDB Dark   │ • Physics simulation logic │ • 925+ verified corridor POIs│
│ • First-Principles Engine  │ • OSRM road geometry       │ • 26 calibrated Indian EVs   │
│ • OSRM Driving Engine      │ • Logistic ML availability │ • <500ms autonomous reroute  │
│ • Logistic ML Predictor    │ • Autonomous reroute loop  │ • GitHub: Akashpassav/voltgrid│
│ • PostgreSQL + PostGIS     │ • Multi-tenant role output │ • Live Evaluator Demo (/demo)│
│ • Zod Strict Security      │                            │                              │
│ • Razorpay + HMAC-SHA256   │                            │                              │
└────────────────────────────┴────────────────────────────┴──────────────────────────────┘
```

---

## 2. Part 1: Tech Stack — Name It, Then Justify It
*(Strictly following the guideline: `TECHNOLOGY → WHAT IT DOES → WHY IT IS USED / WHERE IT FITS`)*

| Technology & Package | What It Does (Plain Language) | Why It Is Used / Where It Fits in VoltGrid |
|---|---|---|
| **Next.js 16 + React 19**<br>*(TypeScript 5, Tailwind v4)* | Full-stack web application framework and rendering engine. | Powers the responsive driver, operator, and host portals with sub-second page transitions, Server Components, and zero compile-time type errors. |
| **Leaflet & CartoDB Dark Tiles**<br>*(react-leaflet, cluster)* | Open-source interactive map rendering and marker clustering. | Visualizes highway corridors and 925+ charging clusters with zero proprietary Google Maps licensing costs and offline raster tile caching. |
| **First-Principles Energy Core**<br>*(Custom TypeScript Physics Engine)* | Mathematical energy simulator calculating real-world Wh/km consumption. | Replaces misleading laboratory ARAI figures by modeling passenger payload mass, pillion frontal aerodynamic drag, and speed-band consumption. |
| **OSRM Driving Engine**<br>*(Open Source Routing Machine)* | High-precision turn-by-turn road network geometry calculator. | Computes true highway curvatures and driving durations across South India, equipped with a 10s timeout and automatic Haversine fallback. |
| **Logistic Regression ML Model**<br>*(Sigmoid Probability Core: $\sigma(\mathbf{w}\cdot\mathbf{x}+b)$)* | Machine learning availability predictor for charging stations. | Solves the "Blind ETA" crisis by forecasting whether a charger will be vacant at the driver's future arrival time using historical venue peak curves. |
| **PostgreSQL + PostGIS**<br>*(Spatial GIST Indexing)* | Production relational database with geospatial extension. | Executes sub-15ms corridor bounding-box queries across 50,000+ chargers using spatial GIST indexes on `GEOGRAPHY(POINT, 4326)`. |
| **Zod 3 / Zod 4 & API Security**<br>*(In-Memory Rate Limiter)* | Strict runtime payload validation and abuse prevention. | Enforces a 128 KiB request cap, regex station ID sanitization, and 120 req/min token-bucket rate limiting to eliminate injection and DoS vectors. |
| **Razorpay Node SDK**<br>*(HMAC-SHA256 Signature Core)* | Payment gateway and slot reservation ledger. | Secures advance charging slot bookings with server-side HMAC-SHA256 cryptographic verification, preventing client-side price tampering. |

---

## 3. Part 2: Flow / Architecture Diagram — The Visual Centerpiece
*(Engineered around: `INPUT → PROCESS → DECISION → OUTPUT`)*

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       VOLTGRID SYSTEM ARCHITECTURE                                        │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                           │
│  [1. USER INPUT]                                                                                          │
│  • Trip Origin & Destination Coordinates (GPS / Nominatim Search)                                         │
│  • Vehicle Selection (26 Indian 2W/4W models: Ather 450X, Ola S1, Tata Nexon EV, Ioniq 5)                 │
│  • Current State of Charge (SoC %), Passenger Count, Cargo Mass (kg), and Preference                      │
│                                           │                                                               │
│                                           ▼                                                               │
│  [2. SECURE INGESTION & PIPELINE PROCESS]                                                                 │
│  • Next.js API Route Handler (`/api/optimize-route`) with strict Zod parsing & 128 KiB body cap           │
│  • Token-Bucket IP Rate Limiting (120 req/min) & Deny-by-Default CORS Origin Guard                         │
│  • OSRM Driving Engine calculates pairwise highway road geometry and driving duration                     │
│  • First-Principles Battery Model: Usable kWh = Pack × (SoC_start - SoC_reserve) / 100                    │
│    Adjusted Wh/km = Base × M_occupancy × M_terrain × M_weather + P_cargo                                  │
│                                           │                                                               │
│                                           ▼                                                               │
│  [3. INTELLIGENCE & DECISION CORE]                                                                        │
│                                           │                                                               │
│                 ┌─────────────────────────┴─────────────────────────┐                                     │
│                 ▼                                                   ▼                                     │
│     Is destination reachable with                       Requires Intermediate                             │
│     user's desired arrival SoC?                         Corridor Charging?                                │
│                 │                                                   │                                     │
│        [YES] ───┘                                          [NO] ────┘                                     │
│          │                                                   │                                            │
│          ▼                                                   ▼                                            │
│   DIRECT ROUTE                                    CORRIDOR CHARGING PIPELINE                              │
│   • 0 Charging stops needed                       • Spatial Bounding Box filters 925+ stations            │
│   • Direct highway polyline                       • findMultiStop() enforces forward progress             │
│   • Battery margin guaranteed                     • Logistic ML Model: P(avail at ETA) = σ(w·x + b)       │
│                                                   • Multi-Attribute Scoring: Detour, Power, Queue, Cost   │
│                                                   • If fully unreachable: Overpass API queries hotels     │
│                                                              │                                            │
│                                           ┌──────────────────┘                                            │
│                                           ▼                                                               │
│  [4. MULTI-STAKEHOLDER OUTPUT & ACTIONS]                                                                  │
│  • DRIVER HUD: Interactive Leaflet map, sequential Charging Stop Cards, battery recharge delta bars       │
│  • SLOT BOOKING: Guaranteed bay reservation with Razorpay HMAC verification & encrypted QR pass           │
│  • OPERATOR CONSOLE: Grid load forecasting, connector queue telemetry, and emergency SOS dispatch queue   │
│  • AUTONOMOUS FAILOVER: If charger trips in-transit, `/api/reroute` re-routes vehicle in <500 ms          │
│                                                                                                           │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Part 3: Proof of Work (Verified Evidence)
*(Real numbers backed by the codebase, not empty claims)*

* **Automated Quality Testing:** **54 out of 54 automated unit tests passing (100%)** in Vitest 3 (`optimizer.test.ts`, `security.test.ts`, `battery-load.test.ts`, `desired-battery.test.ts`, `navigation-swapping-emergency.test.ts`).
* **Active Station Registry:** **925+ verified charging stations** and 2W battery swapping kiosks indexed across Tamil Nadu (NH-38, NH-44) and Bengaluru.
* **Calibrated Vehicle Dataset:** **26 production Indian electric vehicle profiles** (14 two-wheelers, 12 four-wheelers) with tested battery chemistry constraints (LFP vs. NMC).
* **Live Evaluator Sandbox (`/demo`):** Interactive demonstration console enabling evaluators to inject real-time station outages (`fail-recommended`), demand surges (1.6x), and traffic multipliers (1.35x) to verify autonomous re-routing.
* **Open Source Repository:** Verified code repository at `github.com/Akashpassav/voltgrid` with zero ESLint errors and full TypeScript compile validation (`tsc --noEmit`).

---

## 5. Recommended Slide 3 Visual Layout (PowerPoint Wireframe)

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   TECHNICAL APPROACH (SLIDE 3)                                            │
├───────────────────────────────────────────────────┬───────────────────────────────────────────────────────┤
│ 1. JUSTIFIED TECH STACK (NAME & JUSTIFY)          │ 2. ARCHITECTURE DIAGRAM (THE VISUAL CENTERPIECE)      │
│ • Next.js 16 + React 19: Full-stack SSR framework │ ┌───────────────────────────────────────────────────┐ │
│ • Leaflet & CartoDB: Map layer ($0 license costs) │ │ [INPUT] Origin/Dest + 26 EV Presets + Payload/SoC │ │
│ • Physics Core: First-principles payload & drag   │ └─────────────────────────┬─────────────────────────┘ │
│ • OSRM Engine: Real road geometry & travel times  │                           ▼                           │
│ • Logistic ML Model: ETA charger vacancy predictor│ ┌───────────────────────────────────────────────────┐ │
│ • PostgreSQL + PostGIS: Sub-15ms spatial GIST     │ │ [PROCESS] Zod Validation ──► OSRM Road Geometry   │ │
│ • Zod + Rate Limiter: 128 KiB cap DDoS defense    │ │ ──► Physics Simulation (Wh/km Usable Pack Math)   │ │
│ • Razorpay Node SDK: HMAC-SHA256 verified bookings│ └─────────────────────────┬─────────────────────────┘ │
│                                                   │                           ▼                           │
│ 3. PROOF OF WORK & IMPLEMENTATION EVIDENCE        │ ┌───────────────────────────────────────────────────┐ │
│ • 54/54 Automated Unit Tests Passing (Vitest)     │ │ [DECISION] Direct Reachable?                      │ │
│ • 925+ Verified Stations across TN & Bengaluru    │ │ • YES: 0 Stops Direct Route                       │ │
│ • 26 Calibrated Indian EV Profiles (2W & 4W)      │ │ • NO: Bounding Filter ──► Logistic ML ──► Stop Card│ │
│ • <500ms Autonomous Re-routing on Station Outage  │ └─────────────────────────┬─────────────────────────┘ │
│ • GitHub Repository: github.com/Akashpassav/voltgrid│                          ▼                           │
│ • Live Interactive Sandbox: http://localhost:3000 │ ┌───────────────────────────────────────────────────┐ │
│                                                   │ │ [OUTPUT] Interactive Leaflet Map + Delta Bars     │ │
│                                                   │ │ + QR Slot Pass + Operator SOS Dispatch HUD        │ │
│                                                   │ └───────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┴───────────────────────────────────────────────────────┘
```

---

## 6. Verbal Presentation Scripts

### A. 45-Second Elevator Script for Slide 3
> *"Judges, on Slide 3, we show exactly how VoltGrid is built and how data flows through the system.
> 
> Rather than dumping a generic list of technologies, every component in our stack serves a specific role: **Next.js 16 and Leaflet** provide sub-second mapping with zero Google Maps API costs. Our **first-principles physics engine** calculates real-world consumption adjusted for passenger payload and wind drag. And our **logistic regression ML model** predicts charger vacancy at the driver's estimated arrival time.
> 
> As you can see in our architecture diagram: user inputs pass through a strict Zod security boundary, OSRM road geometry is extracted, and our physics engine decides whether the trip can be completed directly or requires multi-stop charging.
> 
> This is not a concept—it is backed by **54 automated unit tests**, **925 verified corridor stations**, and a live simulator where you can test autonomous re-routing today."*

---

### B. 90-Second In-Depth Defense Script for Slide 3
> *"Respected Evaluators, Slide 3 outlines our technical approach, system architecture, and verifiable proof of work.
> 
> **First, looking at our Tech Stack:** We chose each technology for a distinct engineering rationale:
> 1. *Next.js 16 and Leaflet:* Deliver an interactive dark-mode interface with zero proprietary map licensing fees, saving ₹400–₹800 per 100,000 route calls.
> 2. *The Physics & Intelligence Engine:* Our TypeScript physics core computes true energy draw using mass, speed, and aerodynamic drag curves. Our logistic regression model $\sigma(\mathbf{w}\cdot\mathbf{x}+b)$ forecasts whether a charger will actually be vacant when the vehicle arrives.
> 3. *PostgreSQL + PostGIS:* Provides spatial GIST indexing for sub-15 millisecond bounding box searches across 50,000+ stations.
> 4. *Defense-in-Depth Security:* Strict Zod boundary parsing, 128 KiB body size ceilings, and HMAC-SHA256 signature verification for Razorpay slot bookings.
> 
> **Second, observing the Architecture Flow:** 
> Data enters through user selections (coordinates, EV model from our 26 calibrated profiles, starting SoC, and passenger load). The pipeline validates the payload, queries OSRM for true road curvature, and runs the physics model. If the car can reach the destination safely, it returns a 0-stop direct route. If not, the multi-stop engine filters 925+ corridor chargers, scores them based on availability, queue time, power, and detour, and produces a complete charging plan.
> 
> **Third, our Proof of Work:**
> We have 54 automated unit tests running in Vitest with a 100% pass rate. We have indexed 925 real-world stations across Tamil Nadu and Bengaluru. And our live `/demo` sandbox lets you inject charger outages and watch the system autonomously recalculate an alternate route in under 500 milliseconds.
> 
> VoltGrid is fully functional, mathematically defensible, and ready to scale."*

---

## 7. Pre-Submission Self-Audit Checklist

Before presenting Slide 3, confirm your team checks off every item:

* [x] **Tech stack justified**: Every technology is paired with what it does and why it was chosen (no naked lists).
* [x] **No generic buzzwords**: Avoided vague "AI/ML processes data"—specifically named the Logistic Regression availability model and First-Principles physics equations.
* [x] **Architecture diagram clear**: Follows `INPUT → PROCESS → DECISION → OUTPUT` with clean directional arrows.
* [x] **Real proof of work**: Cited 54 passing automated unit tests, 925+ stations, 26 EV models, and working GitHub repo.
* [x] **Defensible against judges**: Every box, formula, and library can be explained and verified directly from the codebase.
