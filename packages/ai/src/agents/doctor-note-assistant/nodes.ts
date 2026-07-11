import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { DoctorNoteState } from "./schemas";
import { DOCTOR_NOTE_SYSTEM_PROMPT } from "./prompts";
import { getModel } from "../../core/model-registry";
import { enforcePolicy } from "../../core/policies";
import { addMedicalDisclaimer } from "../../core/guardrails";
import { AGENT_NAMES, AI_MODELS } from "../../core/constants";
import { logAgentEvent, logAgentError, type TraceContext } from "../../core/tracing";

function makeTraceCtx(state: DoctorNoteState): TraceContext {
  return { request_id: state.request_id, thread_id: state.thread_id, agent_name: AGENT_NAMES.DOCTOR_NOTE_ASSISTANT, user_id: state.user_id, clinic_id: state.clinic_id };
}

export function validateScope(state: DoctorNoteState): DoctorNoteState {
  enforcePolicy({ agent_name: AGENT_NAMES.DOCTOR_NOTE_ASSISTANT, user_role: state.role, user_id: state.user_id, clinic_id: state.clinic_id, action: "draft" });
  return { ...state, updated_at: new Date().toISOString() };
}

export async function structurize(state: DoctorNoteState): Promise<DoctorNoteState> {
  const trace = makeTraceCtx(state);
  logAgentEvent(trace, "structurize_start");
  try {
    const model = getModel(AI_MODELS.POWERFUL, { temperature: 0.1 });
    const rawNote = state.raw_note || state.messages[state.messages.length - 1]?.content || "";

    const response = await model.invoke([
      new SystemMessage(DOCTOR_NOTE_SYSTEM_PROMPT),
      new HumanMessage(`Please structure the following clinical note into sections (Chief Complaint, History, Examination, Diagnosis, Plan, Follow-up). Mark your confidence as high/medium/low.\n\nRaw note:\n${rawNote}`),
    ]);

    const content = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    const output = addMedicalDisclaimer({ type: "draft", content });
    logAgentEvent(trace, "structurize_complete");
    return { ...state, messages: [...state.messages, { role: "assistant", content }], final_output: output, updated_at: new Date().toISOString() };
  } catch (err: any) {
    logAgentError(trace, err);
    return { ...state, error: err.message, updated_at: new Date().toISOString() };
  }
}

export function handleError(state: DoctorNoteState): DoctorNoteState {
  const msg = "I couldn't process the note right now. Please try again or write the note manually.";
  return { ...state, final_output: { type: "draft", content: msg, disclaimer: "Error occurred during processing." }, messages: [...state.messages, { role: "assistant", content: msg }] };
}
