import { validateScope, reason, handleError } from "./nodes";
import type { AppointmentAssistantState } from "./schemas";

/**
 * Appointment Assistant graph.
 *
 * Flow: validateScope → reason → (error? → handleError) → finalize
 *
 * NOTE: This uses a simple sequential pipeline rather than the full
 * LangGraph StateGraph because the appointment assistant is a single-turn
 * tool-calling agent without complex routing. When multi-turn stateful
 * conversations are needed, upgrade to StateGraph with checkpointing.
 */
export async function runAppointmentAssistantGraph(
  initialState: AppointmentAssistantState
): Promise<AppointmentAssistantState> {
  let state = initialState;

  // Step 1: Validate scope
  try {
    state = validateScope(state);
  } catch (err: any) {
    state.error = err.message;
    return handleError(state);
  }

  // Step 2: Reason with tools
  state = await reason(state);

  // Step 3: Error recovery
  if (state.error && !state.final_output) {
    state = handleError(state);
  }

  return state;
}
