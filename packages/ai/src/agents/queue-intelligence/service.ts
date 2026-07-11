import { runQueueIntelligenceGraph } from "./graph";
import type { QueueIntelligenceState } from "./schemas";
import { createBaseState, type AgentRequest } from "../../core/base-state";

export async function invokeQueueIntelligence(req: AgentRequest) {
  const baseState = createBaseState(req);
  const state: QueueIntelligenceState = { ...baseState };
  const result = await runQueueIntelligenceGraph(state);
  return {
    ok: !result.error,
    data: { thread_id: result.thread_id, response: result.final_output?.content, type: result.final_output?.type },
    error: result.error,
  };
}
