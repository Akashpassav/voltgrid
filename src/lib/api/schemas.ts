import { z } from "zod";

export const tripRequestSchema = z.object({
  originId: z.string().min(1),
  destinationId: z.string().min(1),
  vehicleId: z.string().min(1),
  socPercent: z.number().min(1).max(100),
  arrivalSocPercent: z.number().min(0).max(80).optional(),
  preference: z.enum(["fastest", "efficient", "reliability"]).default("fastest"),
  weatherFactor: z.number().min(0.8).max(1.4).optional(),
});

export const predictSchema = z.object({
  stationId: z.string().min(1),
  etaMinutesFromNow: z.number().min(0).max(240).optional(),
});

export const simulateStatusSchema = z.object({
  stationId: z.string().min(1),
  status: z.enum(["available", "busy", "limited", "offline", "maintenance"]).optional(),
  action: z.enum(["fail", "restore"]).optional(),
});

export const scenarioSchema = z.object({
  action: z.enum([
    "fail-recommended",
    "fail-station",
    "high-demand",
    "traffic",
    "reset",
    "demo-clock",
    "live-clock",
  ]),
  stationId: z.string().optional(),
  trip: tripRequestSchema.optional(),
});

export const rerouteSchema = z.object({
  trip: tripRequestSchema,
  failedStationId: z.string().optional(),
});
