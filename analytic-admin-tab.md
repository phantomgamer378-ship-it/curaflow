# AUDIT LOG ENHANCEMENT + REALTIME ANALYTICS

## 0. SCOPE
Two independent enhancements to `/admin/audit-logs` and `/admin/analytics`. Audit log changes are pure UX/performance polish — no architecture change. Analytics changes add a **realtime "Today" layer on top of, not instead of,** the existing nightly rollup (`analytics_daily`, Section 13 of the master prompt) — historical trend charts are unaffected.

---

## PART A — AUDIT LOG

### A1. INDEXES (`014_audit_log_indexes.sql`)
```sql
create index idx_audit_logs_created_at on audit_logs(created_at desc, id desc); -- supports cursor pagination
create index idx_audit_logs_actor on audit_logs(actor_id);
create index idx_audit_logs_action on audit_logs(action);
create index idx_audit_logs_resource on audit_logs(resource_type, resource_id);
```
No schema change needed beyond indexes — the existing columns already support everything below.

### A2. UX REDESIGN
- **Timeline grouping**, not a flat table: "Today," "Yesterday," "Earlier" section headers — far more scannable than an undifferentiated list once logs accumulate.
- **Icon + color per action type:** create = green plus, update = blue pencil, delete = red trash, approve = green check, reject = red x. Consistent with the semantic color rules from the dark-mode design doc (green = positive, red = destructive only).
- **Actor shown with role badge** (e.g., "Dr. Sharma · doctor" or "Admin User · admin") — who did it matters as much as what happened.
- **Relative timestamps** ("2 minutes ago"), exact timestamp on hover — standard pattern, avoids a wall of raw ISO strings.
- **Expandable row** shows `metadata` as a formatted key-value list, not a raw JSON dump — readable without requiring the admin to parse JSON mentally.
- **Resource deep-link:** clicking the resource name (e.g., "Doctor: Dr. Sharma") navigates to that resource's admin page if it still exists, rather than being static text.

### A3. SORTING & FILTERING
- **Sortable columns:** timestamp (default: newest first), actor, action type, resource type — click header to sort, click again to reverse.
- **Filters:** date range picker, actor (searchable dropdown), action type (multi-select), resource type (multi-select) — combinable, not mutually exclusive.
- **Search bar:** full-text across actor name, action, and resource type in one field.
- **Pagination: cursor-based, not offset-based.** Audit logs are written continuously — offset pagination (`LIMIT/OFFSET`) will skip or duplicate rows as new entries are inserted while an admin is paging through. Cursor pagination (`created_at, id`) stays stable regardless of new inserts.

### A4. EXPORT
`GET /api/admin/audit-logs/export` — respects whatever filters are currently applied (not an unconditional full-history dump), returns CSV. Standard requirement for compliance reporting — audit logs frequently need to leave the app entirely for external review.

### A5. API
```
GET /api/admin/audit-logs?cursor=&limit=25&actorId=&action=&resourceType=&dateFrom=&dateTo=&search=&sortBy=created_at&sortDir=desc
→ { logs: [...], nextCursor, hasMore }

GET /api/admin/audit-logs/export?[same filters] → CSV
```

---

## PART B — REALTIME ANALYTICS

### B1. ARCHITECTURE — WHAT STAYS, WHAT'S NEW
| Layer | Source | Unchanged? |
|---|---|---|
| Historical trends (7-day, 30-day charts, previous days' KPIs) | `analytics_daily`, nightly rollup | **Unchanged** — Section 13 of the master prompt |
| **Today's live numbers** | New: realtime broadcast, computed on each relevant event | **New addition** |

### B2. LIVE "TODAY" STATS — BROADCAST MECHANISM
Reuses the exact broadcast pattern already built for the live queue (Section 9 of the appointment-queue deep dive) — a new channel, same technique, not new infrastructure:
```
async function broadcastAdminLiveStats(clinicId) {
  const stats = await computeLiveStats(clinicId)
  await supabase.channel(`clinic:${clinicId}:admin-live-stats`)
    .send({ type: 'broadcast', event: 'stats-update', payload: stats })
}
```
Called from the same handlers that already broadcast queue updates: `createAppointment`, `markPatientDone`, `skip`, `remove`, `start` — one extra broadcast call appended to each, not a new polling system.

```sql
-- computeLiveStats(clinicId) — cheap at this app's scale (~100 users/day), no caching needed
select
  count(*) filter (where a.created_at::date = current_date) as appointments_today,
  count(*) filter (where qe.status = 'waiting') as patients_waiting_now,
  (select count(*) from doctors where clinic_id = $1 and is_online = true) as doctors_online,
  count(*) filter (where a.status = 'no_show' and a.updated_at::date = current_date) as no_shows_today
from appointments a
left join queue_entries qe on qe.appointment_id = a.id
where a.clinic_id = $1;
```
**Average wait time** is the one stat that isn't cheap to compute per-event — it's refreshed on a 60-second interval by `queue-worker` instead of on every single event, and broadcast as a partial update to the same channel. Worth knowing this one field is "near-real-time" (≤60s lag) rather than truly instant, unlike the counts above.

`/admin/analytics` subscribes to `clinic:{clinicId}:admin-live-stats` the same way `/patient/live-queue` subscribes to its queue channel — no polling loop needed.

### B3. SORTABLE DOCTOR PERFORMANCE TABLE (today, live — not historical)
| Doctor | Patients Seen Today | Avg Consultation Time | No-Shows Today |
|---|---|---|---|
Click any column header to sort ascending/descending; default sort is Patients Seen, descending. Deliberately scoped to **today only** and live-computed — this directly satisfies "realtime analysis" without requiring a schema change to the historical rollup. If you also want *historical* per-doctor comparison (e.g., "who had the best no-show rate last month"), that needs `analytics_daily` to gain a `doctor_id` column and a per-doctor nightly row alongside the existing clinic-wide one — flagging this as a clean v1.3 addition rather than building it now, since it's a real schema change and you didn't ask for the historical version specifically.

```sql
-- live doctor performance query, today only
select
  d.id as doctor_id,
  p.name as doctor_name,
  count(*) filter (where a.status = 'completed' and a.updated_at::date = current_date) as patients_seen_today,
  count(*) filter (where a.status = 'no_show' and a.updated_at::date = current_date) as no_shows_today,
  avg(extract(epoch from (qe.updated_at - qe.checked_in_at)) / 60)
    filter (where a.status = 'completed' and a.updated_at::date = current_date) as avg_consultation_minutes
from doctors d
join profiles p on p.id = d.profile_id
left join appointments a on a.doctor_id = d.id
left join queue_entries qe on qe.appointment_id = a.id
where d.clinic_id = $1
group by d.id, p.name;
```

---

## CHECKPOINT
**Audit log:**
- [ ] Logs group correctly under Today/Yesterday/Earlier
- [ ] Sorting by each column works both directions
- [ ] Combined filters (date range + actor + action type) narrow results correctly, not just the last-applied filter
- [ ] Paging through logs while new entries are being written doesn't skip or duplicate rows (cursor pagination verified under concurrent writes)
- [ ] Export respects active filters — verify by filtering to one actor, exporting, and confirming the CSV contains only that actor's rows

**Realtime analytics:**
- [ ] `/admin/analytics` "Today" panel updates within ~2s of a queue action, with zero manual refresh
- [ ] Historical charts (7-day/30-day) are unaffected — still reading from `analytics_daily`, not recomputing live
- [ ] Average wait time updates within 60s, not instantly — confirmed this is documented/expected behavior, not a bug
- [ ] Doctor performance table sorts correctly by each column and reflects only today's data
- [ ] Live stats reset correctly at midnight/day rollover (verify `current_date` filters behave as expected across the boundary)