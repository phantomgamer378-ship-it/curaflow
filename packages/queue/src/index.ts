import { prisma } from "@clinic/db";
import type { PublicQueueSnapshot } from "@clinic/types";

export type QueueTransaction = {
  appointmentId: string;
  doctorId: string;
  clinicId: string;
};

export async function getLiveQueueSnapshot(clinicId: string): Promise<PublicQueueSnapshot> {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(todayStr);

  const doctors = await prisma.doctor.findMany({
    where: { clinicId, deletedAt: null },
    select: { id: true }
  });

  const doctorIds = doctors.map(d => d.id);

  const sessions = await prisma.queueSession.findMany({
    where: {
      doctorId: { in: doctorIds },
      sessionDate: todayDate
    },
    select: { id: true, currentToken: true }
  });

  const currentToken = sessions.reduce((acc, s) => acc + s.currentToken, 0);

  if (sessions.length === 0) {
    return { current_token: 0, waiting_count: 0 };
  }

  const sessionIds = sessions.map(s => s.id);

  const waitingCount = await prisma.queueEntry.count({
    where: {
      sessionId: { in: sessionIds },
      status: "waiting"
    }
  });

  return { current_token: currentToken, waiting_count: waitingCount };
}

async function getOrCreateSession(doctorId: string) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(todayStr);

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
    prisma.queueEntry.update({
      where: {
        sessionId_appointmentId: {
          sessionId: session.id,
          appointmentId: input.appointmentId
        }
      },
      data: { status: "in_consultation" }
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
    prisma.queueEntry.update({
      where: {
        sessionId_appointmentId: {
          sessionId: session.id,
          appointmentId: input.appointmentId
        }
      },
      data: { status: "completed" }
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
    prisma.queueEntry.update({
      where: {
        sessionId_appointmentId: {
          sessionId: session.id,
          appointmentId: input.appointmentId
        }
      },
      data: { status: "no_show" }
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
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(todayStr);

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
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(todayStr);

  const session = await prisma.queueSession.findFirst({
    where: { doctorId, sessionDate: todayDate }
  });

  if (!session) {
    throw new Error("The doctor has not started the queue session for today yet.");
  }

  const existingEntry = await prisma.queueEntry.findUnique({
    where: { sessionId_appointmentId: { sessionId: session.id, appointmentId } }
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
