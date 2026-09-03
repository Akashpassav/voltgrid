import { z } from "zod";

const id = z.string().trim().min(1).max(512);

export const tripRequestSchema = z.object({
  originId: id,
  destinationId: id,
  vehicleId: id,
  socPercent: z.number().min(1).max(100),
  arrivalSocPercent: z.number().min(0).max(95).optional(),
  preference: z.enum(["fastest", "efficient", "reliability"]).default("fastest"),
  weatherFactor: z.number().min(0.8).max(1.4).optional(),
  passengerCount: z.number().int().min(1).max(5).default(1),
  cargoLoadKg: z.number().min(0).max(500).default(0),
}).strict();

export const predictSchema = z.object({
  stationId: id,
  etaMinutesFromNow: z.number().min(0).max(240).optional(),
}).strict();

export const simulateStatusSchema = z.object({
  stationId: id,
  status: z.enum(["available", "busy", "limited", "offline", "maintenance"]).optional(),
  action: z.enum(["fail", "restore"]).optional(),
}).strict();

export const scenarioSchema = z.object({
  action: z.enum(["fail-recommended", "fail-station", "high-demand", "traffic", "reset", "demo-clock", "live-clock"]),
  stationId: id.optional(),
  trip: tripRequestSchema.optional(),
}).strict();

export const rerouteSchema = z.object({
  trip: tripRequestSchema,
  failedStationId: id.optional(),
}).strict();

export const optimizeQuerySchema = z.object({
  originId: id,
  destinationId: id,
  vehicleId: id.default("ather-450x"),
  socPercent: z.coerce.number().min(1).max(100).default(68),
  preference: z.enum(["fastest", "efficient", "reliability"]).default("fastest"),
}).strict();

export const placesQuerySchema = z.object({ q: z.string().trim().max(120).default("") }).strict();
export const stationIdPathSchema = z.object({ id }).strict();
export const emptyQuerySchema = z.object({}).strict();
