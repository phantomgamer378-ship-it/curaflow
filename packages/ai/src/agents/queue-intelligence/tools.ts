import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getCurrentQueueSnapshot, getAverageWaitTime, getQueuePositionForPatient } from "../../integration/queue-hooks";

export const queueSnapshotTool = tool(
  async (input: any) => {
    const result = await getCurrentQueueSnapshot(input.clinic_id);
    return JSON.stringify(result);
  },
  {
    name: "get_queue_snapshot",
    description: "Get the current live queue snapshot for a clinic (current token, waiting count).",
    schema: z.object({ clinic_id: z.string() }),
  }
);

export const waitTimeTool = tool(
  async (input: any) => {
    const result = await getAverageWaitTime(input.clinic_id, input.doctor_id);
    return JSON.stringify(result);
  },
  {
    name: "get_wait_time",
    description: "Estimate current wait time at a clinic, optionally for a specific doctor.",
    schema: z.object({
      clinic_id: z.string(),
      doctor_id: z.string().nullable().optional(),
    }),
  }
);

export const patientPositionTool = tool(
  async (input: any) => {
    const result = await getQueuePositionForPatient(input.clinic_id, input.patient_id);
    return JSON.stringify(result);
  },
  {
    name: "get_patient_position",
    description: "Get a specific patient's position in the queue.",
    schema: z.object({
      clinic_id: z.string(),
      patient_id: z.string(),
    }),
  }
);

export const queueIntelligenceTools = [queueSnapshotTool, waitTimeTool, patientPositionTool];
