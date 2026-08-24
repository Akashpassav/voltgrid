import { getGraph, snapToNode } from "@/lib/data/graph";
import type { Coordinates, DrivingPreference, GraphEdge, GraphNode } from "@/lib/types";
import { densifyPath } from "@/lib/utils/geo";

export interface PathLeg {
  from: GraphNode;
  to: GraphNode;
  edge: GraphEdge;
}

export interface RoutedPath {
  nodes: GraphNode[];
  legs: PathLeg[];
  distanceKm: number;
  baseMinutes: number;
  meanTerrain: number;
  meanTraffic: number;
  geometry: Coordinates[];
}

/**
 * RoutingEngine port. MVP uses a corridor graph + Dijkstra.
 * Swap in OSRM / Mapbox Directions / Google by implementing this interface.
 */
export interface RoutingEngine {
  route(from: Coordinates, to: Coordinates, trafficMultiplier: number): RoutedPath | null;
  via(
    points: Coordinates[],
    trafficMultiplier: number,
  ): RoutedPath | null;
}

class MinHeap<T> {
  private data: { key: number; value: T }[] = [];

  push(key: number, value: T): void {
    this.data.push({ key, value });
    this.bubbleUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0].value;
    const last = this.data.pop()!;
    if (this.data.length) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  get size(): number {
    return this.data.length;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.data[p].key <= this.data[i].key) break;
      [this.data[p], this.data[i]] = [this.data[i], this.data[p]];
      i = p;
    }
  }

  private bubbleDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let s = i;
      const l = i * 2 + 1;
      const r = i * 2 + 2;
      if (l < n && this.data[l].key < this.data[s].key) s = l;
      if (r < n && this.data[r].key < this.data[s].key) s = r;
      if (s === i) break;
      [this.data[s], this.data[i]] = [this.data[i], this.data[s]];
      i = s;
    }
  }
}

const HIGHWAY_SPEED_KMH: Record<string, number> = {
  "GST Road": 42,
  OMR: 36,
  ECR: 38,
  Access: 20,
  Bypass: 32,
  "Inner city": 24,
  Rural: 28,
  Spur: 32,
  "Cross link": 34,
  "SH 58": 36,
  "Anna Salai": 22,
};

/** Wall-clock minutes for an edge — used both as Dijkstra cost and ETA. */
export function edgeTravelMinutes(edge: GraphEdge, trafficMultiplier: number): number {
  const speed = HIGHWAY_SPEED_KMH[edge.highway] ?? 30;
  let minutes = (edge.distanceKm / speed) * 60 * edge.trafficFactor * trafficMultiplier;
  if (edge.highway === "GST Road") minutes *= 0.92;
  if (edge.highway === "Rural") minutes *= 1.35;
  if (edge.highway === "Access") minutes *= 1.25;
  return minutes;
}

function preferenceCost(edge: GraphEdge, trafficMultiplier: number, preference: DrivingPreference): number {
  const minutes = edgeTravelMinutes(edge, trafficMultiplier);
  const energyProxy = edge.distanceKm * edge.terrainFactor;
  if (preference === "efficient") return energyProxy * 8 + minutes * 0.25;
  if (preference === "reliability") return minutes + edge.distanceKm * 0.4;
  return minutes + edge.distanceKm * 0.15;
}

export function dijkstra(
  originId: string,
  destId: string,
  trafficMultiplier: number,
  preference: DrivingPreference = "fastest",
): RoutedPath | null {
  const { nodes, edges } = getGraph();
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const adj = new Map<string, GraphEdge[]>();
  for (const e of edges) {
    const list = adj.get(e.from) ?? [];
    list.push(e);
    adj.set(e.from, list);
  }

  const dist = new Map<string, number>([[originId, 0]]);
  const prev = new Map<string, { node: string; edge: GraphEdge }>();
  const heap = new MinHeap<string>();
  heap.push(0, originId);

  while (heap.size) {
    const u = heap.pop()!;
    if (u === destId) break;
    const du = dist.get(u);
    if (du == null) continue;
    for (const edge of adj.get(u) ?? []) {
      const cost = preferenceCost(edge, trafficMultiplier, preference);
      const alt = du + cost;
      if (alt < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, alt);
        prev.set(edge.to, { node: u, edge });
        heap.push(alt, edge.to);
      }
    }
  }

  if (!dist.has(destId)) return null;

  const nodeIds: string[] = [destId];
  const legsRev: PathLeg[] = [];
  let cursor = destId;
  while (cursor !== originId) {
    const step = prev.get(cursor);
    if (!step) return null;
    const from = nodeById.get(step.node)!;
    const to = nodeById.get(cursor)!;
    legsRev.push({ from, to, edge: step.edge });
    cursor = step.node;
    nodeIds.push(cursor);
  }
  nodeIds.reverse();
  const legs = legsRev.reverse();
  const pathNodes = nodeIds.map((id) => nodeById.get(id)!);

  let distanceKm = 0;
  let baseMinutes = 0;
  let terrainAcc = 0;
  let trafficAcc = 0;
  for (const leg of legs) {
    distanceKm += leg.edge.distanceKm;
    baseMinutes += edgeTravelMinutes(leg.edge, trafficMultiplier);
    terrainAcc += leg.edge.terrainFactor * leg.edge.distanceKm;
    trafficAcc += leg.edge.trafficFactor * trafficMultiplier * leg.edge.distanceKm;
  }

  const coarse: Coordinates[] = pathNodes.map((n) => ({
    lat: n.latitude,
    lng: n.longitude,
  }));

  return {
    nodes: pathNodes,
    legs,
    distanceKm: Number(distanceKm.toFixed(2)),
    baseMinutes: Number(baseMinutes.toFixed(1)),
    meanTerrain: distanceKm ? terrainAcc / distanceKm : 1,
    meanTraffic: distanceKm ? trafficAcc / distanceKm : 1,
    geometry: densifyPath(coarse, 1.2),
  };
}

export function routeViaNodeIds(
  nodeIds: string[],
  trafficMultiplier: number,
  preference: DrivingPreference = "fastest",
): RoutedPath | null {
  if (nodeIds.length < 2) return null;
  const parts: RoutedPath[] = [];
  for (let i = 0; i < nodeIds.length - 1; i++) {
    if (nodeIds[i] === nodeIds[i + 1]) continue;
    const p = dijkstra(nodeIds[i], nodeIds[i + 1], trafficMultiplier, preference);
    if (!p) return null;
    parts.push(p);
  }
  if (!parts.length) return null;
  return mergePaths(parts);
}

export class GraphRoutingEngine implements RoutingEngine {
  route(from: Coordinates, to: Coordinates, trafficMultiplier: number): RoutedPath | null {
    const a = snapToNode(from.lat, from.lng);
    const b = snapToNode(to.lat, to.lng);
    if (a.id === b.id) {
      return {
        nodes: [a],
        legs: [],
        distanceKm: 0,
        baseMinutes: 0,
        meanTerrain: 1,
        meanTraffic: trafficMultiplier,
        geometry: [{ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng }],
      };
    }
    return dijkstra(a.id, b.id, trafficMultiplier, "fastest");
  }

  via(points: Coordinates[], trafficMultiplier: number): RoutedPath | null {
    if (points.length < 2) return null;
    const parts: RoutedPath[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p = this.route(points[i], points[i + 1], trafficMultiplier);
      if (!p) return null;
      parts.push(p);
    }
    return mergePaths(parts);
  }
}

function mergePaths(parts: RoutedPath[]): RoutedPath {
  const nodes: GraphNode[] = [];
  const legs: PathLeg[] = [];
  const geometry: Coordinates[] = [];
  let distanceKm = 0;
  let baseMinutes = 0;
  let terrainAcc = 0;
  let trafficAcc = 0;
  parts.forEach((p, idx) => {
    nodes.push(...(idx === 0 ? p.nodes : p.nodes.slice(1)));
    legs.push(...p.legs);
    geometry.push(...(idx === 0 ? p.geometry : p.geometry.slice(1)));
    distanceKm += p.distanceKm;
    baseMinutes += p.baseMinutes;
    terrainAcc += p.meanTerrain * p.distanceKm;
    trafficAcc += p.meanTraffic * p.distanceKm;
  });
  return {
    nodes,
    legs,
    distanceKm: Number(distanceKm.toFixed(2)),
    baseMinutes: Number(baseMinutes.toFixed(1)),
    meanTerrain: distanceKm ? terrainAcc / distanceKm : 1,
    meanTraffic: distanceKm ? trafficAcc / distanceKm : 1,
    geometry,
  };
}

export const routingEngine: RoutingEngine = new GraphRoutingEngine();
