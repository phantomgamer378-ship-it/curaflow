import { MAX_SESSION_MESSAGES } from "./constants";

/**
 * Tenant-scoped memory manager.
 *
 * SECURITY: Memory namespaces are keyed by clinic_id + user_id.
 * This prevents:
 * - Cross-tenant data leakage (clinic A can't see clinic B's history)
 * - Cross-user data leakage (patient A can't see patient B's conversation)
 * - Prompt injection via shared memory (each user has isolated history)
 *
 * Current implementation: in-memory Map (suitable for single-process dev).
 * Production: replace with Redis or a persistent store keyed by namespace.
 */

type Message = { role: string; content: string; timestamp: string };

const memoryStore = new Map<string, Message[]>();

function makeNamespace(clinicId: string, userId: string): string {
  return `${clinicId}:${userId}`;
}

export function getSessionMessages(clinicId: string, userId: string, threadId?: string): Message[] {
  const ns = threadId ? `${makeNamespace(clinicId, userId)}:${threadId}` : makeNamespace(clinicId, userId);
  return memoryStore.get(ns) || [];
}

export function appendMessage(clinicId: string, userId: string, message: Message, threadId?: string): void {
  const ns = threadId ? `${makeNamespace(clinicId, userId)}:${threadId}` : makeNamespace(clinicId, userId);
  const existing = memoryStore.get(ns) || [];
  existing.push(message);

  // Truncate to prevent unbounded growth
  if (existing.length > MAX_SESSION_MESSAGES) {
    // Keep system message (first) + last N messages
    const truncated = [existing[0], ...existing.slice(-MAX_SESSION_MESSAGES + 1)].filter(Boolean) as Message[];
    memoryStore.set(ns, truncated);
  } else {
    memoryStore.set(ns, existing);
  }
}

export function clearSession(clinicId: string, userId: string, threadId?: string): void {
  const ns = threadId ? `${makeNamespace(clinicId, userId)}:${threadId}` : makeNamespace(clinicId, userId);
  memoryStore.delete(ns);
}

/** Get total sessions in memory (for observability). */
export function getMemoryStats(): { totalSessions: number; totalMessages: number } {
  let totalMessages = 0;
  for (const msgs of memoryStore.values()) {
    totalMessages += msgs.length;
  }
  return { totalSessions: memoryStore.size, totalMessages };
}
