# Security Hardening — merge summary

Modified/created:

- `src/lib/api/security.ts` — shared request-size checks, safe JSON parsing, Zod query/body helpers, rate limiting and explicit CORS.
- `src/lib/api/schemas.ts` — strict boundary schemas, including query/path schemas and new trip occupancy fields.
- All files under `src/app/api/**/route.ts` listed in this folder — apply `apiGuard`, Zod parsing and CORS; external OCM proxy is rate-limited more tightly and no longer logs secrets.
- `next.config.ts` — baseline security headers and CSP.
- `package.json` — adds `npm run typecheck`.
- `.github/workflows/ci.yml` — npm audit high/critical gate plus typecheck/lint/test/build.
- `.env.example` — placeholders only; server-only OCM secret is not public.
- `SECURITY.md` and `SECURITY_AUDIT.md` — security rationale and audit limitation.

No new npm dependency is required. Do not replace or add a lockfile from this delivery set.
