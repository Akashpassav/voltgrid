# VoltGrid — EV Mobility Intelligence Platform

India-first route intelligence for **electric 2-wheelers**. VoltGrid answers:

> Can I reach my destination confidently, and where should I charge along the way?

This repository is a production-shaped MVP for a Smart India Hackathon demo on the **Chennai → Chengalpattu (GST Road)** corridor.

---

## Project Overview

VoltGrid is not a charger map. It combines three layers:

1. **Data intelligence** — 42 seeded stations, connector metadata, simulated live occupancy and queues.
2. **Optimisation engine** — SOC-constrained corridor routing plus charging-stop ranking that includes **predicted availability at ETA**.
3. **Driver / operator UI** — interactive map, route confidence, infrastructure analytics, demo failure controls.

Default demo trip: Chennai → Chengalpattu, Ather 450X, **68% SOC**. Usable range is below corridor distance, so the engine must insert a stop (typically **VG-014 Tambaram GST Hub**).

---

## Problem Statement

EV riders in India lack a single source of truth for charging infrastructure. Generic route planners do not jointly consider 2W pack size, GST terrain/traffic, charger availability, and charging-stop cost. Range anxiety is a routing problem, not a pin-on-a-map problem.

---

## Solution

Plan the trip with battery as a **hard constraint**. If the destination is unreachable, rank reachable chargers by a weighted score (availability, detour, charge time, energy safety, price), then compose origin → station → destination. If the chosen charger fails, re-solve.

---

## Key Innovation

**Predicted availability is part of the route decision**, not a badge on a marker.

> VoltGrid doesn't just find a charger. It predicts whether the charger will be available when you arrive and makes that prediction part of the route decision.

The closest station is **not** automatically selected. A 2 km detour with 95% predicted availability can beat a 0.5 km detour with 35% availability.

---

## System Architecture

```
┌─────────────────────────────┐
│     DATA INTELLIGENCE       │
│ Chargers • Status • Demand  │
│ Availability • Predictions  │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│     OPTIMIZATION ENGINE     │
│ Route + SOC + Traffic +     │
│ Terrain + Charging + ETA    │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│       USER INTERFACE        │
│ Map • Route • Confidence     │
│ Charger Intelligence        │
└─────────────────────────────┘
```

Pipeline:

```
User trip → RoutingEngine → candidate path
         → EV energy model
         → ChargingProvider stations
         → logistic availability model
         → charging-stop optimiser
         → route confidence
         → recommended route
```

CPO integrations plug in behind `ChargingProvider`. The MVP uses `MockChargingProvider`. Stubs exist for Open Charge Map and OCPI.

---

## Technology Stack

| Layer | Choice |
| --- | --- |
| App | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS, Lucide, Recharts, Leaflet / OSM (Carto dark tiles) |
| Routing | In-process GST corridor graph + Dijkstra (`RoutingEngine` port) |
| Prediction | Explainable logistic regression v1 |
| Live status | In-memory simulation (not a real CPO) |
| Future DB | PostgreSQL + PostGIS (`db/schema.sql`) |

No Mapbox/Google key is required. Leaflet + OSM tiles keep the demo runnable without secrets.

---

## Database Schema

Entities (see `db/schema.sql`):

`vehicles`, `charging_stations` (geography), `chargers`, `station_status`, `availability_history`, `trip_requests`, `routes`, `route_stops`, `predictions`.

The running prototype **does not start Postgres**. Seed data lives in `src/lib/data/*` and is materialised by the simulation store so a judge can `npm run dev` with zero infrastructure.

---

## Routing Algorithm

Base: **Dijkstra** on an undirected GST / OMR / city graph.

Extensions:

- Edge cost uses travel time (highway-class speed × traffic × terrain).
- Battery SOC is a **feasibility filter**: a path is rejected if SOC would fall below the vehicle safety reserve.
- Charging is modelled as a visit to a station node `S-VG-xxx` where SOC is raised to a target.
- Preference (`fastest` / `efficient` / `reliability`) retunes stop weights, not the SOC constraint.

Future: implement `RoutingEngine` with OSRM, Mapbox Directions, or Google Directions without changing the optimiser above it.

---

## Battery Model

Transparent 2W model (shown in the UI):

```
usable kWh = pack_kWh × (SOC% − safety_reserve%) / 100
adjusted Wh/km = base_Wh/km × terrain × traffic × weather
range km = usable kWh ÷ (adjusted Wh/km / 1000)
```

Example (Ather 450X, 68% SOC, 15% reserve, mixed GST factors): confident range is ~45 km vs a ~63 km corridor — a stop is mandatory.

---

## Predictive Availability Model

`src/lib/models/prediction.ts` — logistic regression v1.

Features: current vacancy, historical reliability, hour-of-day (off-peak), queue, connector count, power, weekend-mall demand, ETA uncertainty.

Output: `availability_probability ∈ (0,1)` plus ranked factor contributions. Offline / maintenance stations collapse to ~2%.

Architecture is ML-ready: the same feature vector can train a Random Forest / Gradient Boosting model, and a future LSTM can consume `availability_history`.

---

## Data Sources

| Data | Provenance | UI label |
| --- | --- | --- |
| Station locations, operators, connectors, power, list price | Static seed (plausible GST / OMR sites) | REAL / STATIC DATA |
| Occupancy, queues, failures, demand pulses | Simulation clock (IST, optional frozen 3:40 PM) | SIMULATED LIVE DATA |
| Availability probability | Model inference | model_inference |
| Grid windows | Time-of-day load shape | Grid Intelligence — Prototype Simulation |

**This prototype is not connected to live CPO APIs or DISCOM SCADA.**

---

## Simulation Method

`src/lib/store/simulation.ts`

- Hour-of-day occupancy bias (evening 6–9 PM higher, 10 AM–4 PM lower).
- Demand / traffic multipliers from the demo panel.
- Explicit station failures (`failedStationIds`).
- Optional demo clock frozen at **15:40 IST** for a reproducible presentation.

Judges can trigger: charger failure, high demand, traffic increase, reset.

---

## API Documentation

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/stations` | All stations with live simulated status |
| GET | `/api/stations/:id` | One station |
| GET | `/api/vehicles` | 2W catalogue |
| GET | `/api/places` | Corridor places (`?q=` filters) |
| GET | `/api/route` | Optimise via query params |
| POST | `/api/optimize-route` | Optimise via JSON body |
| POST | `/api/predict-availability` | `{ stationId, etaMinutesFromNow }` |
| POST | `/api/simulate/station-status` | Fail / restore one station |
| POST | `/api/simulate/scenario` | Demo actions + optional trip reroute |
| POST | `/api/reroute` | Fail a station and re-optimise |
| GET | `/api/dashboard/metrics` | Infrastructure / operator KPIs |
| GET | `/api/grid/windows` | Prototype charging windows |

`POST /api/optimize-route` body:

```json
{
  "originId": "chennai",
  "destinationId": "chengalpattu",
  "vehicleId": "ather-450x",
  "socPercent": 68,
  "preference": "fastest"
}
```

---

## Installation

```bash
npm install
cp .env.example .env
npm test
npm run build
npm start
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123). The server binds `0.0.0.0:43123` so the cloud preview proxy can reach it.

For hot reload during development:

```bash
npm run dev
```

---

## Environment Variables

See `.env.example`. Map tiles need **no key**. `MAPBOX_*` and `DATABASE_URL` are placeholders for Phase 2. Do not put secrets in client code; this app does not use `NEXT_PUBLIC_` map tokens.

---

## Running Locally

```bash
npm run build && npm start   # stable preview — 0.0.0.0:43123
npm run dev                  # hot reload
npm test                     # vitest — battery, prediction, scoring, Dijkstra, reroute
npm run lint
```

---

## Demo Scenario

1. Home or Planner: **Chennai → Chengalpattu**, Ather 450X, **68%**, Optimize Route.
2. Results: recommended charger **VG-014 Tambaram GST Hub**, predicted availability, route confidence, explainable “why”.
3. Demo panel: **Simulate charger failure**.
4. VG-014 → OFFLINE. Engine selects an alternative (typically **VG-021 Urapakkam ChargeGrid**).
5. ETA, SOC, stop and confidence update. Banner still says Simulation Mode.

---

## Limitations

- One corridor, one vehicle class (2W), ~42 stations.
- Road graph is a simplified GST/OMR network, not full OSM.
- Availability is a lightweight model on synthetic occupancy, not trained on CPO history.
- Grid hints are time-of-day prototypes, not DISCOM data.
- In-memory simulation resets when the Node process restarts.

---

## Production Integration Roadmap

### Phase 1 — Hackathon MVP (this repo)

Static charger dataset, simulated availability, EV-aware routing, predictive prototype.

### Phase 2 — Pilot

One-city deployment, CPO partnership, OCPI integration, crowdsourced status, real utilisation.

### Phase 3 — Scale

Multiple CPOs and cities, 2W/3W/4W profiles, real-time traffic, demand forecasting, DISCOM hooks.

### Phase 4 — National platform

Highway coverage, fleet optimisation, infrastructure planning, grid-aware smart charging, white-label CPO.

---

## Future Enhancements

- Extract `src/lib/services` into a standalone Express/FastAPI service in front of PostGIS.
- Replace `GraphRoutingEngine` with OSRM.
- Train the availability model on real `availability_history`.
- Add 3W cargo and 4W profiles without changing the optimiser contract.
- OCPI `ChargingProvider` for Statiq / Tata Power / Ather Grid.

---

## Licence

Prototype for demonstration. Station coordinates are plausible planning data, not an official CPO dump.
