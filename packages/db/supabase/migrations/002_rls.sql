-- Defense in depth: application handlers perform their own ownership and role
-- checks in addition to these database policies.

alter table public.profiles enable row level security;
alter table public.clinics enable row level security;
alter table public.patients enable row level security;
alter table public.doctors enable row level security;
alter table public.doctor_availability enable row level security;
alter table public.clinic_holidays enable row level security;
alter table public.doctor_leaves enable row level security;
alter table public.appointments enable row level security;
alter table public.consultation_notes enable row level security;
alter table public.queue_sessions enable row level security;
alter table public.queue_entries enable row level security;
alter table public.queue_events enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_role_name()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and deleted_at is null;
$$;

revoke all on function public.current_role_name() from public;
grant execute on function public.current_role_name() to authenticated;

create policy profiles_self_read
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.current_role_name() = 'admin');

create policy profiles_self_update
  on public.profiles for update
  to authenticated
  using (id = auth.uid() and deleted_at is null)
  with check (id = auth.uid());

create policy clinics_authenticated_read
  on public.clinics for select
  to authenticated
  using (true);

create policy doctors_authenticated_read
  on public.doctors for select
  to authenticated
  using (deleted_at is null or public.current_role_name() = 'admin');

create policy availability_authenticated_read
  on public.doctor_availability for select
  to authenticated
  using (true);

create policy holidays_authenticated_read
  on public.clinic_holidays for select
  to authenticated
  using (true);

create policy leaves_authenticated_read
  on public.doctor_leaves for select
  to authenticated
  using (true);

create policy patients_own_read
  on public.patients for select
  to authenticated
  using (
    profile_id = auth.uid()
    or public.current_role_name() in ('admin','doctor')
  );

create policy appointments_participant_read
  on public.appointments for select
  to authenticated
  using (
    patient_id in (select id from public.patients where profile_id = auth.uid())
    or doctor_id in (select id from public.doctors where profile_id = auth.uid())
    or public.current_role_name() = 'admin'
  );

create policy appointments_patient_insert
  on public.appointments for insert
  to authenticated
  with check (
    patient_id in (select id from public.patients where profile_id = auth.uid())
    and public.current_role_name() = 'patient'
  );

create policy notes_doctor_manage
  on public.consultation_notes for all
  to authenticated
  using (
    doctor_id in (select id from public.doctors where profile_id = auth.uid())
    or public.current_role_name() = 'admin'
  )
  with check (
    doctor_id in (select id from public.doctors where profile_id = auth.uid())
    or public.current_role_name() = 'admin'
  );

create policy notes_patient_read
  on public.consultation_notes for select
  to authenticated
  using (
    appointment_id in (
      select id
      from public.appointments
      where patient_id in (
        select id from public.patients where profile_id = auth.uid()
      )
    )
  );

create policy queue_sessions_clinical_read
  on public.queue_sessions for select
  to authenticated
  using (
    doctor_id in (select id from public.doctors where profile_id = auth.uid())
    or public.current_role_name() = 'admin'
  );

create policy queue_entries_participant_read
  on public.queue_entries for select
  to authenticated
  using (
    appointment_id in (
      select id from public.appointments where
        patient_id in (select id from public.patients where profile_id = auth.uid())
        or doctor_id in (select id from public.doctors where profile_id = auth.uid())
    )
    or public.current_role_name() = 'admin'
  );

create policy notifications_own_read
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid() or public.current_role_name() = 'admin');

create policy audit_admin_only
  on public.audit_logs for select
  to authenticated
  using (public.current_role_name() = 'admin');

-- Public queue screens do not receive table grants. Their BFF endpoint uses the
-- service role and exposes only current_token and waiting_count via Broadcast.
