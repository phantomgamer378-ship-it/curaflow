import { z } from "zod";
import type { BaseAgentState } from "../../core/base-state";

export interface QueueIntelligenceState extends BaseAgentState {
  /** Queue snapshot data from tools. */
  queue_data?: {
    current_token: number;
    waiting_count: number;
    estimated_wait_minutes: number;
  };
}

export const QueueIntelligenceOutputSchema = z.object({
  response_text: z.string(),
  queue_summary: z.object({
    current_token: z.number(),
    waiting_count: z.number(),
    estimated_wait_minutes: z.number(),
  }).optional(),
  patient_position: z.object({
    position: z.number().nullable(),
    token_no: z.number().nullable(),
    message: z.string(),
  }).optional(),
});
