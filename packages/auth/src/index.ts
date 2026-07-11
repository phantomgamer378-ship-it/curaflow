import type { UserRole } from "@clinic/types";

const permissions = {
  patient: ["appointments:own", "queue:read", "profile:own"],
  doctor: ["appointments:assigned", "queue:own", "notes:write"],
  admin: ["appointments:any", "queue:any", "users:manage", "analytics:read"]
} as const satisfies Record<UserRole, readonly string[]>;

export function hasRole(actual: UserRole, allowed: readonly UserRole[]) {
  return allowed.includes(actual);
}

export function permissionsFor(role: UserRole) {
  return permissions[role];
}
