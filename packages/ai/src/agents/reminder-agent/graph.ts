import { validateScope, reason, handleError } from "./nodes";
import type { ReminderAgentState } from "./schemas";
import { runBoundedAgentGraph } from "../../core/langgraph-runner";

export async function runReminderGraph(initialState: ReminderAgentState): Promise<ReminderAgentState> {
  return runBoundedAgentGraph({
    name: "reminder-agent",
    initialState,
    validateScope,
    run: reason,
    handleError,
  });
}
