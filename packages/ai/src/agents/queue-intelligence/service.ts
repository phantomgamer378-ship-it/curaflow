import { runQueueIntelligenceGraph } from "./graph";
import type { QueueIntelligenceState } from "./schemas";
import { createBaseState, type AgentRequest } from "../../core/base-state";
import { prisma } from "@clinic/db";

export async function invokeQueueIntelligence(req: AgentRequest) {
  const baseState = createBaseState(req);
  const [patient, doctor] = await Promise.all([
    req.role === "patient" ? prisma.patient.findUnique({ where: { profileId: req.user_id } }) : Promise.resolve(null),
    req.role === "doctor" ? prisma.doctor.findUnique({ where: { profileId: req.user_id } }) : Promise.resolve(null),
  ]);

  const state: QueueIntelligenceState = {
    ...baseState,
    patient_id: patient?.id,
    doctor_id: doctor?.id,
  };
  const result = await runQueueIntelligenceGraph(state);
  return {
    ok: !result.error,
    data: { thread_id: result.thread_id, response: result.final_output?.content, type: result.final_output?.type },
    error: result.error,
  };
}
