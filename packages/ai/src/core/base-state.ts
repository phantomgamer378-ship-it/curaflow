import { z } from "zod";
import type { AgentOutputType } from "./constants";

/**
 * Base state shared by all agent graphs.
 * Each agent extends this with domain-specific fields.
 *
 * Every field that touches tenant boundaries (clinic_id, user_id, role)
 * is required — this prevents accidental cross-tenant data leakage.
 */
export interface BaseAgentState {
  /** Unique ID for this request, used for tracing and log correlation. */
  request_id: string;
  /** Thread ID for multi-turn conversations. */
  thread_id: string;
  /** Clinic scope — all DB queries must be filtered by this. */
  clinic_id: string;
  /** Authenticated user ID from JWT. */
  user_id: string;
  /** User role — used by policy layer to gate actions. */
  role: "patient" | "doctor" | "admin";
  /** Optional: patient record ID (resolved from profile). */
  patient_id?: string;
  /** Optional: doctor record ID (resolved from profile). */
  doctor_id?: string;
  /** Optional: appointment being discussed. */
  appointment_id?: string;
  /** Conversation messages (HumanMessage / AIMessage). */
  messages: Array<{ role: "user" | "assistant" | "system" | "tool"; content: string; name?: string }>;
  /** Current goal the agent is working toward. */
  current_goal?: string;
  /** Results from tool calls in the current turn. */
  tool_results: Array<{ tool: string; result: unknown; error?: string }>;
  /** Final structured output from the agent. */
  final_output?: {
    type: AgentOutputType;
    content: unknown;
    disclaimer?: string;
  };
  /** Whether this action requires human approval before execution. */
  approval_required: boolean;
  /** Status of approval if requested. */
  approval_status?: "pending" | "approved" | "denied";
  /** Error message if the agent encountered a failure. */
  error?: string;
  /** Arbitrary metadata for extensibility. */
  metadata: Record<string, unknown>;
  /** ISO timestamp of when this state was created. */
  created_at: string;
  /** ISO timestamp of last update. */
  updated_at: string;
}

/** Zod schema for validating incoming agent request context. */
export const AgentRequestSchema = z.object({
  clinic_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(["patient", "doctor", "admin"]),
  message: z.string().min(1).max(2000),
  thread_id: z.string().optional(),
  appointment_id: z.string().uuid().optional(),
});

export type AgentRequest = z.infer<typeof AgentRequestSchema>;

/** Create a fresh base state from an incoming request. */
export function createBaseState(req: AgentRequest): BaseAgentState {
  const now = new Date().toISOString();
  return {
    request_id: crypto.randomUUID(),
    thread_id: req.thread_id || crypto.randomUUID(),
    clinic_id: req.clinic_id,
    user_id: req.user_id,
    role: req.role,
    appointment_id: req.appointment_id,
    messages: [{ role: "user", content: req.message }],
    current_goal: undefined,
    tool_results: [],
    final_output: undefined,
    approval_required: false,
    approval_status: undefined,
    error: undefined,
    metadata: {},
    created_at: now,
    updated_at: now,
  };
}
