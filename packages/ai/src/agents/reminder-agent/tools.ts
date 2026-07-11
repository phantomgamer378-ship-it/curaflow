import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { draftNotificationTemplate } from "../../integration/notification-hooks";

export const draftNotificationTool = tool(
  async (input) => {
    const result = draftNotificationTemplate(input as any);
    return JSON.stringify(result);
  },
  {
    name: "draft_notification",
    description: "Draft a notification message using a template. Returns a structured message ready for review.",
    schema: z.object({
      type: z.enum(["booking_confirmation", "reminder", "delay", "reschedule", "cancellation"]),
      patient_name: z.string(),
      doctor_name: z.string(),
      clinic_name: z.string(),
      appointment_date: z.string(),
      appointment_time: z.string(),
      token_no: z.number().nullable().optional(),
      channel: z.enum(["email", "sms", "whatsapp"]),
      tone: z.enum(["formal", "friendly", "urgent"]),
    }),
  }
);

export const reminderAgentTools = [draftNotificationTool];
