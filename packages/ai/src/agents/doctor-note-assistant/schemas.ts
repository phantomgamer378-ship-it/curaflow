import { z } from "zod";
import type { BaseAgentState } from "../../core/base-state";

export interface DoctorNoteState extends BaseAgentState {
  doctor_id: string;
  raw_note?: string;
  structured_note?: StructuredNote;
}

export interface StructuredNote {
  chief_complaint?: string;
  history?: string;
  examination?: string;
  diagnosis?: string;
  plan?: string;
  follow_up?: string;
  ai_confidence: "high" | "medium" | "low";
}

export const DoctorNoteInputSchema = z.object({
  raw_note: z.string().min(5).max(5000).describe("Raw dictation or rough note text from the doctor"),
  appointment_id: z.string().uuid().optional(),
});

export const StructuredNoteOutputSchema = z.object({
  chief_complaint: z.string().optional(),
  history: z.string().optional(),
  examination: z.string().optional(),
  diagnosis: z.string().optional(),
  plan: z.string().optional(),
  follow_up: z.string().optional(),
  ai_confidence: z.enum(["high", "medium", "low"]),
  disclaimer: z.string(),
});
