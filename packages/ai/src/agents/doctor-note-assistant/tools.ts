import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getConsultationNotes, getRecentNotesForDoctor } from "../../integration/doctor-notes-hooks";

export const getExistingNotesTool = tool(
  async (input: any) => {
    const result = await getConsultationNotes(input.appointment_id, input.doctor_id);
    return JSON.stringify(result || { exists: false });
  },
  {
    name: "get_existing_notes",
    description: "Get existing consultation notes for an appointment (if any).",
    schema: z.object({
      appointment_id: z.string(),
      doctor_id: z.string(),
    }),
  }
);

export const getRecentNotesTool = tool(
  async (input: any) => {
    const result = await getRecentNotesForDoctor(input.doctor_id, 5);
    return JSON.stringify(result);
  },
  {
    name: "get_recent_notes",
    description: "Get the doctor's recent consultation notes for reference.",
    schema: z.object({ doctor_id: z.string() }),
  }
);

export const doctorNoteTools = [getExistingNotesTool, getRecentNotesTool];
