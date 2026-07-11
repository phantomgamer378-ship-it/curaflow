import { prisma } from "@clinic/db";

/**
 * Doctor notes integration hooks.
 * Provides read access for AI summarization. Final saves go through
 * the validated backend endpoint, never through the agent directly.
 */

export async function getConsultationNotes(appointmentId: string, doctorId: string) {
  const notes = await prisma.consultationNotes.findUnique({
    where: { appointmentId },
  });

  // Verify ownership — doctor can only access their own notes
  if (notes && notes.doctorId !== doctorId) {
    return null;
  }

  return notes
    ? {
        appointment_id: notes.appointmentId,
        diagnosis: notes.diagnosis,
        notes: notes.notes,
        created_at: notes.createdAt.toISOString(),
        updated_at: notes.updatedAt.toISOString(),
      }
    : null;
}

export async function getRecentNotesForDoctor(doctorId: string, limit: number = 10) {
  const notes = await prisma.consultationNotes.findMany({
    where: { doctorId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      appointment: {
        include: {
          patient: {
            include: {
              profile: { select: { name: true } as any },
            },
          },
        },
      },
    },
  });

  return notes.map((n) => ({
    appointment_id: n.appointmentId,
    patient_name: (n.appointment.patient.profile as any)?.name ?? "Unknown",
    diagnosis: n.diagnosis,
    notes_preview: n.notes?.substring(0, 100),
    date: n.createdAt.toISOString(),
  }));
}
