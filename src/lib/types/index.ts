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

export type DataProvenance =
  | "static_seed"
  | "simulated_live"
  | "model_inference";

export interface Coordinates {
  lat: number;
  lng: number;
}

export type VehicleCompatibility =
  | "2-wheeler"
  | "4-wheeler"
  | "both"
  | "unspecified";

export type BatteryChemistry = "LFP" | "NMC";

export interface OccupancyCurvePoint {
  occupants: number;
  consumptionMultiplier: number;
}

export interface BatteryProfile {
  chemistry: BatteryChemistry;
  ratedCapacityKWh: number;
  nominalWhPerKm: number;
  safeMinSocPercent: number;
  safeMaxSocPercent: number;
  desiredChargePercent: number;
  occupancyConsumptionCurve: OccupancyCurvePoint[];
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

  /** Undefined (older seed data) is treated as compatible with every vehicle class. */
  vehicleCompatibility?: VehicleCompatibility;
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

  batteryProfile: BatteryProfile;
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

  /** Total people in the vehicle, including the driver. */
  passengerCount?: number;

  /** Optional cargo load in kg; currently applied as a transparent incremental penalty. */
  cargoLoadKg?: number;
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

  chemistry: BatteryChemistry;

  safeMinSocPercent: number;
  safeMaxSocPercent: number;
  desiredChargePercent: number;

  occupancyCount: number;
  occupancyMultiplier: number;

  cargoLoadKg: number;
  cargoPenaltyWhPerKm: number;

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
  factors: {
    name: string;
    score: number;
    note: string;
  }[];
}

export interface RouteAlternative {
  label: string;
  distanceKm: number;
  drivingMinutes: number;
  energyKWh: number;
  arrivalSocPercent: number;
  chargingStops: number;
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

  /** Other OSRM driving paths that also meet the arrival-SOC floor, when they differ. */
  routeAlternatives: RouteAlternative[];
}

export interface VehicleRecommendation {
  vehicleId: string;
  vehicleName: string;
  vehicleClass: Vehicle["class"];
  reason: string;

  comparison: {
    currentVehicleName: string;
    currentChargingStops: number;
    currentTotalMinutes: number | null;

    recommendedChargingStops: number;
    recommendedTotalMinutes: number | null;
  };
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

  /** Present when a 4-wheeler would handle this trip meaningfully better than the selected 2/3-wheeler. */
  vehicleRecommendation?: VehicleRecommendation;

  /** Present for long trips where an overnight stop is a sensible option, even though the trip is reachable today. */
  overnightPlan?: OvernightPlan;
}

export interface OvernightStay {
  id: string;
  name: string;
  kind: "hotel" | "guest_house" | "motel";

  latitude: number;
  longitude: number;

  /** Distance from the furthest point reachable on current battery. */
  distanceFromReachablePointKm: number;

  /** Nearest online charger within a short walk/drive, if one exists. */
  nearestStation?: {
    id: string;
    name: string;
    distanceKm: number;
  };
}

export interface OvernightPlan {
  reachablePoint: Coordinates;
  reachableDistanceKm: number;
  stays: OvernightStay[];
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

  /** Present on UNREACHABLE when we found overnight stays near the edge of range. */
  overnightPlan?: OvernightPlan;

  /** Present when a 4-wheeler would meaningfully outperform the selected 2/3-wheeler for this trip. */
  vehicleRecommendation?: VehicleRecommendation;
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
  tamilNaduStations: number;
  karnatakaStations: number;
  available: number;
  busy: number;
  offline: number;
  maintenance: number;
  limited: number;

  averageUtilization: number;
  averageQueueMinutes: number;

  predictedDemandIndex: number;
  peakHours: string;

  mostReliable: {
    id: string;
    name: string;
    reliability: number;
  }[];

  likelyBusy: {
    id: string;
    name: string;
    probabilityBusy: number;
  }[];

  utilizationByHour: {
    hour: number;
    utilization: number;
  }[];

  demandForecast: {
    hour: number;
    demand: number;
  }[];

  statusDistribution: {
    status: string;
    count: number;
  }[];

  averageQueueByHour: {
    hour: number;
    minutes: number;
  }[];

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