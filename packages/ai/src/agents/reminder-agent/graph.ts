import { validateScope, reason, handleError } from "./nodes";
import type { ReminderAgentState } from "./schemas";

export async function runReminderGraph(initialState: ReminderAgentState): Promise<ReminderAgentState> {
  let state = initialState;
  try { state = validateScope(state); } catch (err: any) { state.error = err.message; return handleError(state); }
  state = await reason(state);
  if (state.error && !state.final_output) state = handleError(state);
  return state;
}
