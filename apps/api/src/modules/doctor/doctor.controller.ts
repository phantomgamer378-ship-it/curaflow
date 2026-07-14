import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { prisma } from "../../config/db";

export async function getTodayAppointments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id },
    });

    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor profile not found" });
    }

    // Use a wide window: yesterday midnight to tomorrow midnight (UTC)
    // This ensures appointments booked in IST (+5:30) that cross UTC midnight are always visible
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // local midnight today

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999); // local end of today

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        slotTime: { gte: todayStart, lte: todayEnd },
        status: { notIn: ["cancelled", "no_show"] },
      },
      include: {
        patient: {
          include: {
            profile: {
              select: { name: true, phone: true, email: true } as any,
            },
          },
        },
        notes: true,
        queueEntry: true,
      },
      orderBy: { slotTime: "asc" },
    });

    return res.json({ ok: true, data: appointments });
  } catch (error) {
    next(error);
  }
}

export async function getDoctorProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id },
      include: {
        profile: {
          select: { id: true, name: true, email: true, phone: true } as any,
        },
        clinic: true,
        availabilities: true,
        leaves: {
          where: { date: { gte: new Date() } },
          orderBy: { date: "asc" },
        },
        queueSessions: {
          orderBy: { sessionDate: "desc" },
          take: 1,
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor profile not found" });
    }

    return res.json({ ok: true, data: doctor });
  } catch (error) {
    next(error);
  }
}

export async function goOnline(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id },
    });

    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor profile not found" });
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctor.id },
      data: { isOnline: true, onlineSince: new Date() },
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayDate = new Date(todayStr);

    let session = await prisma.queueSession.findFirst({
      where: { doctorId: doctor.id, sessionDate: todayDate }
    });

    if (session) {
      session = await prisma.queueSession.update({
        where: { id: session.id },
        data: { status: "active" }
      });
    } else {
      session = await prisma.queueSession.create({
        data: { doctorId: doctor.id, sessionDate: todayDate, currentToken: 1, status: "active" }
      });
    }

    const { getLiveQueueSnapshot } = await import("@clinic/queue");
    const { broadcastQueueUpdate } = await import("../../config/socket");
    const snapshot = await getLiveQueueSnapshot(doctor.clinicId);
    broadcastQueueUpdate(doctor.clinicId, snapshot);

    return res.json({ ok: true, data: { doctor: updatedDoctor, session } });
  } catch (error) {
    next(error);
  }
}

export async function pauseQueue(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id },
    });

    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor profile not found" });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayDate = new Date(todayStr);

    let session = await prisma.queueSession.findFirst({
      where: { doctorId: doctor.id, sessionDate: todayDate }
    });

    if (!session) {
      return res.status(400).json({ ok: false, error: "No active queue session found for today" });
    }

    session = await prisma.queueSession.update({
      where: { id: session.id },
      data: { status: "paused" }
    });

    const { getLiveQueueSnapshot } = await import("@clinic/queue");
    const { broadcastQueueUpdate } = await import("../../config/socket");
    const snapshot = await getLiveQueueSnapshot(doctor.clinicId);
    broadcastQueueUpdate(doctor.clinicId, snapshot);

    return res.json({ ok: true, data: { session } });
  } catch (error) {
    next(error);
  }
}

export async function goOffline(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id },
      include: { profile: true }
    });

    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor profile not found" });
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctor.id },
      data: { isOnline: false, onlineSince: null },
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayDate = new Date(todayStr);

    let session = await prisma.queueSession.findFirst({
      where: { doctorId: doctor.id, sessionDate: todayDate }
    });

    if (session) {
      session = await prisma.queueSession.update({
        where: { id: session.id },
        data: { status: "closed" }
      });

      // Notify and cancel still-waiting patients
      const waitingEntries = await prisma.queueEntry.findMany({
        where: { sessionId: session.id, status: "waiting" },
        include: { appointment: { include: { patient: { include: { profile: true } } } } }
      });

      const { notificationQueue } = await import("../../config/queue");

      for (const entry of waitingEntries) {
        // Mark entry status
        await prisma.queueEntry.update({
          where: { id: entry.id },
          data: { status: "no_show" }
        });

        // Mark appointment status
        await prisma.appointment.update({
          where: { id: entry.appointmentId },
          data: { status: "cancelled" }
        });

        // Queue notification
        if (entry.appointment?.patient?.profile?.email) {
          await notificationQueue.add("send-booking-cancellation", {
            appointmentId: entry.appointmentId,
            patientId: entry.appointment.patientId,
            email: entry.appointment.patient.profile.email,
            reason: `Dr. ${doctor.profile.name} went offline. Please reschedule your appointment.`
          });
        }
      }
    }

    const { getLiveQueueSnapshot } = await import("@clinic/queue");
    const { broadcastQueueUpdate } = await import("../../config/socket");
    const snapshot = await getLiveQueueSnapshot(doctor.clinicId);
    broadcastQueueUpdate(doctor.clinicId, snapshot);

    return res.json({ ok: true, data: { doctor: updatedDoctor, session } });
  } catch (error) {
    next(error);
  }
}

export async function updateDoctorProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id },
      include: { profile: true },
    });

    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor profile not found" });
    }

    const { name, phone, avatarUrl, bio, qualifications, yearsExperience, languages, consultationFee, specialty } = req.body;

    // Update Profile
    const profileUpdate: any = {};
    if (name !== undefined) profileUpdate.name = name;
    if (phone !== undefined) profileUpdate.phone = phone;
    if (avatarUrl !== undefined) profileUpdate.avatarUrl = avatarUrl;

    if (Object.keys(profileUpdate).length > 0) {
      await prisma.profile.update({
        where: { id: doctor.profileId },
        data: profileUpdate,
      });
    }

    // Update Doctor
    const doctorUpdate: any = {};
    if (bio !== undefined) doctorUpdate.bio = bio;
    if (qualifications !== undefined) doctorUpdate.qualifications = qualifications;
    if (yearsExperience !== undefined) doctorUpdate.yearsExperience = typeof yearsExperience === 'number' ? yearsExperience : parseInt(yearsExperience, 10);
    if (languages !== undefined) doctorUpdate.languages = Array.isArray(languages) ? languages.join(',') : languages;
    if (consultationFee !== undefined) doctorUpdate.consultationFee = typeof consultationFee === 'number' ? consultationFee : parseInt(consultationFee, 10);
    if (specialty !== undefined) doctorUpdate.specialty = specialty;

    let updatedDoctor: any = doctor;
    if (Object.keys(doctorUpdate).length > 0) {
      updatedDoctor = await prisma.doctor.update({
        where: { id: doctor.id },
        data: doctorUpdate,
        include: { profile: true } as any,
      });
    } else {
      updatedDoctor = await prisma.doctor.findUnique({
        where: { id: doctor.id },
        include: { profile: true } as any,
      }) as any;
    }

    return res.json({ ok: true, data: updatedDoctor });
  } catch (error) {
    next(error);
  }
}
