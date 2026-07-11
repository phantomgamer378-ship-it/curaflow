import { AGENT_ROLE_ACCESS } from "./constants";

/**
 * Policy engine — deny-by-default access control for AI agent actions.
 *
 * This module enforces:
 * - Role-based agent access (patient can't use admin-insights)
 * - Clinic scope isolation (agent can't access cross-clinic data)
 * - Mutation gating (any write action requires explicit approval)
 *
 * SECURITY NOTE: This is the last line of defense before an agent
 * tool executes. Tools themselves also validate, but this layer
 * catches misconfigurations in graph routing.
 */

export type PolicyAction = "read" | "suggest" | "draft" | "mutate";

export interface PolicyContext {
  agent_name: string;
  user_role: string;
  user_id: string;
  clinic_id: string;
  action: PolicyAction;
  resource_owner_id?: string;
  resource_clinic_id?: string;
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  requires_approval?: boolean;
}

export function checkPolicy(ctx: PolicyContext): PolicyResult {
  // 1. Check agent-level role access
  const allowedRoles = AGENT_ROLE_ACCESS[ctx.agent_name];
  if (!allowedRoles || !allowedRoles.includes(ctx.user_role)) {
    return {
      allowed: false,
      reason: `Role '${ctx.user_role}' is not authorized to use agent '${ctx.agent_name}'.`,
    };
  }

  // 2. Check clinic scope isolation
  if (ctx.resource_clinic_id && ctx.resource_clinic_id !== ctx.clinic_id) {
    return {
      allowed: false,
      reason: "Cross-clinic access denied. Resources must belong to the user's clinic.",
    };
  }

  // 3. Check ownership scope for patients
  if (ctx.user_role === "patient" && ctx.resource_owner_id && ctx.resource_owner_id !== ctx.user_id) {
    return {
      allowed: false,
      reason: "Patients can only access their own records.",
    };
  }

  // 4. Mutation actions always require approval
  if (ctx.action === "mutate") {
    return {
      allowed: true,
      requires_approval: true,
      reason: "Mutation actions require human approval before execution.",
    };
  }

  // 5. Default: allow read/suggest/draft
  return { allowed: true };
}

/** Convenience: throw if policy check fails. */
export function enforcePolicy(ctx: PolicyContext): void {
  const result = checkPolicy(ctx);
  if (!result.allowed) {
    throw new PolicyDeniedError(result.reason || "Policy check failed.");
  }
}

export class PolicyDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyDeniedError";
  }
}
