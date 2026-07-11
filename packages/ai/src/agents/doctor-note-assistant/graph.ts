import { validateScope, structurize, handleError } from "./nodes";
import type { DoctorNoteState } from "./schemas";

export async function runDoctorNoteGraph(initialState: DoctorNoteState): Promise<DoctorNoteState> {
  let state = initialState;
  try { state = validateScope(state); } catch (err: any) { state.error = err.message; return handleError(state); }
  state = await structurize(state);
  if (state.error && !state.final_output) state = handleError(state);
  return state;
}
