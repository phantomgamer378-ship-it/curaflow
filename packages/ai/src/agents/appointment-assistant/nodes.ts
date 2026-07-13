import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import type { AppointmentAssistantState } from "./schemas";
import { APPOINTMENT_ASSISTANT_SYSTEM_PROMPT } from "./prompts";
import { getModel } from "../../core/model-registry";
import { createAppointmentAssistantTools } from "./tools";
import { enforcePolicy } from "../../core/policies";
import { AGENT_NAMES } from "../../core/constants";
import { logAgentEvent, logAgentError, type TraceContext } from "../../core/tracing";

function makeTraceCtx(state: AppointmentAssistantState): TraceContext {
  return {
    request_id: state.request_id,
    thread_id: state.thread_id,
    agent_name: AGENT_NAMES.APPOINTMENT_ASSISTANT,
    user_id: state.user_id,
    clinic_id: state.clinic_id,
  };
}

/** Node: validate scope and permissions. */
export function validateScope(state: AppointmentAssistantState): AppointmentAssistantState {
  const trace = makeTraceCtx(state);
  logAgentEvent(trace, "validate_scope");

  enforcePolicy({
    agent_name: AGENT_NAMES.APPOINTMENT_ASSISTANT,
    user_role: state.role,
    user_id: state.user_id,
    clinic_id: state.clinic_id,
    action: "read",
  });

  return { ...state, updated_at: new Date().toISOString() };
}

/** Node: call the LLM with tools to reason about the patient's request. */
export async function reason(state: AppointmentAssistantState): Promise<AppointmentAssistantState> {
  const trace = makeTraceCtx(state);
  logAgentEvent(trace, "reason_start");

  try {
    const model = getModel();
    const appointmentAssistantTools = createAppointmentAssistantTools({
      clinic_id: state.clinic_id,
      patient_id: state.patient_id,
    });
    const modelWithTools = model.bindTools(appointmentAssistantTools);

    const messages = [
      new SystemMessage(
        APPOINTMENT_ASSISTANT_SYSTEM_PROMPT +
        `\n\nContext: clinic_id=${state.clinic_id}, patient_id=${state.patient_id}`
      ),
      ...state.messages.map((m) => {
        if (m.role === "user") return new HumanMessage(m.content);
        return new AIMessage(m.content);
      }),
    ];

    const response = await modelWithTools.invoke(messages);

    const responseContent = typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

    // Check for tool calls
    if (response.tool_calls && response.tool_calls.length > 0) {
      // Execute tools and re-invoke
      const toolResults = [];
      for (const tc of response.tool_calls) {
        const matchedTool = appointmentAssistantTools.find((t) => t.name === tc.name);
        if (matchedTool) {
          try {
            const result = await matchedTool.invoke(tc.args);
            toolResults.push({ tool: tc.name, result });
          } catch (err: any) {
            toolResults.push({ tool: tc.name, result: null, error: err.message });
          }
        }
      }

      // Re-invoke with tool results
      const toolMessages = toolResults.map((tr) =>
        new HumanMessage(`Tool '${tr.tool}' returned: ${JSON.stringify(tr.result)}${tr.error ? ` (Error: ${tr.error})` : ""}`)
      );

      const finalResponse = await model.invoke([...messages, new AIMessage(responseContent), ...toolMessages]);
      const finalContent = typeof finalResponse.content === "string"
        ? finalResponse.content
        : JSON.stringify(finalResponse.content);

      logAgentEvent(trace, "reason_complete", { tool_calls: toolResults.length });

      return {
        ...state,
        messages: [...state.messages, { role: "assistant", content: finalContent }],
        tool_results: toolResults,
        final_output: { type: "suggestion", content: finalContent },
        updated_at: new Date().toISOString(),
      };
    }

    logAgentEvent(trace, "reason_complete", { tool_calls: 0 });

    return {
      ...state,
      messages: [...state.messages, { role: "assistant", content: responseContent }],
      final_output: { type: "suggestion", content: responseContent },
      updated_at: new Date().toISOString(),
    };
  } catch (err: any) {
    logAgentError(trace, err);
    return {
      ...state,
      error: err.message,
      updated_at: new Date().toISOString(),
    };
  }
}

/** Node: handle errors gracefully. */
export function handleError(state: AppointmentAssistantState): AppointmentAssistantState {
  const fallbackMessage = "I'm sorry, I encountered an issue processing your request. Please try again or contact the clinic directly.";
  return {
    ...state,
    final_output: { type: "suggestion", content: fallbackMessage },
    messages: [...state.messages, { role: "assistant", content: fallbackMessage }],
    updated_at: new Date().toISOString(),
  };
}
