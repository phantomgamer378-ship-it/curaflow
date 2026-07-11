/**
 * Tracing module — structured logging and optional LangSmith integration.
 *
 * Every agent invocation gets a request_id for end-to-end correlation.
 * Sensitive medical/user data is never logged in full — only redacted summaries.
 */

export interface TraceContext {
  request_id: string;
  thread_id: string;
  agent_name: string;
  user_id: string;
  clinic_id: string;
}

/** Structured log entry for agent operations. */
export function logAgentEvent(
  ctx: TraceContext,
  event: string,
  data?: Record<string, unknown>
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level: "info",
    service: "ai-agent",
    agent: ctx.agent_name,
    request_id: ctx.request_id,
    thread_id: ctx.thread_id,
    user_id: ctx.user_id,
    clinic_id: ctx.clinic_id,
    event,
    ...sanitizeLogData(data),
  };

  // In production, pipe this to a structured logging service (Datadog, etc.)
  console.log(JSON.stringify(entry));
}

export function logAgentError(ctx: TraceContext, error: Error, data?: Record<string, unknown>): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level: "error",
    service: "ai-agent",
    agent: ctx.agent_name,
    request_id: ctx.request_id,
    thread_id: ctx.thread_id,
    user_id: ctx.user_id,
    clinic_id: ctx.clinic_id,
    error: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    ...sanitizeLogData(data),
  };

  console.error(JSON.stringify(entry));
}

/** Remove sensitive fields from log data. */
function sanitizeLogData(data?: Record<string, unknown>): Record<string, unknown> {
  if (!data) return {};
  const sanitized = { ...data };
  // Never log raw notes, diagnosis, or patient details
  const sensitiveKeys = ["notes", "diagnosis", "raw_note", "patient_name", "phone", "email", "password"];
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = "[REDACTED]";
    }
  }
  return sanitized;
}

/**
 * LangSmith integration placeholder.
 * Set LANGCHAIN_TRACING_V2=true and LANGCHAIN_API_KEY in .env to enable.
 * LangChain.js auto-detects these env vars — no code changes needed.
 */
export function isLangSmithEnabled(): boolean {
  return process.env.LANGCHAIN_TRACING_V2 === "true" && !!process.env.LANGCHAIN_API_KEY;
}
