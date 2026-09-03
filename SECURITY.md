# VoltGrid Security Notes

## Boundary validation

All public Route Handlers now apply Zod validation before domain logic. JSON POST bodies use a shared parser that checks `Content-Type`, caps the request body at 128 KiB, parses JSON safely, and rejects unknown fields. GET query strings and dynamic station IDs are validated as well.

## Abuse protection

A lightweight in-memory per-IP/per-route rate limiter is used for the prototype. General endpoints allow 120 requests/minute; route rerouting, simulation controls, and external Open Charge Map proxying are limited more aggressively. This is intentionally dependency-free and suitable for a single-process demo; a distributed production deployment should move the counter to a shared store.

## CORS and headers

CORS is deny-by-default for browser origins. The configured `NEXT_PUBLIC_APP_URL` plus local development origins are allow-listed; wildcard `*` is not used. Responses include `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and a baseline Content Security Policy.

## Secrets and client bundles

Secrets are read only from server-side environment variables. `.env.example` contains placeholders only. Do not put API keys in `NEXT_PUBLIC_*` variables or import server-only modules into client components. The Open Charge Map key is never logged or returned to the browser.

## Dependencies / supply chain

- Dependencies remain the existing open-source stack; no runtime security package was added.
- `npm audit --audit-level=high` is a required CI gate.
- Review dependency updates through `package-lock.json` changes and run typecheck, lint, tests and production build before merging.
- Pin exact framework versions where already pinned and keep transitive versions reproducible through the lockfile.

## Audit record

The local delivery environment did not have network access to npm's registry, so a trustworthy before/after advisory count could not be produced offline. Run `npm audit --audit-level=high` from the project root on a networked machine/CI runner and record the output in `SECURITY_AUDIT.md` before public deployment.
