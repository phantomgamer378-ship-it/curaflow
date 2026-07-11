import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  getDoctorAvailability,
  searchAvailableSlots,
  getPatientUpcomingAppointments,
  listClinicDoctors,
  validateBookingRequest,
} from "../../integration/appointment-hooks";

export const searchDoctorsTool = tool(
  async (input: any) => {
    const results = await searchAvailableSlots(input.clinic_id, input.specialty);
    return JSON.stringify(results);
  },
  {
    name: "search_doctors",
    description: "Search for available doctors in the clinic, optionally filtered by specialty.",
    schema: z.object({
      clinic_id: z.string().describe("The clinic ID to search within"),
      specialty: z.string().nullable().optional().describe("Filter by specialty (e.g., 'Cardiology', 'General')"),
    }),
  }
);

export const checkAvailabilityTool = tool(
  async (input: any) => {
    const result = await getDoctorAvailability(input.clinic_id, input.doctor_id, input.date);
    return JSON.stringify(result);
  },
  {
    name: "check_doctor_availability",
    description: "Check a specific doctor's availability for a given date.",
    schema: z.object({
      clinic_id: z.string().describe("The clinic ID"),
      doctor_id: z.string().describe("The doctor ID to check"),
      date: z.string().describe("Date in YYYY-MM-DD format"),
    }),
  }
);

export const myAppointmentsTool = tool(
  async (input: any) => {
    const results = await getPatientUpcomingAppointments(input.patient_id, input.clinic_id);
    return JSON.stringify(results);
  },
  {
    name: "get_my_appointments",
    description: "Get the patient's upcoming appointments.",
    schema: z.object({
      patient_id: z.string().describe("The patient ID"),
      clinic_id: z.string().describe("The clinic ID"),
    }),
  }
);

export const validateBookingTool = tool(
  async (input: any) => {
    const result = await validateBookingRequest(input.patient_id, input.doctor_id, input.clinic_id, input.slot_time);
    return JSON.stringify(result);
  },
  {
    name: "validate_booking",
    description: "Validate if a booking slot is available. Does NOT create the appointment — only checks feasibility.",
    schema: z.object({
      patient_id: z.string().describe("The patient ID"),
      doctor_id: z.string().describe("The doctor ID"),
      clinic_id: z.string().describe("The clinic ID"),
      slot_time: z.string().describe("ISO datetime string for the slot"),
    }),
  }
);

export const listDoctorsTool = tool(
  async (input: any) => {
    const results = await listClinicDoctors(input.clinic_id);
    return JSON.stringify(results);
  },
  {
    name: "list_clinic_doctors",
    description: "List all active doctors in the clinic.",
    schema: z.object({
      clinic_id: z.string().describe("The clinic ID"),
    }),
  }
);

export const appointmentAssistantTools = [
  searchDoctorsTool,
  checkAvailabilityTool,
  myAppointmentsTool,
  validateBookingTool,
  listDoctorsTool,
];
