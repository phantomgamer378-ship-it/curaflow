-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('patient', 'doctor', 'admin');
CREATE TYPE "AppointmentStatus" AS ENUM ('booked', 'confirmed', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show');
CREATE TYPE "QueueEntryStatus" AS ENUM ('waiting', 'in_consultation', 'completed', 'no_show');
CREATE TYPE "NotificationChannel" AS ENUM ('email', 'sms', 'whatsapp');

-- CreateTable: profiles
CREATE TABLE "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'patient',
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateTable: clinics
CREATE TABLE "clinics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "openTime" TEXT NOT NULL DEFAULT '09:00',
    "closeTime" TEXT NOT NULL DEFAULT '17:00',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable: doctors
CREATE TABLE "doctors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profileId" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "specialty" TEXT,
    "slotDurationMin" INTEGER NOT NULL DEFAULT 15,
    "maxPatientsPerSlot" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "doctors_profileId_key" ON "doctors"("profileId");

-- CreateTable: doctor_availability
CREATE TABLE "doctor_availability" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "doctorId" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    CONSTRAINT "doctor_availability_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "doctor_availability_doctorId_weekday_startTime_key" ON "doctor_availability"("doctorId", "weekday", "startTime");

-- CreateTable: clinic_holidays
CREATE TABLE "clinic_holidays" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinicId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,
    CONSTRAINT "clinic_holidays_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "clinic_holidays_clinicId_date_key" ON "clinic_holidays"("clinicId", "date");

-- CreateTable: doctor_leaves
CREATE TABLE "doctor_leaves" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "doctorId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,
    CONSTRAINT "doctor_leaves_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "doctor_leaves_doctorId_date_key" ON "doctor_leaves"("doctorId", "date");

-- CreateTable: patients
CREATE TABLE "patients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profileId" UUID NOT NULL,
    "dob" DATE,
    "notes" TEXT,
    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "patients_profileId_key" ON "patients"("profileId");

-- CreateTable: appointments
CREATE TABLE "appointments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patientId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "slotTime" TIMESTAMPTZ NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'booked',
    "tokenNo" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uniq_doctor_slot_active" ON "appointments"("doctorId", "slotTime");
CREATE INDEX "appointments_doctorId_slotTime_idx" ON "appointments"("doctorId", "slotTime");
CREATE INDEX "appointments_patientId_idx" ON "appointments"("patientId");

-- CreateTable: consultation_notes
CREATE TABLE "consultation_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appointmentId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "diagnosis" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "consultation_notes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "consultation_notes_appointmentId_key" ON "consultation_notes"("appointmentId");

-- CreateTable: queue_sessions
CREATE TABLE "queue_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "doctorId" UUID NOT NULL,
    "sessionDate" DATE NOT NULL,
    "currentToken" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "queue_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "queue_sessions_doctorId_sessionDate_key" ON "queue_sessions"("doctorId", "sessionDate");

-- CreateTable: queue_entries
CREATE TABLE "queue_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "QueueEntryStatus" NOT NULL DEFAULT 'waiting',
    CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "queue_entries_appointmentId_key" ON "queue_entries"("appointmentId");
CREATE UNIQUE INDEX "queue_entries_sessionId_appointmentId_key" ON "queue_entries"("sessionId", "appointmentId");

-- CreateTable: queue_events
CREATE TABLE "queue_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "queue_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "queue_events_sessionId_createdAt_idx" ON "queue_events"("sessionId", "createdAt");

-- CreateTable: notifications
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'email',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notifications_status_createdAt_idx" ON "notifications"("status", "createdAt");

-- CreateTable: audit_logs
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actorId" UUID,
    "actorRole" "UserRole",
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ip" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKeys
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clinic_holidays" ADD CONSTRAINT "clinic_holidays_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doctor_leaves" ADD CONSTRAINT "doctor_leaves_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patients" ADD CONSTRAINT "patients_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consultation_notes" ADD CONSTRAINT "consultation_notes_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "queue_sessions" ADD CONSTRAINT "queue_sessions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "queue_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "queue_events" ADD CONSTRAINT "queue_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "queue_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
