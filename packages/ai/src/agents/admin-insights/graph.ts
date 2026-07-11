import { validateScope, reason, handleError } from "./nodes";
import type { AdminInsightsState } from "./schemas";

export async function runAdminInsightsGraph(initialState: AdminInsightsState): Promise<AdminInsightsState> {
  let state = initialState;
  try { state = validateScope(state); } catch (err: any) { state.error = err.message; return handleError(state); }
  state = await reason(state);
  if (state.error && !state.final_output) state = handleError(state);
  return state;
}
