import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { prisma } from "../../config/db";
import {
  getLiveQueueSnapshot,
  startConsultation,
  markPatientDone,
  markNoShow,
  startQueueSession,
  joinQueue,
} from "@clinic/queue";
import { broadcastQueueUpdate } from "../../config/socket";
import { aiQueue, queueQueue, notificationQueue } from "../../config/queue";

export async function getQueueStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { clinicId } = req.params;
    if (!clinicId) {
      return res.status(400).json({ ok: false, error: "Missing clinicId parameter" });
    }

    const snapshot = await getLiveQueueSnapshot(clinicId);
    return res.json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
}

export async function startConsult(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params; // Appointment ID

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }

    // Verify it belongs to this doctor
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id },
    });

    if (!doctor || appointment.doctorId !== doctor.id) {
      return res.status(403).json({ ok: false, error: "Unauthorized: Appointment belongs to another doctor" });
    }

    await startConsultation({
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId,
    });

    const snapshot = await getLiveQueueSnapshot(appointment.clinicId);
    broadcastQueueUpdate(appointment.clinicId, snapshot);

    await notificationQueue.add("being_called", {
      appointmentId: appointment.id,
    });

    await queueQueue.add("recalc-and-notify", {
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId,
    });

    return res.json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
}

export async function completeConsult(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params; // Appointment ID
    const { diagnosis, notes } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id },
    });

    if (!doctor || appointment.doctorId !== doctor.id) {
      return res.status(403).json({ ok: false, error: "Unauthorized: Appointment belongs to another doctor" });
    }

    // Save consultation notes in a transaction
    if (diagnosis || notes) {
      await prisma.consultationNotes.upsert({
        where: { appointmentId: appointment.id },
        update: { diagnosis, notes },
        create: {
          appointmentId: appointment.id,
          doctorId: doctor.id,
          diagnosis,
          notes,
        },
      });
    }

    const snapshot = await markPatientDone({
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId,
    });

    // Broadcast queue update instantly to all screens (TVs, patients)
    broadcastQueueUpdate(appointment.clinicId, snapshot);

    await queueQueue.add("recalc-and-notify", {
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId,
    });

    // Queue background job for AI summarization & health recommendations
    if (notes || diagnosis) {
      await aiQueue.add("process-consultation-ai", {
        appointmentId: appointment.id,
        diagnosis,
        notes,
      });
    }

    return res.json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
}

export async function markConsultNoShow(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params; // Appointment ID

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id },
    });

    if (!doctor || appointment.doctorId !== doctor.id) {
      return res.status(403).json({ ok: false, error: "Unauthorized: Appointment belongs to another doctor" });
    }

    const snapshot = await markNoShow({
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId,
    });

    broadcastQueueUpdate(appointment.clinicId, snapshot);

    await queueQueue.add("recalc-and-notify", {
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId,
    });

    return res.json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
}

export async function startSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id },
    });

    if (!doctor) {
      return res.status(403).json({ ok: false, error: "Unauthorized: Only doctors can start a queue session" });
    }

    const snapshot = await startQueueSession(doctor.id, doctor.clinicId);
    broadcastQueueUpdate(doctor.clinicId, snapshot);

    return res.json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
}

export async function patientJoinQueue(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ ok: false, error: "Missing appointmentId" });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true }
    });

    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }

    if (appointment.patient.profileId !== req.user?.id) {
      return res.status(403).json({ ok: false, error: "Unauthorized: Appointment belongs to another patient" });
    }

    const snapshot = await joinQueue(appointment.id, appointment.doctorId, appointment.clinicId);
    broadcastQueueUpdate(appointment.clinicId, snapshot);

    return res.json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
}

export async function skipConsult(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params; // Appointment ID

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id },
    });

    if (!doctor || appointment.doctorId !== doctor.id) {
      return res.status(403).json({ ok: false, error: "Unauthorized: Appointment belongs to another doctor" });
    }

    const { skipPatient } = await import("@clinic/queue");
    const snapshot = await skipPatient(appointment.id, doctor.id, appointment.clinicId);

    // Broadcast queue update instantly to all screens (TVs, patients)
    broadcastQueueUpdate(appointment.clinicId, snapshot);

    await queueQueue.add("recalc-and-notify", {
      doctorId: doctor.id,
      clinicId: appointment.clinicId,
    });

    // Queue notification that the patient has been skipped
    const { notificationQueue } = await import("../../config/queue");
    const patientProfile = await prisma.patient.findUnique({
      where: { id: appointment.patientId },
      include: { profile: true }
    });

    if (patientProfile?.profile?.email) {
      await notificationQueue.add("send-booking-reschedule", {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        email: patientProfile.profile.email,
        reason: "You've been moved to the end of the queue since you were not ready."
      });
    }

    return res.json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
}

export async function removeQueueEntry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params; // Appointment ID

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id },
    });

    if (!doctor || appointment.doctorId !== doctor.id) {
      return res.status(403).json({ ok: false, error: "Unauthorized: Appointment belongs to another doctor" });
    }

    const { markNoShow } = await import("@clinic/queue");
    const snapshot = await markNoShow({
      appointmentId: appointment.id,
      doctorId: doctor.id,
      clinicId: appointment.clinicId,
    });

    broadcastQueueUpdate(appointment.clinicId, snapshot);

    const { queueQueue: qQueue } = await import("../../config/queue");
    await qQueue.add("recalc-and-notify", {
      doctorId: doctor.id,
      clinicId: appointment.clinicId,
    });

    return res.json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
}
