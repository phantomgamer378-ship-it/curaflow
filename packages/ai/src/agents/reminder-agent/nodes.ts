import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import type { ReminderAgentState } from "./schemas";
import { REMINDER_AGENT_SYSTEM_PROMPT } from "./prompts";
import { getModel } from "../../core/model-registry";
import { reminderAgentTools } from "./tools";
import { enforcePolicy } from "../../core/policies";
import { AGENT_NAMES } from "../../core/constants";
import { logAgentEvent, logAgentError, type TraceContext } from "../../core/tracing";

function makeTraceCtx(state: ReminderAgentState): TraceContext {
  return { request_id: state.request_id, thread_id: state.thread_id, agent_name: AGENT_NAMES.REMINDER_AGENT, user_id: state.user_id, clinic_id: state.clinic_id };
}

export function validateScope(state: ReminderAgentState): ReminderAgentState {
  enforcePolicy({ agent_name: AGENT_NAMES.REMINDER_AGENT, user_role: state.role, user_id: state.user_id, clinic_id: state.clinic_id, action: "draft" });
  return { ...state, updated_at: new Date().toISOString() };
}

export async function reason(state: ReminderAgentState): Promise<ReminderAgentState> {
  const trace = makeTraceCtx(state);
  logAgentEvent(trace, "reason_start");
  try {
    const model = getModel();
    const modelWithTools = model.bindTools(reminderAgentTools);
    const messages = [
      new SystemMessage(REMINDER_AGENT_SYSTEM_PROMPT),
      ...state.messages.map((m) => m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)),
    ];
    const response = await modelWithTools.invoke(messages);
    const responseContent = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

    if (response.tool_calls?.length) {
      const toolResults = [];
      for (const tc of response.tool_calls) {
        const matched = reminderAgentTools.find((t) => t.name === tc.name);
        if (matched) {
          try { toolResults.push({ tool: tc.name, result: await matched.invoke(tc.args) }); }
          catch (e: any) { toolResults.push({ tool: tc.name, result: null, error: e.message }); }
        }
      }
      const toolMsgs = toolResults.map((tr) => new HumanMessage(`Tool '${tr.tool}': ${JSON.stringify(tr.result)}`));
      const final = await model.invoke([...messages, new AIMessage(responseContent), ...toolMsgs]);
      const finalContent = typeof final.content === "string" ? final.content : JSON.stringify(final.content);
      return { ...state, messages: [...state.messages, { role: "assistant", content: finalContent }], tool_results: toolResults, final_output: { type: "draft", content: finalContent }, updated_at: new Date().toISOString() };
    }
    return { ...state, messages: [...state.messages, { role: "assistant", content: responseContent }], final_output: { type: "draft", content: responseContent }, updated_at: new Date().toISOString() };
  } catch (err: any) {
    logAgentError(trace, err);
    return { ...state, error: err.message, updated_at: new Date().toISOString() };
  }
}

export function handleError(state: ReminderAgentState): ReminderAgentState {
  const msg = "I couldn't draft the notification right now. Please try again.";
  return { ...state, final_output: { type: "draft", content: msg }, messages: [...state.messages, { role: "assistant", content: msg }] };
}
