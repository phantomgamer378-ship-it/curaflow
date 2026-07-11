import { runAdminInsightsGraph } from "./graph";
import type { AdminInsightsState } from "./schemas";
import { createBaseState, type AgentRequest } from "../../core/base-state";

export async function invokeAdminInsights(req: AgentRequest) {
  const baseState = createBaseState(req);
  const state: AdminInsightsState = { ...baseState };
  const result = await runAdminInsightsGraph(state);
  return {
    ok: !result.error,
    data: { thread_id: result.thread_id, response: result.final_output?.content, type: result.final_output?.type },
    error: result.error,
  };
}
