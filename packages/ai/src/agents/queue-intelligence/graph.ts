import { validateScope, reason, handleError } from "./nodes";
import type { QueueIntelligenceState } from "./schemas";
import { runBoundedAgentGraph } from "../../core/langgraph-runner";

export async function runQueueIntelligenceGraph(initialState: QueueIntelligenceState): Promise<QueueIntelligenceState> {
  return runBoundedAgentGraph({
    name: "queue-intelligence",
    initialState,
    validateScope,
    run: reason,
    handleError,
  });
}
