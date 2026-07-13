import { validateScope, reason, handleError } from "./nodes";
import type { AppointmentAssistantState } from "./schemas";
import { runBoundedAgentGraph } from "../../core/langgraph-runner";

/**
 * Appointment Assistant graph.
 *
 * Flow: validateScope → reason → (error? → handleError) → END
 */
export async function runAppointmentAssistantGraph(
  initialState: AppointmentAssistantState
): Promise<AppointmentAssistantState> {
  return runBoundedAgentGraph({
    name: "appointment-assistant",
    initialState,
    validateScope,
    run: reason,
    handleError,
  });
}
