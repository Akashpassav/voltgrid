import { NextResponse } from "next/server";
import type { z } from "zod";

const MAX_BODY_BYTES = 128 * 1024;
const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 120;

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();

export function resetRateLimits(): void {
  buckets.clear();
}

function trustForwardedClientIp(): boolean {
  const flag = process.env.TRUST_PROXY?.trim().toLowerCase();
  return flag === "1" || flag === "true";
}

/**
 * Client identity for rate limiting.
 * Forwarded IP headers are client-spoofable unless this process sits behind
 * a trusted reverse proxy (`TRUST_PROXY=1`).
 */
export function clientKey(req: Request): string {
  if (!trustForwardedClientIp()) return "anonymous";
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "anonymous";
}

function pruneExpiredBuckets(now: number): void {
  if (buckets.size < 64) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function isAllowedOrigin(origin: string | null, req?: Request): boolean {
  if (!origin) return true;

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const staticOrigins = new Set([
    ...(configured ? [configured.replace(/\/$/, "")] : []),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:43123",
    "http://127.0.0.1:43123",
  ]);

  if (staticOrigins.has(origin)) return true;

  try {
    const originUrl = new URL(origin);

    // Allow all Vercel deployment preview and production domains
    if (originUrl.hostname.endsWith(".vercel.app")) {
      return true;
    }

    // Allow same-host origin requests
    if (req) {
      const host = req.headers.get("host") || new URL(req.url).host;
      if (host && (originUrl.host === host || originUrl.hostname === host.split(":")[0])) {
        return true;
      }
    }

    if (process.env.VERCEL_URL && originUrl.hostname === process.env.VERCEL_URL.replace(/\/$/, "")) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function apiGuard(req: Request, limit = DEFAULT_LIMIT): NextResponse | null {
  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin, req)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  const now = Date.now();
  pruneExpiredBuckets(now);
  const key = `${req.method}:${req.url.split("?")[0]}:${clientKey(req)}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }
  current.count += 1;
  if (current.count > limit) {
    const response = NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
    response.headers.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
    return withCors(req, response);
  }
  return null;
}

export function withCors(req: Request, response: NextResponse): NextResponse {
  const origin = req.headers.get("origin");
  if (origin && isAllowedOrigin(origin, req)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
    response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  }
  return response;
}

export function corsOptions(req: Request): NextResponse {
  const blocked = apiGuard(req);
  if (blocked) return blocked;
  return withCors(req, new NextResponse(null, { status: 204 }));
}

export async function parseJsonBody<T>(req: Request, schema: z.ZodType<T>): Promise<{ data?: T; response?: NextResponse }> {
  const contentType = req.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return { response: NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 }) };
  }
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return { response: NextResponse.json({ error: "Request body is too large" }, { status: 413 }) };
  }
  let raw: unknown;
  try {
    const text = await req.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
      return { response: NextResponse.json({ error: "Request body is too large" }, { status: 413 }) };
    }
    raw = JSON.parse(text);
  } catch {
    return { response: NextResponse.json({ error: "Malformed JSON body" }, { status: 400 }) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { response: NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 }) };
  }
  return { data: parsed.data };
}

export function parseQuery<T>(req: Request, schema: z.ZodType<T>): { data?: T; response?: NextResponse } {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return { response: NextResponse.json({ error: "Invalid query parameters", issues: parsed.error.issues }, { status: 400 }) };
  }
  return { data: parsed.data };
}
