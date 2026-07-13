import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { prisma } from "../../config/db";
import { notificationQueue } from "../../config/queue";

export async function getAvailableDoctors(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        profile: { select: { id: true, name: true, email: true } as any },
        clinic: { select: { id: true, name: true } }
      },
    });
    return res.json({ ok: true, data: doctors });
  } catch (error) {
    next(error);
  }
}

export async function getAppointments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;

    if (role === "patient") {
      const patient = await prisma.patient.findUnique({
        where: { profileId: userId },
      });
      if (!patient) {
        return res.status(400).json({ ok: false, error: "Patient profile not found" });
      }

      const appointments = await prisma.appointment.findMany({
        where: { patientId: patient.id },
        include: {
          doctor: {
            include: {
              profile: {
                select: { name: true } as any,
              },
            },
          },
          clinic: true,
          queueEntry: true,
        },
        orderBy: { slotTime: "desc" },
      });

      return res.json({ ok: true, data: appointments });
    }

    if (role === "doctor") {
      const doctor = await prisma.doctor.findUnique({
        where: { profileId: userId },
      });
      if (!doctor) {
        return res.status(400).json({ ok: false, error: "Doctor profile not found" });
      }

      const appointments = await prisma.appointment.findMany({
        where: { doctorId: doctor.id },
        include: {
          patient: {
            include: {
              profile: {
                select: { name: true, phone: true, email: true } as any,
              },
            },
          },
          notes: true,
        },
        orderBy: { slotTime: "asc" },
      });

      return res.json({ ok: true, data: appointments });
    }

    if (role === "admin") {
      const appointments = await prisma.appointment.findMany({
        include: {
          patient: {
            include: {
              profile: {
                select: { name: true } as any,
              },
            },
          },
          doctor: {
            include: {
              profile: {
                select: { name: true } as any,
              },
            },
          },
          clinic: true,
        },
        orderBy: { slotTime: "desc" },
      });

      return res.json({ ok: true, data: appointments });
    }

    return res.status(403).json({ ok: false, error: "Forbidden" });
  } catch (error) {
    next(error);
  }
}

export async function bookAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { doctorId, slotTime } = req.body;

    const patient = await prisma.patient.findUnique({
      where: { profileId: userId },
    });
    if (!patient) {
      return res.status(400).json({ ok: false, error: "Only patients can book appointments" });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor not found" });
    }

    const slotDate = new Date(slotTime);

    // Check conflict (only active bookings)
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId,
        slotTime: slotDate,
        status: { notIn: ["cancelled", "no_show"] },
      },
    });

    if (conflict) {
      return res.status(400).json({ ok: false, error: "This slot is already booked" });
    }

    // Determine Token Number (Sequential count for this doctor for this day)
    const startOfDay = new Date(slotDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(slotDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const tokenCount = await prisma.appointment.count({
      where: {
        doctorId,
        slotTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { notIn: ["cancelled", "no_show"] },
      },
    });

    const tokenNo = tokenCount + 1;

    // Create appointment inside a transaction
    const appointment = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.create({
        data: {
          patientId: patient.id,
          doctorId,
          clinicId: doctor.clinicId,
          slotTime: slotDate,
          tokenNo,
          status: "booked",
        },
      });

      // If slotTime is today, auto-join queue
      const todayStr = new Date().toISOString().slice(0, 10);
      const slotStr = slotDate.toISOString().slice(0, 10);
      if (todayStr === slotStr) {
        // Look up or create queue session
        let session = await tx.queueSession.findUnique({
          where: {
            doctorId_sessionDate: {
              doctorId,
              sessionDate: startOfDay,
            }
          }
        });

        if (!session) {
          session = await tx.queueSession.create({
            data: {
              doctorId,
              sessionDate: startOfDay,
              status: doctor.isOnline ? "active" : "not_started",
              currentToken: 0
            }
          });
        }

        const positionCount = await tx.queueEntry.count({
          where: { sessionId: session.id }
        });

        await tx.queueEntry.create({
          data: {
            sessionId: session.id,
            appointmentId: appt.id,
            position: positionCount + 1,
            status: "waiting",
            joinedAt: new Date(),
          }
        });

        await tx.queueEvent.create({
          data: {
            sessionId: session.id,
            type: "APPOINTMENT_CREATED",
            payload: JSON.stringify({ appointmentId: appt.id })
          }
        });

        await tx.queueEvent.create({
          data: {
            sessionId: session.id,
            type: "QUEUE_JOINED",
            payload: JSON.stringify({ appointmentId: appt.id })
          }
        });
      }

      return appt;
    });

    // Broadcast queue update if same-day
    const todayStr = new Date().toISOString().slice(0, 10);
    const slotStr = slotDate.toISOString().slice(0, 10);
    if (todayStr === slotStr) {
      const { getLiveQueueSnapshot } = await import("@clinic/queue");
      const { broadcastQueueUpdate } = await import("../../config/socket");
      const snapshot = await getLiveQueueSnapshot(doctor.clinicId);
      broadcastQueueUpdate(doctor.clinicId, snapshot);
    }

    // Queue reminder and confirmation notifications
    await notificationQueue.add("send-booking-confirmation", {
      appointmentId: appointment.id,
      patientId: patient.id,
      email: req.user?.email,
      tokenNo,
    });

    return res.status(201).json({ ok: true, data: appointment });
  } catch (error) {
    next(error);
  }
}

export async function reschedule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { newSlotTime } = req.body;
    const userId = req.user?.id;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }

    // Verify ownership
    if (req.user?.role === "patient" && appointment.patient.profileId !== userId) {
      return res.status(403).json({ ok: false, error: "Forbidden: You do not own this appointment" });
    }

    const slotDate = new Date(newSlotTime);

    // Check conflict
    const conflict = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        doctorId: appointment.doctorId,
        slotTime: slotDate,
        status: { notIn: ["cancelled", "no_show"] },
      },
    });

    if (conflict) {
      return res.status(400).json({ ok: false, error: "The new slot is already booked" });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { slotTime: slotDate, status: "confirmed" },
    });

    // Notify reschedule
    await notificationQueue.add("send-booking-reschedule", {
      appointmentId: updated.id,
      patientId: updated.patientId,
      newSlotTime,
    });

    return res.json({ ok: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function cancel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }

    // Verify ownership
    if (req.user?.role === "patient" && appointment.patient.profileId !== userId) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: "cancelled" },
    });

    // Notify cancellation
    await notificationQueue.add("send-booking-cancellation", {
      appointmentId: updated.id,
      patientId: updated.patientId,
    });

    return res.json({ ok: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user?.id },
      orderBy: { createdAt: "desc" },
      take: 10
    });
    return res.json({ ok: true, data: notifications });
  } catch (error) {
    next(error);
  }
}
