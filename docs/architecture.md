# Architecture

## Shape

CuraFlow is a modular monolith. `apps/web` owns presentation and BFF routes;
`apps/worker` owns persistent background processing. Domain boundaries live in
workspace packages and can be imported by both processes.

```text
Presentation → Application handlers → Domain services → Infrastructure
```

The backend is the sole source of truth for appointments and queues. Realtime
messages broadcast small snapshots; they do not authorize or perform state
changes. AI is assistive-only.

## Phase 0 status

- Workspace, package boundaries, web layouts, and public queue views: complete
- Core schema and RLS migrations: authored; cloud execution requires Supabase credentials
- Auth, appointment handlers, workers, realtime, analytics, and agents: intentionally deferred to their phases

## Import rules

- Queue mutations must live in `@clinic/queue`.
- Shared I/O validation must live in `@clinic/types`.
- UI primitives live in `@clinic/ui`; feature UI remains in `apps/web`.
- Worker code must never be imported by the web app.
- No client component may write directly to appointment or queue tables.
