import { z } from "zod";
import type { BaseAgentState } from "../../core/base-state";

export interface AdminInsightsState extends BaseAgentState {}

export const AdminInsightsOutputSchema = z.object({
  response_text: z.string(),
  metrics: z.record(z.unknown()).optional(),
  suggestions: z.array(z.string()).optional(),
});
