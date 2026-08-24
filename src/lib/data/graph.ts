import { STATIONS } from "@/lib/data/stations";
import type { GraphEdge, GraphNode } from "@/lib/types";
import { haversineKm } from "@/lib/utils/geo";

/**
 * Simplified GST Road / Chennai urban corridor graph.
 * Distances are road-like (haversine * factor is NOT used — edges carry
 * measured corridor distances). This is the MVP RoutingEngine substrate;
 * OSRM / Mapbox can replace it behind the same interface.
 */
const WAYPOINTS: Omit<GraphNode, "kind">[] = [
  { id: "W-central", name: "Chennai Central", latitude: 13.0827, longitude: 80.2707, terrainFactor: 1.04 },
  { id: "W-annanagar", name: "Anna Nagar", latitude: 13.0878, longitude: 80.2102, terrainFactor: 1.03 },
  { id: "W-tnagar", name: "T. Nagar", latitude: 13.0418, longitude: 80.2337, terrainFactor: 1.05 },
  { id: "W-nandanam", name: "Nandanam", latitude: 13.0524, longitude: 80.2501, terrainFactor: 1.04 },
  { id: "W-adyar", name: "Adyar", latitude: 13.0063, longitude: 80.2574, terrainFactor: 1.03 },
  { id: "W-guindy", name: "Guindy", latitude: 13.0067, longitude: 80.2206, terrainFactor: 1.06 },
  { id: "W-kathipara", name: "Kathipara", latitude: 13.007, longitude: 80.201, terrainFactor: 1.07 },
  { id: "W-porur", name: "Porur", latitude: 13.034, longitude: 80.156, terrainFactor: 1.05 },
  { id: "W-mount", name: "St. Thomas Mount", latitude: 13.0008, longitude: 80.197, terrainFactor: 1.06 },
  { id: "W-airport", name: "Airport", latitude: 12.9941, longitude: 80.1707, terrainFactor: 1.05 },
  { id: "W-velachery", name: "Velachery", latitude: 12.9758, longitude: 80.221, terrainFactor: 1.04 },
  { id: "W-thiruvanmiyur", name: "Thiruvanmiyur", latitude: 12.985, longitude: 80.2594, terrainFactor: 1.02 },
  { id: "W-perungudi", name: "Perungudi", latitude: 12.9611, longitude: 80.2432, terrainFactor: 1.03 },
  { id: "W-pallavaram", name: "Pallavaram", latitude: 12.9675, longitude: 80.1491, terrainFactor: 1.06 },
  { id: "W-chromepet", name: "Chromepet", latitude: 12.9516, longitude: 80.1462, terrainFactor: 1.07 },
  { id: "W-medavakkam", name: "Medavakkam", latitude: 12.917, longitude: 80.192, terrainFactor: 1.05 },
  { id: "W-pallikaranai", name: "Pallikaranai", latitude: 12.934, longitude: 80.207, terrainFactor: 1.04 },
  { id: "W-sholinganallur", name: "Sholinganallur", latitude: 12.9009, longitude: 80.2279, terrainFactor: 1.03 },
  { id: "W-navalur", name: "Navalur", latitude: 12.851, longitude: 80.226, terrainFactor: 1.04 },
  { id: "W-kelambakkam", name: "Kelambakkam", latitude: 12.8142, longitude: 80.2304, terrainFactor: 1.05 },
  { id: "W-injambakkam", name: "Injambakkam", latitude: 12.916, longitude: 80.258, terrainFactor: 1.02 },
  { id: "W-tambaram-e", name: "Tambaram East", latitude: 12.93, longitude: 80.13, terrainFactor: 1.06 },
  { id: "W-sanatorium", name: "Tambaram Sanatorium", latitude: 12.933, longitude: 80.122, terrainFactor: 1.07 },
  { id: "W-tambaram", name: "Tambaram", latitude: 12.9249, longitude: 80.1, terrainFactor: 1.08 },
  { id: "W-tambaram-w", name: "Tambaram West", latitude: 12.922, longitude: 80.088, terrainFactor: 1.08 },
  { id: "W-perungalathur", name: "Perungalathur", latitude: 12.9054, longitude: 80.0947, terrainFactor: 1.09 },
  { id: "W-vandalur", name: "Vandalur", latitude: 12.8913, longitude: 80.081, terrainFactor: 1.1 },
  { id: "W-urapakkam", name: "Urapakkam", latitude: 12.87, longitude: 80.075, terrainFactor: 1.1 },
  { id: "W-crosslink", name: "Vandalur–Kelambakkam", latitude: 12.85, longitude: 80.14, terrainFactor: 1.12 },
  { id: "W-guduvancheri", name: "Guduvancheri", latitude: 12.8456, longitude: 80.0603, terrainFactor: 1.09 },
  { id: "W-srm", name: "SRM / Potheri", latitude: 12.823, longitude: 80.044, terrainFactor: 1.08 },
  { id: "W-potheri", name: "Potheri South", latitude: 12.811, longitude: 80.0375, terrainFactor: 1.08 },
  { id: "W-mmnagar", name: "Maraimalai Nagar", latitude: 12.791, longitude: 80.018, terrainFactor: 1.07 },
  { id: "W-mmrail", name: "MM Nagar Railway", latitude: 12.801, longitude: 80.025, terrainFactor: 1.07 },
  { id: "W-spkoil", name: "Singaperumal Koil", latitude: 12.7615, longitude: 80.002, terrainFactor: 1.08 },
  { id: "W-mahindra", name: "Mahindra City", latitude: 12.737, longitude: 80.015, terrainFactor: 1.06 },
  { id: "W-paranur", name: "Paranur", latitude: 12.71, longitude: 79.99, terrainFactor: 1.07 },
  { id: "W-thiruporur", name: "Thiruporur", latitude: 12.73, longitude: 80.19, terrainFactor: 1.05 },
  { id: "W-cheng-rail", name: "Chengalpattu Railway", latitude: 12.692, longitude: 79.975, terrainFactor: 1.05 },
  { id: "W-chengalpattu", name: "Chengalpattu", latitude: 12.6819, longitude: 79.9832, terrainFactor: 1.05 },
  { id: "W-cheng-south", name: "Chengalpattu South", latitude: 12.67, longitude: 79.97, terrainFactor: 1.06 },
  { id: "W-kanchi-spur", name: "Kanchipuram Spur", latitude: 12.72, longitude: 79.95, terrainFactor: 1.08 },
];

interface NamedEdge {
  from: string;
  to: string;
  distanceKm: number;
  baseMinutes: number;
  terrainFactor: number;
  trafficFactor: number;
  highway: string;
}

const CORRIDOR: NamedEdge[] = [
  { from: "W-central", to: "W-nandanam", distanceKm: 4.6, baseMinutes: 16, terrainFactor: 1.04, trafficFactor: 1.2, highway: "Anna Salai" },
  { from: "W-nandanam", to: "W-tnagar", distanceKm: 2.4, baseMinutes: 10, terrainFactor: 1.05, trafficFactor: 1.25, highway: "Inner city" },
  { from: "W-nandanam", to: "W-guindy", distanceKm: 6.2, baseMinutes: 18, terrainFactor: 1.05, trafficFactor: 1.18, highway: "Anna Salai" },
  { from: "W-tnagar", to: "W-guindy", distanceKm: 5.1, baseMinutes: 16, terrainFactor: 1.05, trafficFactor: 1.22, highway: "Inner city" },
  { from: "W-central", to: "W-annanagar", distanceKm: 7.8, baseMinutes: 24, terrainFactor: 1.03, trafficFactor: 1.15, highway: "Inner city" },
  { from: "W-annanagar", to: "W-porur", distanceKm: 8.4, baseMinutes: 22, terrainFactor: 1.04, trafficFactor: 1.14, highway: "Inner city" },
  { from: "W-adyar", to: "W-nandanam", distanceKm: 5.8, baseMinutes: 18, terrainFactor: 1.03, trafficFactor: 1.16, highway: "Inner city" },
  { from: "W-adyar", to: "W-thiruvanmiyur", distanceKm: 3.2, baseMinutes: 11, terrainFactor: 1.02, trafficFactor: 1.1, highway: "ECR" },
  { from: "W-adyar", to: "W-guindy", distanceKm: 4.4, baseMinutes: 14, terrainFactor: 1.04, trafficFactor: 1.12, highway: "Inner city" },
  { from: "W-guindy", to: "W-kathipara", distanceKm: 2.6, baseMinutes: 8, terrainFactor: 1.07, trafficFactor: 1.2, highway: "GST Road" },
  { from: "W-guindy", to: "W-velachery", distanceKm: 4.8, baseMinutes: 15, terrainFactor: 1.04, trafficFactor: 1.18, highway: "Inner city" },
  { from: "W-kathipara", to: "W-mount", distanceKm: 1.8, baseMinutes: 6, terrainFactor: 1.06, trafficFactor: 1.15, highway: "GST Road" },
  { from: "W-kathipara", to: "W-porur", distanceKm: 6.6, baseMinutes: 18, terrainFactor: 1.05, trafficFactor: 1.16, highway: "Inner city" },
  { from: "W-mount", to: "W-airport", distanceKm: 3.4, baseMinutes: 9, terrainFactor: 1.05, trafficFactor: 1.12, highway: "GST Road" },
  { from: "W-airport", to: "W-pallavaram", distanceKm: 4.2, baseMinutes: 11, terrainFactor: 1.06, trafficFactor: 1.14, highway: "GST Road" },
  { from: "W-pallavaram", to: "W-chromepet", distanceKm: 2.4, baseMinutes: 8, terrainFactor: 1.07, trafficFactor: 1.16, highway: "GST Road" },
  { from: "W-chromepet", to: "W-sanatorium", distanceKm: 3.6, baseMinutes: 10, terrainFactor: 1.07, trafficFactor: 1.14, highway: "GST Road" },
  { from: "W-sanatorium", to: "W-tambaram", distanceKm: 2.8, baseMinutes: 9, terrainFactor: 1.08, trafficFactor: 1.18, highway: "GST Road" },
  { from: "W-chromepet", to: "W-tambaram-e", distanceKm: 3.2, baseMinutes: 10, terrainFactor: 1.06, trafficFactor: 1.12, highway: "Bypass" },
  { from: "W-tambaram-e", to: "W-tambaram", distanceKm: 3.4, baseMinutes: 10, terrainFactor: 1.06, trafficFactor: 1.1, highway: "Bypass" },
  { from: "W-tambaram", to: "W-tambaram-w", distanceKm: 1.6, baseMinutes: 6, terrainFactor: 1.08, trafficFactor: 1.08, highway: "Bypass" },
  { from: "W-tambaram", to: "W-perungalathur", distanceKm: 3.1, baseMinutes: 8, terrainFactor: 1.09, trafficFactor: 1.16, highway: "GST Road" },
  { from: "W-tambaram-w", to: "W-perungalathur", distanceKm: 2.4, baseMinutes: 8, terrainFactor: 1.09, trafficFactor: 1.1, highway: "Bypass" },
  { from: "W-perungalathur", to: "W-vandalur", distanceKm: 2.6, baseMinutes: 7, terrainFactor: 1.1, trafficFactor: 1.12, highway: "GST Road" },
  { from: "W-vandalur", to: "W-urapakkam", distanceKm: 2.9, baseMinutes: 7, terrainFactor: 1.1, trafficFactor: 1.1, highway: "GST Road" },
  { from: "W-urapakkam", to: "W-guduvancheri", distanceKm: 3.6, baseMinutes: 8, terrainFactor: 1.09, trafficFactor: 1.1, highway: "GST Road" },
  { from: "W-guduvancheri", to: "W-srm", distanceKm: 3.4, baseMinutes: 8, terrainFactor: 1.08, trafficFactor: 1.08, highway: "GST Road" },
  { from: "W-srm", to: "W-potheri", distanceKm: 1.8, baseMinutes: 5, terrainFactor: 1.08, trafficFactor: 1.06, highway: "GST Road" },
  { from: "W-potheri", to: "W-mmrail", distanceKm: 1.7, baseMinutes: 5, terrainFactor: 1.07, trafficFactor: 1.06, highway: "GST Road" },
  { from: "W-mmrail", to: "W-mmnagar", distanceKm: 1.5, baseMinutes: 4, terrainFactor: 1.07, trafficFactor: 1.08, highway: "GST Road" },
  { from: "W-mmnagar", to: "W-spkoil", distanceKm: 4.2, baseMinutes: 9, terrainFactor: 1.08, trafficFactor: 1.08, highway: "GST Road" },
  { from: "W-spkoil", to: "W-mahindra", distanceKm: 3.4, baseMinutes: 8, terrainFactor: 1.06, trafficFactor: 1.05, highway: "Spur" },
  { from: "W-spkoil", to: "W-paranur", distanceKm: 5.8, baseMinutes: 12, terrainFactor: 1.07, trafficFactor: 1.08, highway: "GST Road" },
  { from: "W-paranur", to: "W-cheng-rail", distanceKm: 2.8, baseMinutes: 7, terrainFactor: 1.05, trafficFactor: 1.06, highway: "GST Road" },
  { from: "W-cheng-rail", to: "W-chengalpattu", distanceKm: 1.6, baseMinutes: 6, terrainFactor: 1.05, trafficFactor: 1.08, highway: "Inner city" },
  { from: "W-chengalpattu", to: "W-cheng-south", distanceKm: 2.0, baseMinutes: 6, terrainFactor: 1.06, trafficFactor: 1.05, highway: "GST Road" },
  { from: "W-paranur", to: "W-kanchi-spur", distanceKm: 4.4, baseMinutes: 11, terrainFactor: 1.08, trafficFactor: 1.04, highway: "SH 58" },
  { from: "W-thiruvanmiyur", to: "W-perungudi", distanceKm: 3.6, baseMinutes: 10, terrainFactor: 1.03, trafficFactor: 1.14, highway: "OMR" },
  { from: "W-velachery", to: "W-perungudi", distanceKm: 3.8, baseMinutes: 12, terrainFactor: 1.03, trafficFactor: 1.16, highway: "OMR" },
  { from: "W-perungudi", to: "W-sholinganallur", distanceKm: 7.2, baseMinutes: 16, terrainFactor: 1.03, trafficFactor: 1.2, highway: "OMR" },
  { from: "W-sholinganallur", to: "W-navalur", distanceKm: 5.8, baseMinutes: 12, terrainFactor: 1.04, trafficFactor: 1.15, highway: "OMR" },
  { from: "W-navalur", to: "W-kelambakkam", distanceKm: 4.6, baseMinutes: 10, terrainFactor: 1.05, trafficFactor: 1.1, highway: "OMR" },
  { from: "W-thiruvanmiyur", to: "W-injambakkam", distanceKm: 8.2, baseMinutes: 16, terrainFactor: 1.02, trafficFactor: 1.08, highway: "ECR" },
  { from: "W-velachery", to: "W-pallikaranai", distanceKm: 4.6, baseMinutes: 13, terrainFactor: 1.04, trafficFactor: 1.14, highway: "Inner city" },
  { from: "W-pallikaranai", to: "W-medavakkam", distanceKm: 2.8, baseMinutes: 9, terrainFactor: 1.05, trafficFactor: 1.12, highway: "Inner city" },
  { from: "W-medavakkam", to: "W-tambaram-e", distanceKm: 6.4, baseMinutes: 16, terrainFactor: 1.06, trafficFactor: 1.12, highway: "Bypass" },
  { from: "W-medavakkam", to: "W-sholinganallur", distanceKm: 5.2, baseMinutes: 14, terrainFactor: 1.04, trafficFactor: 1.1, highway: "Inner city" },
  { from: "W-vandalur", to: "W-crosslink", distanceKm: 7.8, baseMinutes: 16, terrainFactor: 1.12, trafficFactor: 1.06, highway: "Cross link" },
  { from: "W-crosslink", to: "W-kelambakkam", distanceKm: 9.4, baseMinutes: 18, terrainFactor: 1.1, trafficFactor: 1.04, highway: "Cross link" },
  { from: "W-kelambakkam", to: "W-thiruporur", distanceKm: 10.6, baseMinutes: 18, terrainFactor: 1.05, trafficFactor: 1.05, highway: "OMR" },
  { from: "W-thiruporur", to: "W-mahindra", distanceKm: 24.8, baseMinutes: 48, terrainFactor: 1.12, trafficFactor: 1.08, highway: "Rural" },
];

function stationNodes(): GraphNode[] {
  return STATIONS.map((s) => ({
    id: `S-${s.id}`,
    name: s.name,
    latitude: s.latitude,
    longitude: s.longitude,
    kind: "station" as const,
    stationId: s.id,
    terrainFactor: 1.06,
  }));
}

function nearestWaypoints(lat: number, lng: number, n = 2): GraphNode[] {
  return WAYPOINTS.map((w) => ({
    node: { ...w, kind: "waypoint" as const },
    d: haversineKm({ lat, lng }, { lat: w.latitude, lng: w.longitude }),
  }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((x) => x.node);
}

function accessEdges(): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (const s of STATIONS) {
    const nearest = nearestWaypoints(s.latitude, s.longitude, 2);
    nearest.forEach((w, idx) => {
      const d = Math.max(
        0.15,
        haversineKm(
          { lat: s.latitude, lng: s.longitude },
          { lat: w.latitude, lng: w.longitude },
        ),
      );
      edges.push({
        from: `S-${s.id}`,
        to: w.id,
        distanceKm: Number(d.toFixed(2)),
        baseMinutes: Math.max(1, Math.round((d / 22) * 60) + (idx === 0 ? 0 : 1)),
        terrainFactor: 1.06,
        trafficFactor: 1.05,
        highway: "Access",
      });
    });
  }
  return edges;
}

export function buildGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [
    ...WAYPOINTS.map((w) => ({ ...w, kind: "waypoint" as const })),
    ...stationNodes(),
  ];
  const undirected: GraphEdge[] = [];
  for (const e of [...CORRIDOR, ...accessEdges()]) {
    undirected.push(e);
    undirected.push({
      ...e,
      from: e.to,
      to: e.from,
    });
  }
  return { nodes, edges: undirected };
}

let cached: { nodes: GraphNode[]; edges: GraphEdge[] } | null = null;

export function getGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (!cached) cached = buildGraph();
  return cached;
}

export function findNode(id: string): GraphNode | undefined {
  return getGraph().nodes.find((n) => n.id === id);
}

export function snapToNode(lat: number, lng: number): GraphNode {
  const { nodes } = getGraph();
  let best = nodes[0];
  let bestD = Infinity;
  for (const n of nodes) {
    const d = haversineKm({ lat, lng }, { lat: n.latitude, lng: n.longitude });
    if (d < bestD - 1e-6) {
      bestD = d;
      best = n;
      continue;
    }
    if (Math.abs(d - bestD) <= 1e-6 && n.kind === "station" && best.kind !== "station") {
      best = n;
    }
  }
  return best;
}
