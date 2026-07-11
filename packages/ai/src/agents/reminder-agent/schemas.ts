import { z } from "zod";
import type { BaseAgentState } from "../../core/base-state";

export interface ReminderAgentState extends BaseAgentState {
  notification_type?: string;
  channel?: string;
  tone?: string;
}

export const ReminderInputSchema = z.object({
  type: z.enum(["booking_confirmation", "reminder", "delay", "reschedule", "cancellation"]),
  patient_name: z.string(),
  doctor_name: z.string(),
  clinic_name: z.string(),
  appointment_date: z.string(),
  appointment_time: z.string(),
  token_no: z.number().optional(),
  channel: z.enum(["email", "sms", "whatsapp"]).default("email"),
  tone: z.enum(["formal", "friendly", "urgent"]).default("friendly"),
  additional_context: z.string().optional(),
});
