# CuraFlow clinic platform

A modular monolith for clinic appointments and live queue management.

## Start locally

```bash
pnpm install
pnpm dev
```

The web app runs at `http://localhost:3000`.

## Workspace

- `apps/web` — Next.js web app and BFF routes
- `apps/worker` — persistent background worker (stub in Phase 0)
- `packages/*` — shared domain, infrastructure, schemas, and UI packages
- `packages/db/supabase/migrations` — ordered database migrations

See `docs/architecture.md` for boundaries and phase status.
