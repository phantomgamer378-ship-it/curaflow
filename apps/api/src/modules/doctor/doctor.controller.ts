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

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

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
              select: { name: true, phone: true } as any,
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
