import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getCurrentQueueSnapshot, getAverageWaitTime, getQueuePositionForPatient } from "../../integration/queue-hooks";

interface QueueToolContext {
  clinic_id: string;
  role: "patient" | "doctor" | "admin";
  patient_id?: string;
}

export function createQueueIntelligenceTools(ctx: QueueToolContext) {
  const queueSnapshotTool = tool(
    async () => {
      const result = await getCurrentQueueSnapshot(ctx.clinic_id);
      return JSON.stringify(result);
    },
    {
      name: "get_queue_snapshot",
      description: "Get the current live queue snapshot for the authenticated clinic.",
      schema: z.object({}),
    }
  );

  const waitTimeTool = tool(
    async (input: any) => {
      const result = await getAverageWaitTime(ctx.clinic_id, input.doctor_id ?? undefined);
      return JSON.stringify(result);
    },
    {
      name: "get_wait_time",
      description: "Estimate current wait time in the authenticated clinic, optionally for a specific doctor.",
      schema: z.object({
        doctor_id: z.string().nullable().optional(),
      }),
    }
  );

  const patientPositionTool = tool(
    async (input: any) => {
      const patientId = ctx.role === "patient" ? ctx.patient_id : input.patient_id;
      if (!patientId) {
        throw new Error("Patient context is required to check queue position.");
      }

      const result = await getQueuePositionForPatient(ctx.clinic_id, patientId);
      return JSON.stringify(result);
    },
    {
      name: "get_patient_position",
      description: "Get queue position. Patients are automatically scoped to themselves; doctors/admins may provide a patient ID within the clinic.",
      schema: z.object({
        patient_id: z.string().nullable().optional(),
      }),
    }
  );

  return [queueSnapshotTool, waitTimeTool, patientPositionTool];
}
