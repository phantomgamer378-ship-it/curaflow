import { createWorker } from "../lib/queue-setup";
import { createLogger } from "@clinic/observability";
import { prisma } from "@clinic/db";

const logger = createLogger("ai-worker");

interface AIJobData {
  appointmentId: string;
  diagnosis?: string;
  notes?: string;
}

export const aiWorker = createWorker<AIJobData>(
  "ai-queue",
  async (job) => {
    const { appointmentId, diagnosis, notes } = job.data;

    logger.info(`Processing AI job for appointment ${appointmentId}`);

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            profile: { select: { name: true } as any },
          },
        },
        doctor: {
          include: {
            profile: { select: { name: true } as any },
          },
        },
        notes: true,
      },
    });

    if (!appointment) {
      throw new Error(`Appointment ${appointmentId} not found for AI processing`);
    }

    // ─── AI Processing Placeholder ───────────────────────────────────
    // Integration point for OpenAI / Google Gemini / Anthropic:
    //
    //   const aiResponse = await openai.chat.completions.create({
    //     model: "gpt-4o",
    //     messages: [
    //       { role: "system", content: "Summarize this clinical encounter." },
    //       { role: "user", content: `Diagnosis: ${diagnosis}\nNotes: ${notes}` },
    //     ],
    //   });
    //
    //   const summary = aiResponse.choices[0]?.message?.content ?? "";
    //
    //   await prisma.consultationNotes.update({
    //     where: { appointmentId },
    //     data: { metadata: { ai_summary: summary } },
    //   });
    // ─────────────────────────────────────────────────────────────────

    logger.info(`AI processing complete for appointment ${appointmentId}`, {
      diagnosis: diagnosis ?? "(none)",
      notesLength: notes?.length ?? 0,
    });
  },
  {
    concurrency: 2,
    limiter: { max: 10, duration: 60_000 }, // max 10 AI jobs per minute
  }
);
