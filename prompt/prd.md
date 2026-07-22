# CLINIC APPOINTMENT & LIVE QUEUE PLATFORM — COMPLETE MASTER BUILD PROMPT

## 0. HOW TO USE THIS PROMPT
Feed to your coding agent **one phase at a time** (Section 20), in order. Each phase ends in a binary CHECKPOINT — do not advance until every box passes. This version restores every feature from your original research (AI agents, multi-channel notifications, background workers, analytics, monorepo structure) that earlier drafts compressed out.

---

## 1. PROJECT SUMMARY
Production-grade clinic appointment + live queue web app.
- **Roles:** patient, doctor, admin, public/kiosk queue viewer (no auth).
- **Scale:** ~100 users/day. Optimize for correctness + mobile/Android performance, not hyperscale.
- **Architecture:** modular monolith, not microservices.
- **Non-negotiable rule:** backend is sole source of truth for appointment/queue state. Realtime only broadcasts. AI is assistive-only and never mutates appointment/queue state directly.

---

## 2. TECH STACK (PINNED — no substitutions without explicit approval)
| Layer | Tech | Version |
|---|---|---|
| Monorepo tooling | pnpm workspaces + Turborepo | pnpm 9.x |
| Framework | Next.js (App Router) | 15.1.x |
| Language | TypeScript | 5.6.x (`strict: true`) |
| Styling | Tailwind CSS | 3.4.17 |
| UI kit | shadcn/ui | pinned components |
| Animation | Framer Motion | 11.x — landing hero only, `LazyMotion` |
| 3D | @react-three/fiber 8.17.x / @react-three/drei 9.114.x | hero only, `next/dynamic` |
| Data fetching | @tanstack/react-query | 5.x |
| Validation | zod | 3.23.x — every API input/output |
| DB/Auth/Realtime/Storage | Supabase (Postgres 15) | @supabase/supabase-js 2.45.x |
| Background jobs | BullMQ + Upstash Redis | 5.x |
| Email | Resend | latest |
| SMS/WhatsApp | Twilio **or** MSG91 (pick one) | latest |
| Testing | Vitest 2.x (unit) + Playwright 1.47.x (E2E) | |
| Monitoring | Sentry | latest |
| Hosting — web | Vercel | — |
| Hosting — worker | Railway, Render, or Fly.io | — |
| DB hosting | Supabase Cloud | — |

**Why a separate worker host:** Vercel serverless functions cannot run long-lived BullMQ workers. `apps/worker` (Section 4) deploys as a persistent process elsewhere.

---

## 3. ARCHITECTURE & MODULES
**Modules:** `auth · users/roles · patients · doctors · appointments · queue · notifications · admin · audit · ai`
**Layers:** Presentation → Application (use-case handlers) → Domain (entities) → Infrastructure (Supabase/Redis/email/SMS/AI provider adapters).

**Exact use-case handler names:**
`signUpWithPassword, signInWithGoogle, requestPasswordReset, resetPassword, logout, logoutAllDevices, createAppointment, rescheduleAppointment, cancelAppointment, addConsultationNotes, markPatientDone, startConsultation, markNoShow, advanceQueue, getLiveQueueSnapshot, createDoctor, updateDoctorAvailability, setClinicHoliday, setDoctorLeave, deleteUser (soft), getAdminAnalytics`

Google OAuth identity linking uses Supabase's built-in `auth.identities` table — no custom `linked_accounts` table needed.

---

## 4. MONOREPO REPOSITORY STRUCTURE
Scaffold this full skeleton in Phase 0 (`apps/worker` and `packages/ai` can be empty stubs until their phase begins).
```
clinic-platform/
  apps/
    web/                 # Next.js frontend + BFF routes
    worker/              # notification / queue / analytics / ai workers
  packages/
    ui/                  # shared design system (shadcn wrappers)
    config/              # eslint, tsconfig, env schema
    db/                  # SQL migrations, generated types, queries
    auth/                # role guards, permission helpers
    queue/                # queue engine — imported by BOTH web and worker (never duplicated)
    notifications/        # email/sms/whatsapp adapters
    ai/                    # agent definitions, prompts, policies
    analytics/             # KPI aggregation logic
    observability/         # logging/metrics/tracing helpers
    types/                  # shared TS types + zod schemas
  .github/workflows/
    ci.yml
    preview-deploy.yml
    production-deploy.yml
    db-migrate.yml
    nightly-jobs.yml
  docs/
    architecture.md
    api-spec.md
    event-catalog.md
    agent-pipelines.md
    runbooks.md
```

---

## 5. DATABASE SCHEMA — FULL SQL

### 5.1 `001_init.sql` (Phase 0 — core schema)
```sql
-- ENUMS
create type user_role as enum ('patient','doctor','admin');
create type appointment_status as enum ('booked','confirmed','checked_in','in_consultation','completed','cancelled','no_show');
create type queue_entry_status as enum ('waiting','in_consultation','completed','no_show');
create type notification_channel as enum ('email','sms','whatsapp');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'patient',
  name text not null,
  phone text,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  open_time time not null default '09:00',
  close_time time not null default '17:00',
  created_at timestamptz not null default now()
);

create table doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  specialty text,
  slot_duration_min int not null default 15,
  max_patients_per_slot int not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(profile_id)
);

create table doctor_availability (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  unique(doctor_id, weekday, start_time)
);

create table clinic_holidays (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  date date not null,
  reason text,
  unique(clinic_id, date)
);

create table doctor_leaves (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors(id) on delete cascade,
  date date not null,
  reason text,
  unique(doctor_id, date)
);

create table patients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  dob date,
  notes text,
  unique(profile_id)
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid not null references doctors(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  slot_time timestamptz not null,
  status appointment_status not null default 'booked',
  token_no int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index uniq_doctor_slot_active on appointments (doctor_id, slot_time)
  where status not in ('cancelled','no_show');

create table consultation_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  doctor_id uuid not null references doctors(id) on delete cascade,
  diagnosis text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(appointment_id)
);

create table queue_sessions (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors(id) on delete cascade,
  session_date date not null,
  current_token int not null default 0,
  unique(doctor_id, session_date)
);

create table queue_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references queue_sessions(id) on delete cascade,
  appointment_id uuid not null references appointments(id) on delete cascade,
  position int not null,
  status queue_entry_status not null default 'waiting',
  unique(session_id, appointment_id)
);

create table queue_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references queue_sessions(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  channel notification_channel not null default 'email',
  payload jsonb not null default '{}',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  actor_role user_role,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb default '{}',
  ip text,
  created_at timestamptz not null default now()
);

create index idx_appointments_doctor_date on appointments(doctor_id, slot_time);
create index idx_appointments_patient on appointments(patient_id);
create index idx_queue_events_session on queue_events(session_id, created_at);
```

### 5.2 `002_rls.sql` (Phase 0)
```sql
alter table profiles enable row level security;
alter table patients enable row level security;
alter table doctors enable row level security;
alter table appointments enable row level security;
alter table consultation_notes enable row level security;
alter table queue_entries enable row level security;
alter table audit_logs enable row level security;

create or replace function current_role_name() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable;

create policy profiles_self on profiles for select using (id = auth.uid() or current_role_name() = 'admin');
create policy profiles_self_update on profiles for update using (id = auth.uid());

create policy patients_own on patients for select using (
  profile_id = auth.uid() or current_role_name() in ('admin','doctor')
);

create policy appt_patient on appointments for select using (
  patient_id in (select id from patients where profile_id = auth.uid())
  or doctor_id in (select id from doctors where profile_id = auth.uid())
  or current_role_name() = 'admin'
);
create policy appt_patient_write on appointments for insert with check (
  patient_id in (select id from patients where profile_id = auth.uid())
);

create policy notes_doctor_write on consultation_notes for all using (
  doctor_id in (select id from doctors where profile_id = auth.uid())
  or current_role_name() = 'admin'
);
create policy notes_patient_read on consultation_notes for select using (
  appointment_id in (
    select id from appointments where patient_id in (
      select id from patients where profile_id = auth.uid()
    )
  )
);

create policy queue_entries_access on queue_entries for select using (
  appointment_id in (
    select id from appointments where
      patient_id in (select id from patients where profile_id = auth.uid())
      or doctor_id in (select id from doctors where profile_id = auth.uid())
  )
  or current_role_name() = 'admin'
);

create policy audit_admin_only on audit_logs for select using (current_role_name() = 'admin');
```
**Public queue access note:** the public `/live-queue/[clinicId]` page never queries these tables directly with the anon key. It calls `/api/queue/:clinicId/{current,snapshot}` (Section 8), which runs server-side with the service-role key and returns only `{current_token, waiting_count}`. Realtime updates use a Supabase **Broadcast** channel (application-level message), not a Postgres Changes/CDC subscription — this keeps RLS strict while still allowing an unauthenticated kiosk page to receive live updates.

### 5.3 `003_agents.sql` (Phase 9 — build only when Phase 9 starts)
```sql
create type agent_output_type as enum ('suggestion','draft','prediction','approved_action');

create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  trigger_event text not null,
  input_payload jsonb default '{}',
  status text not null default 'pending',
  started_at timestamptz default now(),
  completed_at timestamptz
);

create table agent_outputs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references agent_runs(id) on delete cascade,
  output_type agent_output_type not null,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table agent_feedback (
  id uuid primary key default gen_random_uuid(),
  output_id uuid not null references agent_outputs(id) on delete cascade,
  reviewer_id uuid references profiles(id),
  action text not null,
  created_at timestamptz not null default now()
);

create table agent_policies (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  rule text not null,
  risk_threshold numeric default 0.5
);

create table risk_flags (
  id uuid primary key default gen_random_uuid(),
  related_table text not null,
  related_id uuid,
  risk_score numeric not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table agent_runs enable row level security;
alter table agent_outputs enable row level security;
create policy agent_admin_only on agent_runs for select using (current_role_name() = 'admin');
create policy agent_outputs_admin_only on agent_outputs for select using (current_role_name() = 'admin');
```

### 5.4 `004_analytics.sql` (Phase 6)
```sql
create table analytics_daily (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id),
  date date not null,
  appointments_booked int default 0,
  appointments_completed int default 0,
  no_show_count int default 0,
  cancellation_count int default 0,
  avg_wait_minutes numeric,
  unique(clinic_id, date)
);
```

---

## 6. AUTH
- Email/password (Supabase Auth) + Google OAuth via Authorization Code Flow + PKCE, exact redirect URI match.
- Flows: signup → verify email → login → forgot password → reset (single-use, time-limited token, neutral response, rate-limited) → logout (current session) → logout-all-devices (revoke all refresh tokens).
- Default role on signup = `patient`. Doctor/admin accounts provisioned by admin only — never auto-assigned, even from a Google Workspace domain.
- Role check required on every protected route handler, not just UI-level.
- Excluded from v1: MFA, super-admin tier (see Section 19).

---

## 7. ROUTES (Next.js App Router, inside `apps/web` — ~46 pages)
```
app/
 (marketing)/  page, features, how-it-works, about, contact, faq, privacy, terms
 (auth)/       login, register, forgot-password, reset-password, verify-email
 patient/      dashboard, appointments, appointments/new, appointments/[id],
               appointments/[id]/reschedule, live-queue, profile, notifications, settings
 doctor/       dashboard, queue, appointments, appointments/[id] (incl. diagnosis/notes form),
               patients, schedule, notifications, settings
 admin/        dashboard, doctors, doctors/new, doctors/[id], patients, patients/[id],
               appointments, schedules, clinics, queue-monitor, notifications,
               analytics, audit-logs, settings, roles-permissions
 live-queue/   [clinicId], [clinicId]/tv, [clinicId]/mobile
```
Public queue routes ship zero 3D/Framer Motion JS.

---

## 8. API CONTRACT (zod schemas required for every route)
| Method | Path | Zod Input | Auth |
|---|---|---|---|
| POST | /api/auth/signup | `{email, password, name}` | public |
| POST | /api/auth/login | `{email, password}` | public |
| POST | /api/auth/google | `{code}` | public |
| POST | /api/auth/forgot-password | `{email}` | public |
| POST | /api/auth/reset-password | `{token, password}` | public |
| POST | /api/auth/logout | `{allDevices?: boolean}` | session |
| GET/POST | /api/patient/appointments | — / `{doctorId, slotTime}` | patient |
| PATCH | /api/patient/appointments/:id/reschedule | `{newSlotTime}` | patient (own) |
| PATCH | /api/patient/appointments/:id/cancel | `{}` | patient (own) |
| GET | /api/doctor/today | — | doctor |
| POST | /api/doctor/queue/:id/start | `{}` | doctor (own) |
| POST | /api/doctor/queue/:id/complete | `{}` | doctor (own) |
| POST | /api/doctor/queue/:id/no-show | `{}` | doctor (own) |
| PATCH | /api/doctor/appointments/:id/notes | `{diagnosis?, notes?}` | doctor (own) |
| GET/POST/PATCH/DELETE | /api/admin/doctors[/:id] | doctor schema | admin |
| GET/POST/PATCH/DELETE | /api/admin/patients[/:id] | patient schema | admin |
| POST | /api/admin/clinics/:id/holidays | `{date, reason}` | admin |
| POST | /api/admin/doctors/:id/leaves | `{date, reason}` | admin |
| GET | /api/admin/analytics | — | admin |
| GET | /api/queue/:clinicId/current | — | public |
| GET | /api/queue/:clinicId/snapshot | — | public |

Every handler: validate with zod → check role → run in a `packages/queue` transaction → emit event → return typed response. Never mutate tables directly from client.

---

## 9. REALTIME QUEUE FLOW (exact steps)
1. `POST /doctor/queue/:id/complete` called.
2. **Single transaction (via `packages/queue`, shared by web + worker):** `appointments.status='completed'`, `queue_entries.status='completed'`, `queue_sessions.current_token += 1`, insert `queue_events(type='PATIENT_COMPLETED')`.
3. Publish to Supabase Realtime **Broadcast** channel `clinic:{clinicId}:queue` (and `doctor:{doctorId}:queue`) — payload = `{current_token, waiting_count}` only, never raw rows.
4. All subscribed clients (live-queue page, patient app, admin monitor) update from the broadcast payload only.
5. Client polls `/api/queue/:clinicId/snapshot` every 30s as fallback for missed broadcast events.

---

## 10. NOTIFICATIONS (multi-channel)
| Type | Channel(s) | Trigger |
|---|---|---|
| Booking confirmation | email | `APPOINTMENT_CREATED` |
| Reminder (24h before) | email + sms | scheduled job, `slot_time - 24h` |
| "You are next" / N patients ahead | sms (primary), email fallback | `QUEUE_ADVANCED` |
| Reschedule/cancellation notice | email | `APPOINTMENT_RESCHEDULED`, `APPOINTMENT_CANCELLED` |
| Delay alert | sms | queue-intelligence agent flags delay (Phase 9) |
| Password reset | email | `PASSWORD_RESET_REQUESTED` |
| Admin high-risk alert | email | audit/anomaly agent `risk_flags` insert (Phase 9) |

Providers: Resend (email); Twilio **or** MSG91 for SMS/WhatsApp — integrate one, not both. All sends are written to `notifications` (`status='pending'`) and picked up by `notification-worker` (Section 11) — never sent inline from an API route.

---

## 11. BACKGROUND WORKERS & JOB QUEUES (BullMQ + Redis, inside `apps/worker`)
| Worker | Queue name | Job types | Responsibility |
|---|---|---|---|
| notification-worker | `notification-queue` | send-email, send-sms, send-whatsapp | Consume pending `notifications` rows, call provider adapter, update status, retry with backoff |
| queue-worker | `queue-queue` | recalc-eta, delay-check | Recompute ETA/waiting count on `PATIENT_CHECKED_IN` / `QUEUE_ADVANCED` |
| analytics-worker | `analytics-queue` | daily-rollup | Nightly cron: aggregate into `analytics_daily` |
| ai-worker | `ai-queue` | run-agent | Consume domain events (Section 12.1), execute bounded agent, write `agent_outputs` |

**Rule:** workers never receive direct client requests and never write to `appointments`/`queue_*` except via the shared `packages/queue` service methods the API also uses — logic is never duplicated between web and worker.

---

## 12. AI AGENTS — FULL SPEC (Phase 9, event-driven, bounded)

### 12.1 Event catalog
`USER_REGISTERED · EMAIL_VERIFIED · PASSWORD_RESET_REQUESTED · PASSWORD_RESET_COMPLETED · GOOGLE_LOGIN_COMPLETED · APPOINTMENT_CREATED · APPOINTMENT_CANCELLED · APPOINTMENT_RESCHEDULED · PATIENT_CHECKED_IN · DOCTOR_STARTED_CONSULTATION · PATIENT_COMPLETED · QUEUE_ADVANCED · NO_SHOW_MARKED · ADMIN_USER_UPDATED · ADMIN_USER_DELETED · ROLE_CHANGED · QUEUE_OVERRIDE_USED · DAY_CLOSED`

### 12.2 Agents (8 total, phased rollout per Section 20 Phase 9)
| # | Agent | Job | Trigger events | Writes core state? |
|---|---|---|---|---|
| 1 | Reminder agent | Confirmations, "you're next," delay alerts | APPOINTMENT_CREATED, QUEUE_ADVANCED, PATIENT_COMPLETED, APPOINTMENT_RESCHEDULED | No |
| 2 | Queue intelligence agent | ETA prediction, bottleneck detection | PATIENT_CHECKED_IN, DOCTOR_STARTED_CONSULTATION, PATIENT_COMPLETED, QUEUE_ADVANCED | No |
| 3 | Scheduling agent | Overbooking warnings, load balancing | APPOINTMENT_CREATED, APPOINTMENT_CANCELLED, DOCTOR_AVAILABILITY_UPDATED | No |
| 4 | Admin analytics agent | KPI summaries, no-show/cancellation trends | daily/weekly batch, DAY_CLOSED | No |
| 5 | Support/chat agent | Booking FAQ, guidance | user chat session | No |
| 6 | Audit/anomaly agent | Suspicious admin behavior detection | ADMIN_USER_UPDATED, ADMIN_USER_DELETED, ROLE_CHANGED, QUEUE_OVERRIDE_USED | No |
| 7 (optional) | Clinical notes assistant | Draft structured notes from dictation | doctor-initiated | No |
| 8 (optional) | Growth/retention agent | Re-engagement messages | scheduled batch | No |

### 12.3 Pipelines
- **A — Queue update:** `PATIENT_COMPLETED` → queue service advances `current_token` (deterministic) → broadcast published → queue-intelligence agent recalculates ETA → reminder agent sends "you are next" → admin-analytics agent increments daily counters.
- **B — Booking:** `APPOINTMENT_CREATED` → reminder agent sends confirmation → scheduling agent checks overbooking pattern → support/chat context updated.
- **C — Admin delete/edit:** `ADMIN_USER_UPDATED`/`ADMIN_USER_DELETED` → audit/anomaly agent records action + risk score → policy engine checks approval threshold → if high-risk, notification-worker alerts admin via email.

### 12.4 Safety rules (non-negotiable)
- Agents cannot modify `appointments`/`queue_*` tables directly — only deterministic service methods can.
- Every output tagged `suggestion|draft|prediction|approved_action` in `agent_outputs.output_type`.
- High-risk outputs (per `agent_policies.risk_threshold`) require human approval before any downstream action fires.
- Full run history retained in `agent_runs`, `agent_outputs`, `agent_feedback`.

---

## 13. ANALYTICS & REPORTING (Admin dashboard KPIs)
| Metric | Source | Refresh |
|---|---|---|
| Appointments booked/completed per day | `analytics_daily` | nightly |
| No-show rate | `no_show_count / appointments_booked` | nightly |
| Cancellation rate | `cancellation_count / appointments_booked` | nightly |
| Avg / p90 queue wait time | computed from `queue_events` timestamps | nightly |
| Doctor throughput (patients/hr) | `appointments_completed` ÷ active hours | nightly |
| Busiest hours (heatmap) | `appointments.slot_time` histogram | nightly |
| Doctor utilization % | booked slots ÷ available slots | nightly |
| Notification delivery rate | `notifications.status='sent'` ÷ total | nightly |
| Agent job backlog / failure rate (Phase 9) | `agent_runs.status` counts | real-time |

`analytics-worker` populates `analytics_daily` via nightly cron; `/admin/analytics` reads from this table only — never computes live aggregates on page load.

---

## 14. OBSERVABILITY
**Application:** Sentry error tracking · API response time · queue transition latency · realtime broadcast failures · failed notification rate · auth success/failure rate · password-reset request/completion rate · OAuth callback errors · admin destructive-action logs · suspicious login pattern detection.
**Agent layer (Phase 9):** input event count · run duration · model/provider used · cost per run · failure count · human override rate — queryable from `agent_runs`/`agent_feedback`.

---

## 15. FRONTEND STRUCTURE (inside `apps/web`)
```
apps/web/src/
 app/                 # routes per Section 7
 components/{ui, layout, marketing, dashboard, queue, motion, three}/
 features/{auth, appointments, queue, doctors, patients, admin}/
 lib/{api, hooks, utils, permissions}/
```
Shared components from `packages/ui`; shared types/zod schemas from `packages/types`.

---

## 16. DESIGN SYSTEM
Calm, medical, premium. Soft neutrals + one accent color. Clean cards, subtle shadows. 3D/motion confined to landing hero only. Dashboards prioritize clarity over drama.

---

## 17. PERFORMANCE / ANDROID CHECKLIST
- [ ] 3D hero dynamically imported (`next/dynamic`, `ssr:false`), never in dashboard bundles
- [ ] Route-based code splitting confirmed via bundle analyzer
- [ ] Animate only `transform`/`opacity`; respect `prefers-reduced-motion`
- [ ] WebP/AVIF images, skeleton loaders (no blocking spinners)
- [ ] Touch targets ≥44×44px, mobile-first layouts
- [ ] Live-queue page ships zero 3D/heavy-animation JS

---

## 18. SECURITY CHECKLIST
HTTPS · secure cookies · rate limiting (login/reset/admin) · zod on all I/O · CSRF on cookie mutations · OAuth exact redirect URI + PKCE · neutral password-reset responses · no internal error leakage · audit log on every admin write · RLS + API-level role checks (defense in depth) · IP/device logged on failed logins.

---

## 19. SCOPE BOUNDARIES

**Deferred to v2 — per your original research, sequenced not excluded:**
- AI agents beyond the MVP-3 (Section 12.2, rows 3–8) — built in Phase 9's later sub-stages
- Kiosk self-check-in
- File attachments / prescription uploads (`consultation_notes` is text-only in v1)
- Multi-clinic switching UI (schema already supports multiple `clinic_id`s)

**True exclusions — scope guardrails, not requested in your research either:**
- Microservices architecture
- Native mobile apps (iOS/Android)
- Payments/billing integration
- Video consultation
- MFA / super-admin tier

---

## 20. BUILD PHASES + CHECKPOINTS

### PHASE 0 — Foundation & Monorepo Scaffold
Deliverables: pnpm+Turborepo skeleton (Section 4), Next.js+TS+Tailwind+shadcn in `apps/web`, run `001_init.sql` + `002_rls.sql`.
**CHECKPOINT 0**
- [ ] `pnpm install && pnpm build` — zero errors across workspace
- [ ] Both migrations run clean on Supabase
- [ ] Base layouts render for all 4 route groups
- [ ] No 3D/heavy JS outside `(marketing)`

### PHASE 1 — Auth & Roles
**CHECKPOINT 1**
- [ ] Signup→verify→login works manually end-to-end
- [ ] Google OAuth round-trip succeeds, role defaults to `patient`
- [ ] Reset password: neutral response + single-use token confirmed
- [ ] RLS test: patient A cannot `select` patient B's row

### PHASE 2 — Appointment Engine + Consultation Notes
**CHECKPOINT 2**
- [ ] Double-booking rejected by `uniq_doctor_slot_active` (DB-level test)
- [ ] Reschedule/cancel update status + emit events correctly
- [ ] Doctor can write diagnosis/notes; patient can read own only
- [ ] Patient history reflects all state changes

### PHASE 3 — Notifications & Background Workers
**CHECKPOINT 3**
- [ ] Booking confirmation email fires on `APPOINTMENT_CREATED` (verified in provider dashboard)
- [ ] SMS "you are next" fires on `QUEUE_ADVANCED`
- [ ] `notification-worker` runs as its own process, not inline in an API route
- [ ] Failed send retries with backoff; `notifications.status` reflects outcome

### PHASE 4 — Role Dashboards (Patient + Doctor)
**CHECKPOINT 4**
- [ ] Doctor "complete" action updates own dashboard instantly
- [ ] Patient dashboard shows correct upcoming appointment + queue position
- [ ] Cross-role write attempt returns 403 (tested)

### PHASE 5 — Realtime Queue
**CHECKPOINT 5**
- [ ] Marking "completed" updates `/live-queue/[clinicId]` in <2s, no refresh
- [ ] Broadcast disconnect/reconnect → fallback poll shows correct token
- [ ] Public queue payload contains zero PII (inspect network tab)

### PHASE 6 — Admin Console + Analytics
**CHECKPOINT 6**
- [ ] Every destructive admin action writes to `audit_logs`
- [ ] Deletes are soft (`deleted_at` set) — no hard deletes on users
- [ ] `analytics_daily` populated nightly; `/admin/analytics` shows real KPIs, not mock data
- [ ] Busiest-hours heatmap reflects real appointment timestamps

### PHASE 7 — Performance & Polish
**CHECKPOINT 7**
- [ ] Lighthouse mobile ≥85 on landing + live-queue
- [ ] Bundle analyzer confirms no `three`/`framer-motion` in dashboard chunks
- [ ] Tested on throttled/low-end Android emulation profile

### PHASE 8 — Deploy (CI/CD) + Observability
**CHECKPOINT 8**
- [ ] PR triggers preview deploy automatically
- [ ] Merge to `main` deploys production automatically
- [ ] `db-migrate.yml` applies a test migration safely on staging before production
- [ ] Deliberately-triggered error appears in Sentry
- [ ] `nightly-jobs.yml` runs smoke test + dependency audit successfully

### PHASE 9 — AI Agents (phased rollout, optional/post-v1)
- **MVP (3):** reminder, queue-intelligence, support/chat
- **Production v1 (+2 = 5):** scheduling, admin-analytics
- **Advanced (+3 = 8, only if requested):** audit/anomaly, clinical-notes, growth/retention
**CHECKPOINT 9**
- [ ] All agent outputs land in `agent_outputs` as suggestion/draft/prediction only — verified by code review that no agent path writes to `appointments`/`queue_*`
- [ ] `agent_runs` logs input event, duration, provider for every run
- [ ] High-risk `risk_flags` route to human approval before any downstream action

---

## 21. TEST PLAN
- **Unit (Vitest):** every use-case handler (Section 3) — happy + rejection path.
- **E2E (Playwright), minimum flows:**
  1. Patient signup → book → reschedule → cancel
  2. Doctor login → start → complete → live-queue reflects change
  3. Doctor adds diagnosis/notes → patient sees it in history, other patients cannot
  4. Admin creates doctor → sets availability/holiday → deletes (soft) → audit log confirms
- **Seed data:** 1 clinic, 3 doctors, 10 patients, 20 appointments spread across today+tomorrow — `pnpm seed`.

---

## 22. CI/CD PIPELINE
Stages: install → lint → type-check → unit tests → build → Playwright E2E (against preview URL) → dependency/security scan → deploy.
Workflows: `ci.yml`, `preview-deploy.yml`, `production-deploy.yml`, `db-migrate.yml` (applies Supabase migrations safely when migration files change), `nightly-jobs.yml` (backup validation, smoke tests, dependency audit, synthetic queue test).
Branches: `main`=production, `develop`=staging, feature branches short-lived.

---

## 23. ENV VARS
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
RESEND_API_KEY
TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER   (or MSG91_API_KEY)
SENTRY_DSN
UPSTASH_REDIS_URL
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
ANTHROPIC_API_KEY or OPENAI_API_KEY   (Phase 9 only)
VERCEL_TOKEN / VERCEL_ORG_ID / VERCEL_PROJECT_ID
```