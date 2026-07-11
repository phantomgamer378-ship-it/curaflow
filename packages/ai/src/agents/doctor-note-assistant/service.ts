import { runDoctorNoteGraph } from "./graph";
import type { DoctorNoteState } from "./schemas";
import { createBaseState, type AgentRequest } from "../../core/base-state";
import { prisma } from "@clinic/db";

export async function invokeDoctorNoteAssistant(req: AgentRequest & { raw_note?: string }) {
  const doctor = await prisma.doctor.findUnique({ where: { profileId: req.user_id } });
  if (!doctor) return { ok: false, error: "Doctor profile not found." };

  const baseState = createBaseState(req);
  const state: DoctorNoteState = { ...baseState, doctor_id: doctor.id, raw_note: req.raw_note };
  const result = await runDoctorNoteGraph(state);

  return {
    ok: !result.error,
    data: { thread_id: result.thread_id, response: result.final_output?.content, type: result.final_output?.type, disclaimer: result.final_output?.disclaimer },
    error: result.error,
  };
}
