export type StationStatus =
  | "available"
  | "busy"
  | "limited"
  | "offline"
  | "maintenance";

export type ConnectorType =
  | "15A Socket"
  | "Bharat AC-001"
  | "Type 2"
  | "CCS2"
  | "GB/T Swap";

export type DemandProfile =
  | "transit"
  | "highway"
  | "mall"
  | "office"
  | "residential"
  | "campus";

export type DrivingPreference = "fastest" | "efficient" | "reliability";

export type DataProvenance = "static_seed" | "simulated_live" | "model_inference";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ChargingStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  operator: string;
  connectorType: ConnectorType;
  powerKW: number;
  totalConnectors: number;
  /** Seeded baseline; live values come from the simulation layer. */
  seedAvailableConnectors: number;
  seedStatus: StationStatus;
  pricePerKWh: number;
  estimatedQueueMinutes: number;
  demandProfile: DemandProfile;
  reliabilityScore: number;
  amenity: string;
  address: string;
  city: string;
  highway: string;
  provenance: DataProvenance;
}

export interface LiveStation extends ChargingStation {
  availableConnectors: number;
  status: StationStatus;
  occupancyRatio: number;
  estimatedQueueMinutes: number;
  lastUpdated: string;
  predictedAvailability: number;
  predictionConfidence: "HIGH" | "MODERATE" | "LOW";
  predictionFactors: PredictionFactor[];
  dataSourceLabel: string;
}

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  class: "2W" | "3W" | "4W";
  batteryKWh: number;
  /** Typical real-world Wh/km for Indian mixed riding. */
  baseConsumptionWhPerKm: number;
  claimedRangeKm: number;
  maxChargeKW: number;
  connectorType: ConnectorType;
  safetyReservePercent: number;
  chargeEfficiency: number;
  weightKg: number;
}

export interface Place {
  id: string;
  name: string;
  label: string;
  city: string;
  latitude: number;
  longitude: number;
  kind: "city" | "landmark" | "junction";
}

export interface GraphNode {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  kind: "waypoint" | "station";
  stationId?: string;
  terrainFactor: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  distanceKm: number;
  /** Free-flow minutes. */
  baseMinutes: number;
  terrainFactor: number;
  trafficFactor: number;
  highway: string;
}

export interface TripRequest {
  originId: string;
  destinationId: string;
  vehicleId: string;
  socPercent: number;
  arrivalSocPercent?: number;
  preference: DrivingPreference;
  weatherFactor?: number;
}

export interface PredictionFactor {
  name: string;
  value: number;
  contribution: number;
  direction: "up" | "down";
}

export interface AvailabilityPrediction {
  stationId: string;
  probability: number;
  expectedArrivalIso: string;
  expectedQueueMinutes: [number, number];
  confidence: "HIGH" | "MODERATE" | "LOW";
  factors: PredictionFactor[];
  model: "logistic_regression_v1";
}

export interface BatteryBreakdown {
  batteryKWh: number;
  socPercent: number;
  safetyReservePercent: number;
  usableEnergyKWh: number;
  baseConsumptionWhPerKm: number;
  terrainFactor: number;
  trafficFactor: number;
  weatherFactor: number;
  adjustedWhPerKm: number;
  estimatedRangeKm: number;
  narrative: string;
}

export interface ChargingStopPlan {
  stationId: string;
  stationName: string;
  operator: string;
  arriveSocPercent: number;
  departSocPercent: number;
  chargeMinutes: number;
  queueMinutes: number;
  energyAddedKWh: number;
  costInr: number;
  detourKm: number;
  detourMinutes: number;
  predictedAvailability: number;
  score: number;
  scoreBreakdown: Record<string, number>;
  whySelected: string;
  connectorType: ConnectorType;
  powerKW: number;
  latitude: number;
  longitude: number;
  etaIso: string;
}

export interface RouteLeg {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  distanceKm: number;
  durationMin: number;
  energyKWh: number;
  socStart: number;
  socEnd: number;
  geometry: Coordinates[];
}

export type ConfidenceLevel = "HIGH" | "MODERATE" | "LOW";

export interface RouteConfidence {
  score: number;
  level: ConfidenceLevel;
  explanation: string;
  factors: { name: string; score: number; note: string }[];
}

export interface OptimizedRoute {
  origin: Place;
  destination: Place;
  vehicle: Vehicle;
  preference: DrivingPreference;
  distanceKm: number;
  drivingMinutes: number;
  chargingMinutes: number;
  queueMinutes: number;
  totalMinutes: number;
  etaIso: string;
  energyKWh: number;
  startSocPercent: number;
  arrivalSocPercent: number;
  minSocPercent: number;
  chargingStops: ChargingStopPlan[];
  legs: RouteLeg[];
  geometry: Coordinates[];
  confidence: RouteConfidence;
  battery: BatteryBreakdown;
  alternativesConsidered: number;
  gridHint: string;
  warnings: string[];
  nodePath: string[];
}

export interface OptimizeResult {
  ok: true;
  route: OptimizedRoute;
  stations: LiveStation[];
  recommendedStationIds: string[];
  dataLabels: {
    stations: string;
    status: string;
    routing: string;
    prediction: string;
    grid: string;
  };
}

export interface OptimizeError {
  ok: false;
  code:
    | "NO_ROUTE"
    | "UNREACHABLE"
    | "NO_CHARGER"
    | "INVALID_VEHICLE"
    | "INVALID_BATTERY"
    | "INVALID_PLACES"
    | "ALL_CHARGERS_DOWN";
  message: string;
  suggestions: string[];
}

export type OptimizeResponse = OptimizeResult | OptimizeError;

export interface SimulationScenario {
  demandMultiplier: number;
  trafficMultiplier: number;
  failedStationIds: string[];
  /** Frozen IST minutes from midnight for reproducible demos. Null = live clock. */
  demoClockMinutes: number | null;
  highDemand: boolean;
  label: string;
}

export interface DashboardMetrics {
  totalChargers: number;
  available: number;
  busy: number;
  offline: number;
  maintenance: number;
  limited: number;
  averageUtilization: number;
  averageQueueMinutes: number;
  predictedDemandIndex: number;
  peakHours: string;
  mostReliable: { id: string; name: string; reliability: number }[];
  likelyBusy: { id: string; name: string; probabilityBusy: number }[];
  utilizationByHour: { hour: number; utilization: number }[];
  demandForecast: { hour: number; demand: number }[];
  statusDistribution: { status: string; count: number }[];
  averageQueueByHour: { hour: number; minutes: number }[];
  operatorAlerts: string[];
  gridWindows: GridWindow[];
}

export interface GridWindow {
  startHour: number;
  endHour: number;
  label: string;
  reason: string;
  relativeLoad: number;
}

export interface StopWeights {
  predictedAvailability: number;
  additionalTravelTime: number;
  chargingTime: number;
  energySafety: number;
  price: number;
}

export const DEFAULT_STOP_WEIGHTS: StopWeights = {
  predictedAvailability: 0.3,
  additionalTravelTime: 0.25,
  chargingTime: 0.2,
  energySafety: 0.15,
  price: 0.1,
};
