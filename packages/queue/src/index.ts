import { prisma } from "@clinic/db";
import type { PublicQueueSnapshot } from "@clinic/types";
import { getClinicSessionDateForDate } from "./clinic-date";

export * from "./clinic-date";

export type QueueTransaction = {
  appointmentId: string;
  doctorId: string;
  clinicId: string;
};

export async function getLiveQueueSnapshot(clinicId: string): Promise<PublicQueueSnapshot> {
  const todayDate = getClinicSessionDateForDate();

  const doctors = await prisma.doctor.findMany({
    where: { clinicId, deletedAt: null },
    include: { profile: true }
  });

  const snapshotDoctors: Array<{ doctor_id: string; doctor_name: string; current_token: number; waiting_count: number }> = [];

  for (const doc of doctors) {
    const session = await prisma.queueSession.findFirst({
      where: {
        doctorId: doc.id,
        sessionDate: todayDate
      }
    });

    const currentToken = session ? session.currentToken : 0;
    
    let waitingCount = 0;
    if (session) {
      waitingCount = await prisma.queueEntry.count({
        where: {
          sessionId: session.id,
          status: "waiting"
        }
      });
    }

    snapshotDoctors.push({
      doctor_id: doc.id,
      doctor_name: doc.profile?.name || "Doctor",
      current_token: currentToken,
      waiting_count: waitingCount,
    });
  }

  return { doctors: snapshotDoctors };
}

async function getOrCreateSession(doctorId: string) {
  const todayDate = getClinicSessionDateForDate();

  const session = await prisma.queueSession.findFirst({
    where: { doctorId, sessionDate: todayDate }
  });

  if (session) return session;

  return await prisma.queueSession.create({
    data: { doctorId, sessionDate: todayDate }
  });
}

export async function startConsultation(input: QueueTransaction): Promise<void> {
  const session = await getOrCreateSession(input.doctorId);

  await prisma.$transaction([
    prisma.appointment.update({
      where: { id: input.appointmentId },
      data: { status: "in_consultation" }
    }),
    prisma.queueEntry.upsert({
      where: { appointmentId: input.appointmentId },
      create: {
        sessionId: session.id,
        appointmentId: input.appointmentId,
        position: 0,
        status: "in_consultation",
        joinedAt: new Date()
      },
      update: {
        status: "in_consultation"
      }
    }),
    prisma.queueEvent.create({
      data: {
        sessionId: session.id,
        type: "DOCTOR_STARTED_CONSULTATION",
        payload: JSON.stringify({ appointmentId: input.appointmentId })
      }
    })
  ]);
}

export async function markPatientDone(input: QueueTransaction): Promise<PublicQueueSnapshot> {
  const session = await getOrCreateSession(input.doctorId);

  await prisma.$transaction([
    prisma.appointment.update({
      where: { id: input.appointmentId },
      data: { status: "completed" }
    }),
    prisma.queueEntry.upsert({
      where: { appointmentId: input.appointmentId },
      create: {
        sessionId: session.id,
        appointmentId: input.appointmentId,
        position: 0,
        status: "completed",
        joinedAt: new Date()
      },
      update: {
        status: "completed"
      }
    }),
    prisma.queueSession.update({
      where: { id: session.id },
      data: { currentToken: session.currentToken + 1 }
    }),
    prisma.queueEvent.create({
      data: {
        sessionId: session.id,
        type: "PATIENT_COMPLETED",
        payload: JSON.stringify({ appointmentId: input.appointmentId })
      }
    })
  ]);

  return getLiveQueueSnapshot(input.clinicId);
}

export async function markNoShow(input: QueueTransaction): Promise<PublicQueueSnapshot> {
  const session = await getOrCreateSession(input.doctorId);

  await prisma.$transaction([
    prisma.appointment.update({
      where: { id: input.appointmentId },
      data: { status: "no_show" }
    }),
    prisma.queueEntry.upsert({
      where: { appointmentId: input.appointmentId },
      create: {
        sessionId: session.id,
        appointmentId: input.appointmentId,
        position: 0,
        status: "no_show",
        joinedAt: new Date()
      },
      update: {
        status: "no_show"
      }
    }),
    prisma.queueEvent.create({
      data: {
        sessionId: session.id,
        type: "NO_SHOW_MARKED",
        payload: JSON.stringify({ appointmentId: input.appointmentId })
      }
    })
  ]);

  return getLiveQueueSnapshot(input.clinicId);
}

export async function startQueueSession(doctorId: string, clinicId: string): Promise<PublicQueueSnapshot> {
  const todayDate = getClinicSessionDateForDate();

  const existingSession = await prisma.queueSession.findFirst({
    where: { doctorId, sessionDate: todayDate }
  });

  if (existingSession) {
    throw new Error("Queue session is already started for today.");
  }

  await prisma.queueSession.create({
    data: { doctorId, sessionDate: todayDate, currentToken: 1 }
  });

  return getLiveQueueSnapshot(clinicId);
}

export async function joinQueue(appointmentId: string, doctorId: string, clinicId: string): Promise<PublicQueueSnapshot> {
  const todayDate = getClinicSessionDateForDate();

  const session = await prisma.queueSession.findFirst({
    where: { doctorId, sessionDate: todayDate }
  });

  if (!session) {
    throw new Error("The doctor has not started the queue session for today yet.");
  }

  const existingEntry = await prisma.queueEntry.findUnique({
    where: { appointmentId }
  });

  if (existingEntry) {
    throw new Error("You have already joined the queue.");
  }

  const positionCount = await prisma.queueEntry.count({
    where: { sessionId: session.id }
  });

  await prisma.$transaction([
    prisma.queueEntry.create({
      data: {
        sessionId: session.id,
        appointmentId,
        position: positionCount + 1,
        status: "waiting",
      }
    }),
    prisma.queueEvent.create({
      data: {
        sessionId: session.id,
        type: "PATIENT_JOINED_QUEUE",
        payload: JSON.stringify({ appointmentId })
      }
    })
  ]);

  return getLiveQueueSnapshot(clinicId);
}

export async function skipPatient(appointmentId: string, doctorId: string, clinicId: string): Promise<PublicQueueSnapshot> {
  const todayDate = getClinicSessionDateForDate();

  const session = await prisma.queueSession.findFirst({
    where: { doctorId, sessionDate: todayDate }
  });

  if (!session) {
    throw new Error("No active queue session for this doctor today.");
  }

  await prisma.$transaction(async (tx: any) => {
    const entries = await tx.queueEntry.findMany({
      where: { sessionId: session.id },
      orderBy: { position: "asc" }
    });

    const skippedEntry = entries.find((e: any) => e.appointmentId === appointmentId);
    if (!skippedEntry) {
      throw new Error("Patient queue entry not found.");
    }

    const otherEntries = entries.filter((e: any) => e.appointmentId !== appointmentId);

    let pos = 1;
    for (const entry of otherEntries) {
      await tx.queueEntry.update({
        where: { id: entry.id },
        data: { position: pos }
      });
      pos++;
    }

    await tx.queueEntry.update({
      where: { id: skippedEntry.id },
      data: { position: pos }
    });

    await tx.queueEvent.create({
      data: {
        sessionId: session.id,
        type: "PATIENT_SKIPPED",
        payload: JSON.stringify({ appointmentId })
      }
    });
  });

  return getLiveQueueSnapshot(clinicId);
}
