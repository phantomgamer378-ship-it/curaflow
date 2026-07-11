import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import type { AdminInsightsState } from "./schemas";
import { ADMIN_INSIGHTS_SYSTEM_PROMPT } from "./prompts";
import { getModel } from "../../core/model-registry";
import { adminInsightsTools } from "./tools";
import { enforcePolicy } from "../../core/policies";
import { AGENT_NAMES } from "../../core/constants";
import { logAgentEvent, logAgentError, type TraceContext } from "../../core/tracing";

function makeTraceCtx(state: AdminInsightsState): TraceContext {
  return { request_id: state.request_id, thread_id: state.thread_id, agent_name: AGENT_NAMES.ADMIN_INSIGHTS, user_id: state.user_id, clinic_id: state.clinic_id };
}

export function validateScope(state: AdminInsightsState): AdminInsightsState {
  enforcePolicy({ agent_name: AGENT_NAMES.ADMIN_INSIGHTS, user_role: state.role, user_id: state.user_id, clinic_id: state.clinic_id, action: "read" });
  return { ...state, updated_at: new Date().toISOString() };
}

export async function reason(state: AdminInsightsState): Promise<AdminInsightsState> {
  const trace = makeTraceCtx(state);
  logAgentEvent(trace, "reason_start");
  try {
    const model = getModel();
    const modelWithTools = model.bindTools(adminInsightsTools);
    const messages = [
      new SystemMessage(ADMIN_INSIGHTS_SYSTEM_PROMPT + `\nContext: clinic_id=${state.clinic_id}`),
      ...state.messages.map((m) => m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)),
    ];
    const response = await modelWithTools.invoke(messages);
    const responseContent = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

    if (response.tool_calls?.length) {
      const toolResults = [];
      for (const tc of response.tool_calls) {
        const matched = adminInsightsTools.find((t) => t.name === tc.name);
        if (matched) {
          try { toolResults.push({ tool: tc.name, result: await matched.invoke(tc.args) }); }
          catch (e: any) { toolResults.push({ tool: tc.name, result: null, error: e.message }); }
        }
      }
      const toolMsgs = toolResults.map((tr) => new HumanMessage(`Tool '${tr.tool}': ${JSON.stringify(tr.result)}`));
      const final = await model.invoke([...messages, new AIMessage(responseContent), ...toolMsgs]);
      const finalContent = typeof final.content === "string" ? final.content : JSON.stringify(final.content);
      return { ...state, messages: [...state.messages, { role: "assistant", content: finalContent }], tool_results: toolResults, final_output: { type: "prediction", content: finalContent }, updated_at: new Date().toISOString() };
    }
    return { ...state, messages: [...state.messages, { role: "assistant", content: responseContent }], final_output: { type: "prediction", content: responseContent }, updated_at: new Date().toISOString() };
  } catch (err: any) {
    logAgentError(trace, err);
    return { ...state, error: err.message, updated_at: new Date().toISOString() };
  }
}

export function handleError(state: AdminInsightsState): AdminInsightsState {
  const msg = "I couldn't retrieve the analytics data right now. Please try again.";
  return { ...state, final_output: { type: "prediction", content: msg }, messages: [...state.messages, { role: "assistant", content: msg }] };
}
