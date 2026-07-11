import { runAppointmentAssistantGraph } from "./graph";
import type { AppointmentAssistantState } from "./schemas";
import { createBaseState, type AgentRequest } from "../../core/base-state";
import { prisma } from "@clinic/db";

/**
 * Public service entry point for the Appointment Assistant agent.
 * Called by the API controller after authentication and validation.
 */
export async function invokeAppointmentAssistant(req: AgentRequest) {
  // Resolve patient_id from user profile
  const patient = await prisma.patient.findUnique({
    where: { profileId: req.user_id },
  });

  if (!patient) {
    return {
      ok: false,
      error: "Patient profile not found. Only patients can use the appointment assistant.",
    };
  }

  const baseState = createBaseState(req);
  const state: AppointmentAssistantState = {
    ...baseState,
    patient_id: patient.id,
  };

  const result = await runAppointmentAssistantGraph(state);

  return {
    ok: !result.error,
    data: {
      thread_id: result.thread_id,
      response: result.final_output?.content,
      type: result.final_output?.type,
      suggested_actions: undefined, // Future: parse structured output
    },
    error: result.error,
  };
}
