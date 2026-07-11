# Runbooks

## Local web app

```bash
pnpm install
pnpm dev
```

## Verification

```bash
pnpm typecheck
pnpm build
```

## Database migration

Link the Supabase CLI to the intended project and review the target before
running:

```bash
supabase db push
```

Never apply a migration to production before it succeeds on staging. Phase 0
migrations are in `packages/db/supabase/migrations`.

## Realtime degradation

Clients continue polling the public snapshot endpoint every 30 seconds. A
broadcast failure must be logged, but it does not change queue state.
