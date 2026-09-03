# VoltGrid dependency audit record

## Before

Command:

```text
npm audit --audit-level=high
```

Result in the isolated delivery environment: the npm registry could not be resolved (`EAI_AGAIN registry.npmjs.org`). Therefore no advisory count is claimed here.

## After

The hardening change adds the same command as a CI gate in `.github/workflows/ci.yml`.

Run the command after `npm ci` on a networked machine. If it reports high/critical advisories, update the affected dependency/lockfile and rerun the full quality suite rather than bypassing the audit gate.
