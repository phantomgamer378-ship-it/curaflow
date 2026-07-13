import { validateScope, structurize, handleError } from "./nodes";
import type { DoctorNoteState } from "./schemas";
import { runBoundedAgentGraph } from "../../core/langgraph-runner";

export async function runDoctorNoteGraph(initialState: DoctorNoteState): Promise<DoctorNoteState> {
  return runBoundedAgentGraph({
    name: "doctor-note-assistant",
    initialState,
    validateScope,
    run: structurize,
    handleError,
  });
}
