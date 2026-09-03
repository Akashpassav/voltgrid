import { beforeEach, describe, expect, it } from "vitest";
import { apiGuard, clientKey, resetRateLimits } from "@/lib/api/security";

describe("security utilities", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("extracts forwarded client IP from x-forwarded-for header", () => {
    const req = new Request("http://localhost:3000/api/stations", {
      headers: {
        "x-forwarded-for": "203.0.113.195, 70.41.3.18",
      },
    });

    expect(clientKey(req)).toBe("203.0.113.195");
  });

  it("falls back to x-real-ip when x-forwarded-for is missing", () => {
    const req = new Request("http://localhost:3000/api/stations", {
      headers: {
        "x-real-ip": "198.51.100.1",
      },
    });

    expect(clientKey(req)).toBe("198.51.100.1");
  });

  it("falls back to anonymous when neither IP header is present", () => {
    const req = new Request("http://localhost:3000/api/stations");

    expect(clientKey(req)).toBe("anonymous");
  });

  it("permits requests within the configured rate limit", () => {
    const limit = 5;
    for (let i = 0; i < limit; i++) {
      const req = new Request("http://localhost:3000/api/test-limit", {
        headers: { "x-real-ip": "10.0.0.1" },
      });
      const blocked = apiGuard(req, limit);
      expect(blocked).toBeNull();
    }
  });

  it("returns HTTP 429 with retry header when the rate limit is exceeded", async () => {
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      const req = new Request("http://localhost:3000/api/test-limit-exceeded", {
        headers: { "x-real-ip": "10.0.0.2" },
      });
      expect(apiGuard(req, limit)).toBeNull();
    }

    const exceededReq = new Request("http://localhost:3000/api/test-limit-exceeded", {
      headers: { "x-real-ip": "10.0.0.2" },
    });
    const response = apiGuard(exceededReq, limit);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);

    const body = await response?.json();
    expect(body?.error).toContain("Too many requests");
    expect(response?.headers.get("Retry-After")).toBeDefined();
  });
});
