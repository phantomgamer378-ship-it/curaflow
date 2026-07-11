import { apiFetch } from "@/lib/api";

export interface AIResponse {
  ok: boolean;
  data?: {
    thread_id: string;
    response: string;
    type: "suggestion" | "draft" | "prediction" | "approved_action";
    disclaimer?: string;
  };
  error?: string;
}

export async function askPatientAssistant(message: string, threadId?: string): Promise<AIResponse> {
  return apiFetch("/api/ai/assistant/patient", {
    method: "POST",
    body: JSON.stringify({ message, thread_id: threadId }),
  });
}

export async function askQueueAssistant(message: string, threadId?: string): Promise<AIResponse> {
  return apiFetch("/api/ai/assistant/queue", {
    method: "POST",
    body: JSON.stringify({ message, thread_id: threadId }),
  });
}

export async function askDoctorNoteAssistant(rawNote: string, appointmentId?: string): Promise<AIResponse> {
  return apiFetch("/api/ai/assistant/doctor-note", {
    method: "POST",
    body: JSON.stringify({ message: rawNote, raw_note: rawNote, appointment_id: appointmentId }),
  });
}

export async function askAdminInsights(message: string, threadId?: string): Promise<AIResponse> {
  return apiFetch("/api/ai/assistant/admin-insights", {
    method: "POST",
    body: JSON.stringify({ message, thread_id: threadId }),
  });
}

export async function previewReminder(message: string): Promise<AIResponse> {
  return apiFetch("/api/ai/assistant/reminder-preview", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
