import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  getDoctorAvailability,
  searchAvailableSlots,
  getPatientUpcomingAppointments,
  listClinicDoctors,
  validateBookingRequest,
} from "../../integration/appointment-hooks";

interface AppointmentToolContext {
  clinic_id: string;
  patient_id: string;
}

export function createAppointmentAssistantTools(ctx: AppointmentToolContext) {
  const searchDoctorsTool = tool(
    async (input: any) => {
      const specialty = input.specialty ?? undefined;
      const results = await searchAvailableSlots(ctx.clinic_id, specialty);
      return JSON.stringify(results);
    },
    {
      name: "search_doctors",
      description: "Search for available doctors in the authenticated clinic, optionally filtered by specialty.",
      schema: z.object({
        specialty: z.string().nullable().optional().describe("Filter by specialty (e.g., 'Cardiology', 'General')"),
      }),
    }
  );

  const checkAvailabilityTool = tool(
    async (input: any) => {
      const result = await getDoctorAvailability(ctx.clinic_id, input.doctor_id, input.date);
      return JSON.stringify(result);
    },
    {
      name: "check_doctor_availability",
      description: "Check a specific doctor's availability for a given date in the authenticated clinic.",
      schema: z.object({
        doctor_id: z.string().describe("The doctor ID to check"),
        date: z.string().describe("Date in YYYY-MM-DD format"),
      }),
    }
  );

  const myAppointmentsTool = tool(
    async () => {
      const results = await getPatientUpcomingAppointments(ctx.patient_id, ctx.clinic_id);
      return JSON.stringify(results);
    },
    {
      name: "get_my_appointments",
      description: "Get the authenticated patient's upcoming appointments.",
      schema: z.object({}),
    }
  );

  const validateBookingTool = tool(
    async (input: any) => {
      const result = await validateBookingRequest(ctx.patient_id, input.doctor_id, ctx.clinic_id, input.slot_time);
      return JSON.stringify(result);
    },
    {
      name: "validate_booking",
      description: "Validate if a booking slot is available. Does NOT create the appointment; only checks feasibility.",
      schema: z.object({
        doctor_id: z.string().describe("The doctor ID"),
        slot_time: z.string().describe("ISO datetime string for the slot"),
      }),
    }
  );

  const listDoctorsTool = tool(
    async () => {
      const results = await listClinicDoctors(ctx.clinic_id);
      return JSON.stringify(results);
    },
    {
      name: "list_clinic_doctors",
      description: "List all active doctors in the authenticated clinic.",
      schema: z.object({}),
    }
  );

  return [
    searchDoctorsTool,
    checkAvailabilityTool,
    myAppointmentsTool,
    validateBookingTool,
    listDoctorsTool,
  ];
}
