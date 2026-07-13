import { validateScope, reason, handleError } from "./nodes";
import type { AdminInsightsState } from "./schemas";
import { runBoundedAgentGraph } from "../../core/langgraph-runner";

export async function runAdminInsightsGraph(initialState: AdminInsightsState): Promise<AdminInsightsState> {
  return runBoundedAgentGraph({
    name: "admin-insights",
    initialState,
    validateScope,
    run: reason,
    handleError,
  });
}
