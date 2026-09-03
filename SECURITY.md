# VoltGrid Security Notes

## Boundary validation

All public Route Handlers apply Zod validation before domain logic. JSON POST bodies use a shared parser that checks `Content-Type`, caps the request body at 128 KiB, parses JSON safely, and rejects unknown fields. GET query strings and dynamic station IDs are validated as well.

## Abuse protection

A lightweight in-memory per-IP/per-route rate limiter is used for the prototype. General endpoints allow 120 requests/minute; route rerouting, simulation controls, and external Open Charge Map proxying are limited more aggressively. This is intentionally dependency-free and suitable for a single-process demo; a distributed production deployment should move the counter to a shared store.

Client IP for rate limiting is `anonymous` unless `TRUST_PROXY=1` is set. Do not enable that flag unless a trusted reverse proxy is stripping/overwriting `X-Forwarded-For` and `X-Real-IP`. Otherwise those headers are attacker-controlled and would bypass the limiter.

## CORS and headers

CORS is deny-by-default for browser origins. The configured `NEXT_PUBLIC_APP_URL` plus local development origins are allow-listed; wildcard `*` is not used. Responses include `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS, and a baseline Content Security Policy. Rate-limit (429) responses include CORS for allow-listed origins so browsers can read them.

## Authentication

This prototype has no user accounts. Driver and operator UIs are public. Simulation controls (`/api/simulate/*`) are intentionally unauthenticated for the hackathon demo and are rate-limited more tightly than general GETs. Do not expose them on the public internet without an operator gate.

## Secrets and client bundles

Secrets are read only from server-side environment variables. `.env.example` contains placeholders only. Do not put API keys in `NEXT_PUBLIC_*` variables or import server-only modules into client components. The Open Charge Map key is never logged or returned to the browser. Coverage and OCM proxy error payloads use generic messages (they do not name env vars or include upstream exception text).

## External requests

OSRM, Open Charge Map, Nominatim, and Overpass URLs are fixed in code. User input is not concatenated into fetch hosts. OCM query parameters are constants or numeric region centres, not request-controlled URLs.

## Dependencies / supply chain

- Dependencies remain the existing open-source stack; no runtime security package was added.
- `npm audit --audit-level=high` is a required CI gate.
- Review dependency updates through `package-lock.json` changes and run typecheck, lint, tests and production build before merging.
- Pin exact framework versions where already pinned and keep transitive versions reproducible through the lockfile.

## Audit record

See `SECURITY_AUDIT.md` for the latest `npm audit --audit-level=high` result recorded against the npm registry.
