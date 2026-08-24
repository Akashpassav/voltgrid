-- VoltGrid production schema (PostgreSQL + PostGIS)
-- The hackathon MVP runs on an in-memory store with the same entities.
-- Apply this when moving to a managed Postgres instance.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE vehicles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  class TEXT NOT NULL CHECK (class IN ('2W', '3W', '4W')),
  battery_kwh NUMERIC(6,2) NOT NULL,
  base_consumption_wh_per_km NUMERIC(6,2) NOT NULL,
  claimed_range_km INTEGER NOT NULL,
  max_charge_kw NUMERIC(6,2) NOT NULL,
  connector_type TEXT NOT NULL,
  safety_reserve_percent NUMERIC(5,2) NOT NULL,
  charge_efficiency NUMERIC(4,3) NOT NULL,
  weight_kg INTEGER NOT NULL
);

CREATE TABLE charging_stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  operator TEXT NOT NULL,
  connector_type TEXT NOT NULL,
  power_kw NUMERIC(6,2) NOT NULL,
  total_connectors INTEGER NOT NULL,
  price_per_kwh NUMERIC(6,2) NOT NULL,
  demand_profile TEXT NOT NULL,
  reliability_score NUMERIC(4,3) NOT NULL,
  amenity TEXT,
  address TEXT,
  city TEXT,
  highway TEXT,
  provenance TEXT NOT NULL DEFAULT 'static_seed'
);

CREATE INDEX charging_stations_gix ON charging_stations USING GIST (location);

CREATE TABLE chargers (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL REFERENCES charging_stations(id),
  connector_type TEXT NOT NULL,
  power_kw NUMERIC(6,2) NOT NULL,
  ocpi_evse_id TEXT
);

CREATE TABLE station_status (
  station_id TEXT PRIMARY KEY REFERENCES charging_stations(id),
  status TEXT NOT NULL,
  available_connectors INTEGER NOT NULL,
  occupancy_ratio NUMERIC(5,4) NOT NULL,
  estimated_queue_minutes INTEGER NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'simulation'
);

CREATE TABLE availability_history (
  id BIGSERIAL PRIMARY KEY,
  station_id TEXT NOT NULL REFERENCES charging_stations(id),
  captured_at TIMESTAMPTZ NOT NULL,
  occupancy_ratio NUMERIC(5,4) NOT NULL,
  queue_minutes INTEGER NOT NULL,
  available_connectors INTEGER NOT NULL
);

CREATE INDEX availability_history_station_time ON availability_history (station_id, captured_at);

CREATE TABLE trip_requests (
  id UUID PRIMARY KEY,
  origin_id TEXT NOT NULL,
  destination_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
  soc_percent NUMERIC(5,2) NOT NULL,
  arrival_soc_percent NUMERIC(5,2),
  preference TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE routes (
  id UUID PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES trip_requests(id),
  distance_km NUMERIC(8,2) NOT NULL,
  total_minutes INTEGER NOT NULL,
  energy_kwh NUMERIC(8,3) NOT NULL,
  arrival_soc NUMERIC(5,2) NOT NULL,
  confidence_score INTEGER NOT NULL,
  geometry GEOGRAPHY(LINESTRING, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE route_stops (
  id BIGSERIAL PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES routes(id),
  station_id TEXT NOT NULL REFERENCES charging_stations(id),
  sequence INTEGER NOT NULL,
  arrive_soc NUMERIC(5,2) NOT NULL,
  depart_soc NUMERIC(5,2) NOT NULL,
  score NUMERIC(6,2) NOT NULL,
  why_selected TEXT NOT NULL
);

CREATE TABLE predictions (
  id BIGSERIAL PRIMARY KEY,
  station_id TEXT NOT NULL REFERENCES charging_stations(id),
  eta TIMESTAMPTZ NOT NULL,
  availability_probability NUMERIC(5,4) NOT NULL,
  confidence TEXT NOT NULL,
  model TEXT NOT NULL,
  factors JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
