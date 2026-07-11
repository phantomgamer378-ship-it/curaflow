# Backend Migration Walkthrough: Supabase to Express

We have successfully migrated the backend of the clinic appointment and live queue platform from Supabase to a containerized Node.js + Express backend with Prisma ORM, Redis, BullMQ, and Socket.IO.

---

## 1. Accomplishments & Key Components

### 🗄️ Database & Prisma ORM (`packages/db`)
*   Created [schema.prisma](file:///Users/vishalchauhan/Documents/natvie%20by%20codex/packages/db/prisma/schema.prisma) mapping the PostgreSQL tables.
*   Enforced standard PostgreSQL data types and enums (`UserRole`, `AppointmentStatus`, `QueueEntryStatus`, `NotificationChannel`).
*   Instantiated a shared `PrismaClient` in [index.ts](file:///Users/vishalchauhan/Documents/natvie%20by%20codex/packages/db/src/index.ts) to be consumed across the backend packages and workers.

### 🌐 Express API Server (`apps/api`)
*   Set up a modular monolith structured Express app.
*   **Boilerplate & Configs**: Fleshed out [index.ts](file:///Users/vishalchauhan/Documents/natvie%20by%20codex/apps/api/src/index.ts), Sockets [socket.ts](file:///Users/vishalchauhan/Documents/natvie%20by%20codex/apps/api/src/config/socket.ts), Redis [redis.ts](file:///Users/vishalchauhan/Documents/natvie%20by%20codex/apps/api/src/config/redis.ts), and Queues [queue.ts](file:///Users/vishalchauhan/Documents/natvie%20by%20codex/apps/api/src/config/queue.ts).
*   **Security Middlewares**:
    *   [auth.ts](file:///Users/vishalchauhan/Documents/natvie%20by%20codex/apps/api/src/middleware/auth.ts): Custom JWT verifier & Role-Based Access Control (RBAC) middleware for `patient`, `doctor`, and `admin` roles.
    *   [audit.ts](file:///Users/vishalchauhan/Documents/natvie%20by%20codex/apps/api/src/middleware/audit.ts): Automatic interceptor capturing success operations and writing structured details to the `AuditLog` table.
    *   [validate.ts](file:///Users/vishalchauhan/Documents/natvie%20by%20codex/apps/api/src/middleware/validate.ts): Input validator adapter matching request contents against Zod schemas from `@clinic/types`.
    *   [error.ts](file:///Users/vishalchauhan/Documents/natvie%20by%20codex/apps/api/src/middleware/error.ts): Centralized Express error boundary.
*   **Feature Modules**:
    *   **Auth**: Login, signup, password resets, cookie-based refresh tokens.
    *   **Appointments**: Type-safe booking checks, token generation, and cancellation notifications.
    *   **Queue**: Doctor consultation advancement endpoints, and immediate broadcast.
    *   **Admin**: Analytics aggregation and setup helpers (doctors availability/leaves/holidays).

### ⚙️ Realtime & Worker Alignment (`packages/queue` & `apps/worker`)
*   Refactored the shared `@clinic/queue` package to use type-safe Prisma transactions instead of Supabase client commands.
*   Updated `notification-worker.ts` and `index.ts` under `apps/worker` to pull records and update notification status using PostgreSQL via Prisma.

---

## 2. Real-Time Socket.IO Synchronization

We replaced Supabase Broadcast channels with **Socket.IO rooms** (`clinic:${clinicId}`).
When a doctor advances the queue (completing a consultation), the Express route performs the DB update and instantly broadcasts the new token number and waiting count via the Socket.IO instance to the public kiosk and user screens:

```typescript
export function broadcastQueueUpdate(clinicId: string, data: { current_token: number; waiting_count: number }) {
  getIO().to(`clinic:${clinicId}`).emit("queue_updated", data);
}
```

---

## 3. Background Job Processing (BullMQ)

We aligned BullMQ queues (`notification-queue`, `ai-queue`) to run on Redis. When a patient books an appointment, the API pushes a notification job. When a doctor completes a consultation, the API pushes an AI summarization job to digest diagnosis notes in the background without affecting UI responsiveness.

---

## 4. Verification Results ✅

### TypeScript Checks — **13/13 packages passed**

```
Tasks:    13 successful, 13 total
Cached:    11 cached, 13 total
Time:    3.313s
```

### Production Build — **13/13 packages built successfully**

```
Tasks:    13 successful, 13 total
Time:    34.645s
```

- `@clinic/db` — Prisma Client generated, schema compiled ✓
- `@clinic/queue` — Migrated from Supabase → Prisma, compiled ✓
- `@clinic/api` — Express monolith compiled with full module tree ✓
- `@clinic/worker` — Notification worker migrated to Prisma ✓
- `@clinic/web` — Next.js compiled 44 static/dynamic routes ✓

---

## 5. Next Steps (To Wire Frontend → Express)

To complete the end-to-end cutover, update the frontend to point to the Express API instead of Next.js built-in `/api` routes:

1. Set `NEXT_PUBLIC_API_URL=http://localhost:4000` (or deployed Express URL) in `apps/web/.env`
2. Replace Supabase client calls in `apps/web/src/lib/` with standard `fetch` calls to the Express API
3. Replace Supabase Realtime subscriptions with `socket.io-client` pointing at the Express WebSocket endpoint
4. Run `prisma migrate dev --name init` against your PostgreSQL DB to create all tables
