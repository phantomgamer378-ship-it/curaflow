import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export * from "@prisma/client";

// SQLite uses plain strings instead of PG enums. Export type aliases for RBAC.
export type UserRole = "patient" | "doctor" | "admin";
export type AppointmentStatus = "booked" | "confirmed" | "checked_in" | "in_consultation" | "completed" | "cancelled" | "no_show";
export type QueueEntryStatus = "waiting" | "in_consultation" | "completed" | "no_show";
export type NotificationChannel = "email" | "sms" | "whatsapp";

export type DatabaseHealth = {
  connected: boolean;
  checkedAt: string;
};

export const MIGRATIONS_PATH = "packages/db/prisma/migrations";
