import { z } from "zod";
import type { BaseAgentState } from "../../core/base-state";

/** Extended state for the Appointment Assistant agent. */
export interface AppointmentAssistantState extends BaseAgentState {
  /** Resolved patient record ID. */
  patient_id: string;
  /** Doctor the patient is asking about. */
  selected_doctor_id?: string;
  /** Date the patient wants to book. */
  selected_date?: string;
  /** Intent classified from the user message. */
  intent?: "check_availability" | "book" | "status" | "cancel" | "reschedule" | "faq" | "unknown";
}

export const AvailabilityQuerySchema = z.object({
  clinic_id: z.string(),
  doctor_id: z.string().optional(),
  specialty: z.string().optional(),
  date: z.string().optional(),
});

export const BookingValidationSchema = z.object({
  patient_id: z.string(),
  doctor_id: z.string(),
  clinic_id: z.string(),
  slot_time: z.string(),
});

/** Structured output from the appointment assistant. */
export const AppointmentAssistantOutputSchema = z.object({
  response_text: z.string().describe("Natural language response to the patient"),
  suggested_actions: z.array(z.object({
    action: z.enum(["view_doctors", "select_slot", "confirm_booking", "view_appointments"]),
    label: z.string(),
    data: z.record(z.unknown()).optional(),
  })).optional(),
  available_slots: z.array(z.object({
    doctor_id: z.string(),
    doctor_name: z.string(),
    date: z.string(),
    time_slots: z.array(z.string()),
  })).optional(),
});

export type AppointmentAssistantOutput = z.infer<typeof AppointmentAssistantOutputSchema>;
