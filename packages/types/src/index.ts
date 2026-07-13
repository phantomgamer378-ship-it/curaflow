import { z } from "zod";

// ─── Enums ───────────────────────────────────────────────────────────
export const userRoleSchema = z.enum(["patient", "doctor", "admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const appointmentStatusSchema = z.enum([
  "booked",
  "confirmed",
  "checked_in",
  "in_consultation",
  "completed",
  "cancelled",
  "no_show",
]);
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

export const queueEntryStatusSchema = z.enum([
  "waiting",
  "in_consultation",
  "completed",
  "no_show",
]);
export type QueueEntryStatus = z.infer<typeof queueEntryStatusSchema>;

export const notificationChannelSchema = z.enum(["email", "sms", "whatsapp"]);
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;

// ─── Auth Schemas ────────────────────────────────────────────────────
export const signupInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["patient", "doctor", "admin"]).optional(),
  phone: z.string().optional(),
});
export type SignupInput = z.infer<typeof signupInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const googleAuthInputSchema = z.object({
  code: z.string().min(1).optional(),
  next: z.string().startsWith("/").optional(),
}).optional().default({});
export type GoogleAuthInput = z.infer<typeof googleAuthInputSchema>;

export const forgotPasswordInputSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

export const logoutInputSchema = z.object({
  allDevices: z.boolean().optional().default(false),
});
export type LogoutInput = z.infer<typeof logoutInputSchema>;

// ─── Appointment Schemas ─────────────────────────────────────────────
export const createAppointmentInputSchema = z.object({
  doctorId: z.string().uuid(),
  slotTime: z.string().datetime(),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentInputSchema>;

export const rescheduleAppointmentInputSchema = z.object({
  newSlotTime: z.string().datetime(),
});
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentInputSchema>;

export const consultationNotesInputSchema = z.object({
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
});
export type ConsultationNotesInput = z.infer<typeof consultationNotesInputSchema>;

// ─── Admin Schemas ───────────────────────────────────────────────────
export const createDoctorInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  clinicId: z.string().uuid(),
  specialty: z.string().nullable().optional(),
  slotDurationMin: z.number().int().min(5).max(120).default(15),
  maxPatientsPerSlot: z.number().int().min(1).max(10).default(1),
});
export type CreateDoctorInput = z.infer<typeof createDoctorInputSchema>;

export const doctorAvailabilityInputSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});
export type DoctorAvailabilityInput = z.infer<typeof doctorAvailabilityInputSchema>;

export const clinicHolidayInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
});
export type ClinicHolidayInput = z.infer<typeof clinicHolidayInputSchema>;

export const doctorLeaveInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
});
export type DoctorLeaveInput = z.infer<typeof doctorLeaveInputSchema>;

// ─── Queue Schemas ───────────────────────────────────────────────────
export const publicQueueSnapshotSchema = z.object({
  doctors: z.array(z.object({
    doctor_id: z.string(),
    doctor_name: z.string(),
    current_token: z.number().int().nonnegative(),
    waiting_count: z.number().int().nonnegative(),
  })),
});
export type PublicQueueSnapshot = z.infer<typeof publicQueueSnapshotSchema>;

// ─── Event System ────────────────────────────────────────────────────
export const domainEventTypes = [
  "USER_REGISTERED",
  "EMAIL_VERIFIED",
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_RESET_COMPLETED",
  "GOOGLE_LOGIN_COMPLETED",
  "APPOINTMENT_CREATED",
  "APPOINTMENT_CANCELLED",
  "APPOINTMENT_RESCHEDULED",
  "PATIENT_CHECKED_IN",
  "DOCTOR_STARTED_CONSULTATION",
  "PATIENT_COMPLETED",
  "QUEUE_ADVANCED",
  "NO_SHOW_MARKED",
  "ADMIN_USER_UPDATED",
  "ADMIN_USER_DELETED",
  "ROLE_CHANGED",
  "QUEUE_OVERRIDE_USED",
  "DAY_CLOSED",
] as const;

export const domainEventTypeSchema = z.enum(domainEventTypes);
export type DomainEventType = z.infer<typeof domainEventTypeSchema>;

export const domainEventSchema = z.object({
  id: z.string().uuid(),
  type: domainEventTypeSchema,
  occurredAt: z.string().datetime(),
  payload: z.record(z.unknown()),
});
export type DomainEvent = z.infer<typeof domainEventSchema>;

// ─── API Response ────────────────────────────────────────────────────
export type ApiResponse<T = unknown> = {
  ok: true;
  data: T;
} | {
  ok: false;
  error: string;
  details?: unknown;
};

export const apiErrorSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  details: z.unknown().optional(),
});

export const signupResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    userId: z.string().uuid().optional(),
    confirmationRequired: z.boolean(),
  }),
});

export const loginResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    userId: z.string().uuid(),
    role: userRoleSchema,
    redirectTo: z.string().startsWith("/"),
  }),
});

export const googleAuthResponseSchema = z.object({
  ok: z.literal(true),
  data: z.union([
    z.object({ url: z.string().url() }),
    z.object({
      userId: z.string().uuid(),
      role: userRoleSchema,
      redirectTo: z.string().startsWith("/"),
    }),
  ]),
});

export const messageResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    message: z.string(),
  }),
});
