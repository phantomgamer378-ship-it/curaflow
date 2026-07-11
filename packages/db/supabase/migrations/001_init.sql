-- CuraFlow Phase 0 core schema.
-- Appointment and queue state is owned by the backend; clients never write
-- directly to these tables.

create extension if not exists pgcrypto;

create type public.user_role as enum ('patient','doctor','admin');
create type public.appointment_status as enum ('booked','confirmed','checked_in','in_consultation','completed','cancelled','no_show');
create type public.queue_entry_status as enum ('waiting','in_consultation','completed','no_show');
create type public.notification_channel as enum ('email','sms','whatsapp');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'patient',
  name text not null,
  phone text,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  open_time time not null default '09:00',
  close_time time not null default '17:00',
  created_at timestamptz not null default now()
);

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  specialty text,
  slot_duration_min int not null default 15 check (slot_duration_min > 0),
  max_patients_per_slot int not null default 1 check (max_patients_per_slot > 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(profile_id)
);

create table public.doctor_availability (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (start_time < end_time),
  unique(doctor_id, weekday, start_time)
);

create table public.clinic_holidays (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  date date not null,
  reason text,
  unique(clinic_id, date)
);

create table public.doctor_leaves (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  date date not null,
  reason text,
  unique(doctor_id, date)
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  dob date,
  notes text,
  unique(profile_id)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  slot_time timestamptz not null,
  status public.appointment_status not null default 'booked',
  token_no int check (token_no is null or token_no > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index uniq_doctor_slot_active
  on public.appointments (doctor_id, slot_time)
  where status not in ('cancelled','no_show');

create table public.consultation_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  diagnosis text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(appointment_id)
);

create table public.queue_sessions (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  session_date date not null,
  current_token int not null default 0 check (current_token >= 0),
  unique(doctor_id, session_date)
);

create table public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.queue_sessions(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  position int not null check (position > 0),
  status public.queue_entry_status not null default 'waiting',
  unique(session_id, appointment_id)
);

create table public.queue_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.queue_sessions(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel public.notification_channel not null default 'email',
  payload jsonb not null default '{}',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  actor_role public.user_role,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb default '{}',
  ip text,
  created_at timestamptz not null default now()
);

create index idx_appointments_doctor_date on public.appointments(doctor_id, slot_time);
create index idx_appointments_patient on public.appointments(patient_id);
create index idx_queue_events_session on public.queue_events(session_id, created_at);
create index idx_notifications_pending on public.notifications(status, created_at);
