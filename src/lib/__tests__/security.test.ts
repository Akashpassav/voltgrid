import { beforeEach, describe, expect, it } from "vitest";
import { apiGuard, clientKey, resetRateLimits } from "@/lib/api/security";

describe("security utilities", () => {
  beforeEach(() => {
    resetRateLimits();
    delete process.env.TRUST_PROXY;
  });

  it("ignores spoofable forwarded IP headers unless TRUST_PROXY is enabled", () => {
    const req = new Request("http://localhost:3000/api/stations", {
      headers: {
        "x-forwarded-for": "203.0.113.195, 70.41.3.18",
      },
    });

    expect(clientKey(req)).toBe("anonymous");
  });

  it("extracts forwarded client IP from x-forwarded-for when TRUST_PROXY=1", () => {
    process.env.TRUST_PROXY = "1";
    const req = new Request("http://localhost:3000/api/stations", {
      headers: {
        "x-forwarded-for": "203.0.113.195, 70.41.3.18",
      },
    });

    expect(clientKey(req)).toBe("203.0.113.195");
  });

  it("falls back to x-real-ip when TRUST_PROXY is set and x-forwarded-for is missing", () => {
    process.env.TRUST_PROXY = "true";
    const req = new Request("http://localhost:3000/api/stations", {
      headers: {
        "x-real-ip": "198.51.100.1",
      },
    });

    expect(clientKey(req)).toBe("198.51.100.1");
  });

  it("falls back to anonymous when neither IP header is present", () => {
    process.env.TRUST_PROXY = "1";
    const req = new Request("http://localhost:3000/api/stations");

    expect(clientKey(req)).toBe("anonymous");
  });

  it("rejects browser origins that are not on the CORS allow-list", async () => {
    const req = new Request("http://localhost:3000/api/stations", {
      headers: { origin: "https://evil.example" },
    });
    const blocked = apiGuard(req);
    expect(blocked).not.toBeNull();
    expect(blocked?.status).toBe(403);
    const body = await blocked?.json();
    expect(body?.error).toBe("Origin not allowed");
    expect(blocked?.headers.get("Access-Control-Allow-Origin")).toBeNull();
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
        headers: { origin: "http://localhost:3000" },
      });
      expect(apiGuard(req, limit)).toBeNull();
    }

    const exceededReq = new Request("http://localhost:3000/api/test-limit-exceeded", {
      headers: { origin: "http://localhost:3000" },
    });
    const response = apiGuard(exceededReq, limit);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);

    const body = await response?.json();
    expect(body?.error).toContain("Too many requests");
    expect(response?.headers.get("Retry-After")).toBeDefined();
    expect(response?.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
  });
});
