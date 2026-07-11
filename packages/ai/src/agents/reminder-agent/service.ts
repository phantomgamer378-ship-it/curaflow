import { runReminderGraph } from "./graph";
import type { ReminderAgentState } from "./schemas";
import { createBaseState, type AgentRequest } from "../../core/base-state";

export async function invokeReminderAgent(req: AgentRequest) {
  const baseState = createBaseState(req);
  const state: ReminderAgentState = { ...baseState };
  const result = await runReminderGraph(state);
  return {
    ok: !result.error,
    data: { thread_id: result.thread_id, response: result.final_output?.content, type: result.final_output?.type },
    error: result.error,
  };
}
