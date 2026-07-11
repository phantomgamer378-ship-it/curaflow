import { getLiveQueueSnapshot } from "@clinic/queue";
import { prisma } from "@clinic/db";

/**
 * Queue integration hooks — read-only wrappers around queue state
 * for agent tools. The agent NEVER mutates queue state.
 */

export async function getCurrentQueueSnapshot(clinicId: string) {
  return getLiveQueueSnapshot(clinicId);
}

export async function getAverageWaitTime(clinicId: string, doctorId?: string) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(todayStr);

  const whereClause: any = {
    sessionDate: todayDate,
    ...(doctorId ? { doctorId } : {}),
  };

  // If no doctorId, scope to clinic
  if (!doctorId) {
    const doctors = await prisma.doctor.findMany({
      where: { clinicId, deletedAt: null },
      select: { id: true },
    });
    whereClause.doctorId = { in: doctors.map((d) => d.id) };
    delete whereClause.sessionDate; // re-add
    Object.assign(whereClause, { sessionDate: todayDate });
  }

  const sessions = await prisma.queueSession.findMany({
    where: whereClause,
    include: {
      entries: { where: { status: "waiting" } },
    },
  });

  const totalWaiting = sessions.reduce((acc, s) => acc + s.entries.length, 0);
  // Rough estimate: 15 min per patient (use doctor.slotDurationMin in production)
  const estimatedMinutes = totalWaiting * 15;

  return {
    clinic_id: clinicId,
    doctor_id: doctorId || "all",
    total_waiting: totalWaiting,
    estimated_wait_minutes: estimatedMinutes,
    sessions_active: sessions.length,
    snapshot_time: new Date().toISOString(),
  };
}

export async function getQueuePositionForPatient(clinicId: string, patientId: string) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const appointment = await prisma.appointment.findFirst({
    where: {
      patientId,
      clinicId,
      slotTime: { gte: new Date(todayStr) },
      status: { in: ["booked", "in_consultation"] },
    },
    include: { queueEntry: true },
    orderBy: { slotTime: "asc" },
  });

  if (!appointment || !appointment.queueEntry) {
    return { in_queue: false, position: null, message: "You are not currently in the queue." };
  }

  // Count how many are ahead
  const ahead = await prisma.queueEntry.count({
    where: {
      sessionId: appointment.queueEntry.sessionId,
      position: { lt: appointment.queueEntry.position },
      status: "waiting",
    },
  });

  return {
    in_queue: true,
    position: ahead + 1,
    token_no: appointment.tokenNo,
    status: appointment.queueEntry.status,
    message: ahead === 0
      ? "You are next! Please be ready."
      : `You are ${ahead} patient${ahead > 1 ? "s" : ""} away from your turn.`,
  };
}
