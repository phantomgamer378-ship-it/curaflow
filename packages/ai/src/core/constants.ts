/** AI subsystem constants. Never import secrets here — use env vars at runtime. */

export const AI_MODELS = {
  DEFAULT: "llama-3.3-70b-versatile",
  POWERFUL: "llama-3.3-70b-versatile",
  FAST: "llama-3.1-8b-instant",
} as const;

export const AGENT_NAMES = {
  APPOINTMENT_ASSISTANT: "appointment-assistant",
  QUEUE_INTELLIGENCE: "queue-intelligence",
  DOCTOR_NOTE_ASSISTANT: "doctor-note-assistant",
  REMINDER_AGENT: "reminder-agent",
  ADMIN_INSIGHTS: "admin-insights",
} as const;

/** Maximum messages to keep in a single agent session before truncation. */
export const MAX_SESSION_MESSAGES = 50;

/** Rate limit: max agent invocations per user per minute. */
export const AGENT_RATE_LIMIT = 20;

/** AI outputs are always one of these types. */
export type AgentOutputType = "suggestion" | "draft" | "prediction" | "approved_action";

/** Roles allowed per agent. */
export const AGENT_ROLE_ACCESS: Record<string, readonly string[]> = {
  [AGENT_NAMES.APPOINTMENT_ASSISTANT]: ["patient"],
  [AGENT_NAMES.QUEUE_INTELLIGENCE]: ["patient", "doctor", "admin"],
  [AGENT_NAMES.DOCTOR_NOTE_ASSISTANT]: ["doctor"],
  [AGENT_NAMES.REMINDER_AGENT]: ["admin"],
  [AGENT_NAMES.ADMIN_INSIGHTS]: ["admin"],
} as const;
