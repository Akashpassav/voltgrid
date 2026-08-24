import type { ChargingStation, ConnectorType, DemandProfile, StationStatus } from "@/lib/types";

interface Seed {
  id: string;
  name: string;
  lat: number;
  lng: number;
  operator: string;
  connector: ConnectorType;
  powerKW: number;
  total: number;
  available: number;
  status: StationStatus;
  price: number;
  queue: number;
  profile: DemandProfile;
  reliability: number;
  amenity: string;
  address: string;
  city: string;
  highway: string;
}

const SEED: Seed[] = [
  { id: "VG-001", name: "Chennai Central EV Hub", lat: 13.0827, lng: 80.2707, operator: "Tata Power EZ Charge", connector: "Type 2", powerKW: 7.2, total: 6, available: 4, status: "available", price: 16, queue: 4, profile: "transit", reliability: 0.86, amenity: "Railway station", address: "EVS Road, Park Town", city: "Chennai", highway: "Inner city" },
  { id: "VG-002", name: "T. Nagar Pondy Bazaar Charge", lat: 13.0418, lng: 80.2337, operator: "Statiq", connector: "15A Socket", powerKW: 3.3, total: 4, available: 1, status: "busy", price: 14, queue: 18, profile: "mall", reliability: 0.64, amenity: "Shopping street", address: "Thyagaraya Road", city: "Chennai", highway: "Inner city" },
  { id: "VG-003", name: "Nandanam VoltGrid Hub", lat: 13.0524, lng: 80.2501, operator: "VoltGrid Demo CPO", connector: "Type 2", powerKW: 7.2, total: 4, available: 3, status: "available", price: 12, queue: 3, profile: "office", reliability: 0.9, amenity: "Office cluster", address: "Anna Salai, Nandanam", city: "Chennai", highway: "Anna Salai" },
  { id: "VG-004", name: "Adyar Depot Charging", lat: 13.0063, lng: 80.2574, operator: "Ather Grid", connector: "15A Socket", powerKW: 3.3, total: 8, available: 5, status: "available", price: 11, queue: 6, profile: "transit", reliability: 0.88, amenity: "Bus depot", address: "LB Road, Adyar", city: "Chennai", highway: "Inner city" },
  { id: "VG-005", name: "Anna Nagar Tower Charge", lat: 13.0878, lng: 80.2102, operator: "Magenta ChargeGrid", connector: "Bharat AC-001", powerKW: 3.3, total: 3, available: 2, status: "available", price: 13, queue: 5, profile: "residential", reliability: 0.81, amenity: "Apartment plaza", address: "2nd Avenue, Anna Nagar", city: "Chennai", highway: "Inner city" },
  { id: "VG-006", name: "Velachery Vijayanagar Hub", lat: 12.9758, lng: 80.221, operator: "ChargeZone", connector: "Type 2", powerKW: 7.2, total: 4, available: 2, status: "limited", price: 14, queue: 9, profile: "mall", reliability: 0.72, amenity: "Phoenix Mall access", address: "Velachery Main Road", city: "Chennai", highway: "Inner city" },
  { id: "VG-007", name: "Guindy Industrial Estate", lat: 13.0067, lng: 80.2206, operator: "Tata Power EZ Charge", connector: "CCS2", powerKW: 25, total: 4, available: 1, status: "busy", price: 18, queue: 14, profile: "office", reliability: 0.77, amenity: "Industrial estate", address: "SIDCO Industrial Estate", city: "Chennai", highway: "GST Road" },
  { id: "VG-008", name: "Kathipara Junction", lat: 13.007, lng: 80.201, operator: "BPCL", connector: "Type 2", powerKW: 7.2, total: 2, available: 0, status: "maintenance", price: 15, queue: 0, profile: "highway", reliability: 0.58, amenity: "Fuel retail", address: "Kathipara flyover base", city: "Chennai", highway: "GST Road" },
  { id: "VG-009", name: "Chennai Airport Arrivals", lat: 12.9941, lng: 80.1707, operator: "Statiq", connector: "Type 2", powerKW: 22, total: 6, available: 2, status: "limited", price: 17, queue: 12, profile: "transit", reliability: 0.76, amenity: "Airport", address: "T2 arrivals curb", city: "Chennai", highway: "GST Road" },
  { id: "VG-010", name: "St. Thomas Mount Metro", lat: 13.0008, lng: 80.197, operator: "Ather Grid", connector: "15A Socket", powerKW: 3.3, total: 6, available: 2, status: "limited", price: 10, queue: 11, profile: "transit", reliability: 0.74, amenity: "Metro station", address: "GST Road, St. Thomas Mount", city: "Chennai", highway: "GST Road" },
  { id: "VG-011", name: "Pallavaram GST Charge", lat: 12.9675, lng: 80.1491, operator: "IOCL", connector: "Bharat AC-001", powerKW: 3.3, total: 3, available: 1, status: "limited", price: 12, queue: 14, profile: "highway", reliability: 0.71, amenity: "Fuel station", address: "GST Road, Pallavaram", city: "Pallavaram", highway: "GST Road" },
  { id: "VG-012", name: "Chromepet Market Hub", lat: 12.9516, lng: 80.1462, operator: "ChargeZone", connector: "15A Socket", powerKW: 3.3, total: 3, available: 1, status: "limited", price: 11, queue: 11, profile: "mall", reliability: 0.69, amenity: "Market street", address: "GST Road, Chromepet", city: "Chromepet", highway: "GST Road" },
  { id: "VG-013", name: "Tambaram Sanatorium Stop", lat: 12.933, lng: 80.122, operator: "Magenta ChargeGrid", connector: "15A Socket", powerKW: 3.3, total: 2, available: 1, status: "limited", price: 13, queue: 16, profile: "transit", reliability: 0.61, amenity: "Roadside bay", address: "GST Road, Sanatorium", city: "Tambaram", highway: "GST Road" },
  { id: "VG-014", name: "Tambaram GST Hub", lat: 12.9249, lng: 80.104, operator: "VoltGrid Demo CPO", connector: "Type 2", powerKW: 7.2, total: 4, available: 3, status: "available", price: 12, queue: 5, profile: "transit", reliability: 0.93, amenity: "Highway hub + cafe", address: "GST Road, Tambaram", city: "Tambaram", highway: "GST Road" },
  { id: "VG-015", name: "Tambaram West Bypass", lat: 12.922, lng: 80.088, operator: "Statiq", connector: "Bharat AC-001", powerKW: 3.3, total: 2, available: 1, status: "limited", price: 11, queue: 16, profile: "highway", reliability: 0.62, amenity: "Bypass lay-by", address: "Mudichur Road", city: "Tambaram", highway: "Bypass" },
  { id: "VG-016", name: "Perungalathur Stop", lat: 12.9054, lng: 80.0947, operator: "BPCL", connector: "15A Socket", powerKW: 0.8, total: 2, available: 1, status: "available", price: 9, queue: 7, profile: "highway", reliability: 0.66, amenity: "Fuel pump", address: "GST Road, Perungalathur", city: "Perungalathur", highway: "GST Road" },
  { id: "VG-017", name: "Vandalur Zoo Gate", lat: 12.8913, lng: 80.081, operator: "Tata Power EZ Charge", connector: "Type 2", powerKW: 7.2, total: 3, available: 1, status: "busy", price: 14, queue: 18, profile: "mall", reliability: 0.62, amenity: "Zoo / weekend traffic", address: "GST Road, Vandalur", city: "Vandalur", highway: "GST Road" },
  { id: "VG-018", name: "Urapakkam Highway Charge", lat: 12.87, lng: 80.075, operator: "ChargeZone", connector: "Bharat AC-001", powerKW: 3.3, total: 2, available: 1, status: "limited", price: 12, queue: 9, profile: "highway", reliability: 0.7, amenity: "Highway retail", address: "GST Road, Urapakkam", city: "Urapakkam", highway: "GST Road" },
  { id: "VG-019", name: "Guduvancheri Bus Stand", lat: 12.8456, lng: 80.0603, operator: "Ather Grid", connector: "15A Socket", powerKW: 3.3, total: 6, available: 3, status: "available", price: 10, queue: 7, profile: "transit", reliability: 0.83, amenity: "Bus stand", address: "GST Road, Guduvancheri", city: "Guduvancheri", highway: "GST Road" },
  { id: "VG-020", name: "SRM University Gate", lat: 12.823, lng: 80.044, operator: "Statiq", connector: "Type 2", powerKW: 7.2, total: 8, available: 5, status: "available", price: 11, queue: 4, profile: "campus", reliability: 0.85, amenity: "Campus", address: "Potheri, Kattankulathur", city: "Kattankulathur", highway: "GST Road" },
  { id: "VG-021", name: "Urapakkam ChargeGrid", lat: 12.868, lng: 80.0742, operator: "VoltGrid Demo CPO", connector: "Type 2", powerKW: 7.2, total: 4, available: 3, status: "available", price: 12, queue: 6, profile: "highway", reliability: 0.9, amenity: "Highway plaza", address: "GST Road, Urapakkam", city: "Urapakkam", highway: "GST Road" },
  { id: "VG-022", name: "Maraimalai Nagar SIPCOT", lat: 12.791, lng: 80.018, operator: "Tata Power EZ Charge", connector: "CCS2", powerKW: 30, total: 4, available: 2, status: "available", price: 16, queue: 8, profile: "office", reliability: 0.82, amenity: "Industrial park", address: "SIPCOT, MM Nagar", city: "Maraimalai Nagar", highway: "GST Road" },
  { id: "VG-023", name: "Singaperumal Koil Stop", lat: 12.7615, lng: 80.002, operator: "IOCL", connector: "Bharat AC-001", powerKW: 3.3, total: 2, available: 2, status: "available", price: 12, queue: 5, profile: "highway", reliability: 0.76, amenity: "Fuel station", address: "GST Road, SP Koil", city: "Singaperumal Koil", highway: "GST Road" },
  { id: "VG-024", name: "Mahindra City Gate", lat: 12.737, lng: 80.015, operator: "ChargeZone", connector: "Type 2", powerKW: 22, total: 4, available: 0, status: "offline", price: 15, queue: 0, profile: "office", reliability: 0.55, amenity: "Township gate", address: "Mahindra World City", city: "Chengalpattu", highway: "Spur" },
  { id: "VG-025", name: "Paranur Level Cross", lat: 12.71, lng: 79.99, operator: "Magenta ChargeGrid", connector: "15A Socket", powerKW: 3.3, total: 2, available: 1, status: "available", price: 11, queue: 6, profile: "highway", reliability: 0.71, amenity: "Roadside", address: "GST Road, Paranur", city: "Paranur", highway: "GST Road" },
  { id: "VG-026", name: "Chengalpattu New Bus Stand", lat: 12.6819, lng: 79.9832, operator: "Ather Grid", connector: "15A Socket", powerKW: 3.3, total: 6, available: 4, status: "available", price: 10, queue: 4, profile: "transit", reliability: 0.88, amenity: "Bus stand", address: "New Bus Stand Road", city: "Chengalpattu", highway: "GST Road" },
  { id: "VG-027", name: "Chengalpattu Railway EV", lat: 12.692, lng: 79.975, operator: "Tata Power EZ Charge", connector: "Type 2", powerKW: 7.2, total: 3, available: 2, status: "available", price: 13, queue: 5, profile: "transit", reliability: 0.84, amenity: "Railway station", address: "Railway approach road", city: "Chengalpattu", highway: "Inner city" },
  { id: "VG-028", name: "Chengalpattu GST South", lat: 12.67, lng: 79.97, operator: "BPCL", connector: "Bharat AC-001", powerKW: 3.3, total: 2, available: 2, status: "available", price: 12, queue: 3, profile: "highway", reliability: 0.78, amenity: "Fuel retail", address: "GST Road south", city: "Chengalpattu", highway: "GST Road" },
  { id: "VG-029", name: "Thiruvanmiyur Junction", lat: 12.985, lng: 80.2594, operator: "Ather Grid", connector: "15A Socket", powerKW: 3.3, total: 5, available: 3, status: "available", price: 11, queue: 6, profile: "residential", reliability: 0.8, amenity: "Beach road", address: "Lattice Bridge Road", city: "Chennai", highway: "ECR" },
  { id: "VG-030", name: "OMR Perungudi Charge", lat: 12.9611, lng: 80.2432, operator: "Statiq", connector: "Type 2", powerKW: 7.2, total: 4, available: 2, status: "limited", price: 15, queue: 10, profile: "office", reliability: 0.73, amenity: "IT corridor", address: "OMR, Perungudi", city: "Chennai", highway: "OMR" },
  { id: "VG-031", name: "Sholinganallur OMR Hub", lat: 12.9009, lng: 80.2279, operator: "Tata Power EZ Charge", connector: "CCS2", powerKW: 60, total: 8, available: 2, status: "busy", price: 18, queue: 22, profile: "office", reliability: 0.68, amenity: "IT park cluster", address: "OMR, Sholinganallur", city: "Chennai", highway: "OMR" },
  { id: "VG-032", name: "Kelambakkam Charge", lat: 12.8142, lng: 80.2304, operator: "ChargeZone", connector: "Type 2", powerKW: 7.2, total: 3, available: 2, status: "available", price: 13, queue: 5, profile: "highway", reliability: 0.77, amenity: "Town junction", address: "OMR, Kelambakkam", city: "Kelambakkam", highway: "OMR" },
  { id: "VG-033", name: "Navalur Gateway", lat: 12.851, lng: 80.226, operator: "Magenta ChargeGrid", connector: "Type 2", powerKW: 22, total: 4, available: 1, status: "busy", price: 16, queue: 15, profile: "mall", reliability: 0.7, amenity: "Retail / apartments", address: "OMR, Navalur", city: "Chennai", highway: "OMR" },
  { id: "VG-034", name: "Porur Mount Poonamallee", lat: 13.034, lng: 80.156, operator: "Statiq", connector: "Bharat AC-001", powerKW: 3.3, total: 3, available: 2, status: "available", price: 12, queue: 6, profile: "office", reliability: 0.75, amenity: "Hospital corridor", address: "Mount Poonamallee Road", city: "Chennai", highway: "Inner city" },
  { id: "VG-035", name: "Tambaram Eastern Bypass", lat: 12.93, lng: 80.13, operator: "IOCL", connector: "15A Socket", powerKW: 3.3, total: 2, available: 1, status: "limited", price: 10, queue: 12, profile: "highway", reliability: 0.64, amenity: "Bypass", address: "Velachery Tambaram Road", city: "Tambaram", highway: "Bypass" },
  { id: "VG-036", name: "ECR Injambakkam", lat: 12.916, lng: 80.258, operator: "BPCL", connector: "Type 2", powerKW: 7.2, total: 2, available: 0, status: "maintenance", price: 14, queue: 0, profile: "mall", reliability: 0.52, amenity: "Beach road", address: "ECR, Injambakkam", city: "Chennai", highway: "ECR" },
  { id: "VG-037", name: "Pallikaranai Marsh Road", lat: 12.934, lng: 80.207, operator: "ChargeZone", connector: "15A Socket", powerKW: 3.3, total: 2, available: 1, status: "available", price: 11, queue: 7, profile: "residential", reliability: 0.69, amenity: "Neighbourhood", address: "Velachery–Tambaram Road", city: "Chennai", highway: "Inner city" },
  { id: "VG-038", name: "Medavakkam Junction", lat: 12.917, lng: 80.192, operator: "Ather Grid", connector: "15A Socket", powerKW: 3.3, total: 4, available: 3, status: "available", price: 10, queue: 5, profile: "residential", reliability: 0.81, amenity: "Junction retail", address: "Medavakkam Main Road", city: "Chennai", highway: "Inner city" },
  { id: "VG-039", name: "Vandalur–Kelambakkam Road", lat: 12.85, lng: 80.14, operator: "Magenta ChargeGrid", connector: "Bharat AC-001", powerKW: 3.3, total: 2, available: 2, status: "available", price: 12, queue: 4, profile: "highway", reliability: 0.74, amenity: "Cross-link", address: "Vandalur–Kelambakkam Rd", city: "Vandalur", highway: "Cross link" },
  { id: "VG-040", name: "Thiruporur Cross", lat: 12.73, lng: 80.19, operator: "Statiq", connector: "Type 2", powerKW: 7.2, total: 2, available: 0, status: "offline", price: 13, queue: 0, profile: "highway", reliability: 0.48, amenity: "Town road", address: "OMR / Thiruporur", city: "Thiruporur", highway: "OMR" },
  { id: "VG-041", name: "Kanchipuram Road Spur", lat: 12.72, lng: 79.95, operator: "IOCL", connector: "15A Socket", powerKW: 3.3, total: 2, available: 1, status: "available", price: 11, queue: 5, profile: "highway", reliability: 0.7, amenity: "Fuel station", address: "SH 58 west of Chengalpattu", city: "Chengalpattu", highway: "SH 58" },
  { id: "VG-042", name: "Maraimalai Nagar Railway", lat: 12.801, lng: 80.025, operator: "Tata Power EZ Charge", connector: "Type 2", powerKW: 7.2, total: 3, available: 2, status: "available", price: 13, queue: 6, profile: "transit", reliability: 0.8, amenity: "Suburban rail", address: "MM Nagar station road", city: "Maraimalai Nagar", highway: "GST Road" },
];

export const STATIONS: ChargingStation[] = SEED.map((s) => ({
  id: s.id,
  name: s.name,
  latitude: s.lat,
  longitude: s.lng,
  operator: s.operator,
  connectorType: s.connector,
  powerKW: s.powerKW,
  totalConnectors: s.total,
  seedAvailableConnectors: s.available,
  seedStatus: s.status,
  pricePerKWh: s.price,
  estimatedQueueMinutes: s.queue,
  demandProfile: s.profile,
  reliabilityScore: s.reliability,
  amenity: s.amenity,
  address: s.address,
  city: s.city,
  highway: s.highway,
  provenance: "static_seed",
}));

export function getStation(id: string): ChargingStation | undefined {
  return STATIONS.find((s) => s.id === id);
}

export const DEMO_PRIMARY_STATION = "VG-014";
export const DEMO_FALLBACK_STATION = "VG-021";
