import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/db";

export async function getPatients(req: Request, res: Response, next: NextFunction) {
  try {
    const search = req.query.search as string;
    const limit = parseInt((req.query.limit as string) || "50", 10);
    const offset = parseInt((req.query.offset as string) || "0", 10);

    const whereClause: any = {
      role: "patient",
      deletedAt: null,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [patients, total] = await prisma.$transaction([
      prisma.patient.findMany({
        where: {
          profile: whereClause,
        },
        include: {
          profile: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              createdAt: true,
            },
          },
        },
        orderBy: { id: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.patient.count({
        where: {
          profile: whereClause,
        },
      }),
    ]);

    return res.json({
      ok: true,
      data: patients,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDoctors(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseInt((req.query.limit as string) || "50", 10);
    const offset = parseInt((req.query.offset as string) || "0", 10);

    const [doctors, total] = await prisma.$transaction([
      prisma.doctor.findMany({
        include: {
          profile: {
            select: { id: true, email: true, name: true, phone: true }
          },
          clinic: true,
        },
        orderBy: { id: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.doctor.count(),
    ]);

    return res.json({
      ok: true,
      data: doctors,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAppointmentsAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseInt((req.query.limit as string) || "50", 10);
    const offset = parseInt((req.query.offset as string) || "0", 10);

    const [appointments, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        include: {
          patient: {
            include: {
              profile: {
                select: { name: true, email: true } as any,
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
        take: limit,
        skip: offset,
      }),
      prisma.appointment.count(),
    ]);

    return res.json({
      ok: true,
      data: appointments,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const totalAppointments = await prisma.appointment.count();
    const completedCount = await prisma.appointment.count({ where: { status: "completed" } });
    const cancelledCount = await prisma.appointment.count({ where: { status: "cancelled" } });
    const noShowCount = await prisma.appointment.count({ where: { status: "no_show" } });

    const cancellationRate = totalAppointments > 0 ? (cancelledCount / totalAppointments) * 100 : 0;
    const noShowRate = totalAppointments > 0 ? (noShowCount / totalAppointments) * 100 : 0;
    const completionRate = totalAppointments > 0 ? (completedCount / totalAppointments) * 100 : 0;

    return res.json({
      ok: true,
      data: {
        totalAppointments,
        completedCount,
        cancelledCount,
        noShowCount,
        cancellationRate: parseFloat(cancellationRate.toFixed(2)),
        noShowRate: parseFloat(noShowRate.toFixed(2)),
        completionRate: parseFloat(completionRate.toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseInt((req.query.limit as string) || "50", 10);
    const offset = parseInt((req.query.offset as string) || "0", 10);

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count(),
    ]);

    return res.json({
      ok: true,
      data: logs,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    next(error);
  }
}

export async function createDoctor(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, phone, clinicId, specialty, slotDurationMin, maxPatientsPerSlot } = req.body;

    const existing = await prisma.profile.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ ok: false, error: "Email is already registered" });
    }

    // Default password for newly created doctor profiles
    const defaultPassword = "DoctorTempPassword123!";
    const passwordHash = bcrypt.hashSync(defaultPassword, 10);

    const doctor = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.create({
        data: {
          email,
          passwordHash,
          name,
          phone: phone || null,
          role: "doctor",
        },
      });

      return await tx.doctor.create({
        data: {
          profileId: profile.id,
          clinicId,
          specialty: specialty || null,
          slotDurationMin: slotDurationMin || 15,
          maxPatientsPerSlot: maxPatientsPerSlot || 1,
        },
      });
    });

    return res.status(201).json({ ok: true, data: doctor });
  } catch (error) {
    next(error);
  }
}

export async function updateAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string; // Doctor ID
    const { weekday, startTime, endTime } = req.body;

    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor not found" });
    }

    const availability = await prisma.doctorAvailability.upsert({
      where: {
        doctorId_weekday_startTime: {
          doctorId: id,
          weekday,
          startTime,
        },
      },
      update: { endTime },
      create: {
        doctorId: id,
        weekday,
        startTime,
        endTime,
      },
    });

    return res.json({ ok: true, data: availability });
  } catch (error) {
    next(error);
  }
}

export async function addHoliday(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string; // Clinic ID
    const { date, reason } = req.body;

    const clinic = await prisma.clinic.findUnique({ where: { id } });
    if (!clinic) {
      return res.status(404).json({ ok: false, error: "Clinic not found" });
    }

    const holiday = await prisma.clinicHoliday.create({
      data: {
        clinicId: id,
        date: new Date(date),
        reason: reason || null,
      },
    });

    return res.status(201).json({ ok: true, data: holiday });
  } catch (error) {
    next(error);
  }
}

export async function addLeave(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string; // Doctor ID
    const { date, reason } = req.body;

    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor not found" });
    }

    const leave = await prisma.doctorLeave.create({
      data: {
        doctorId: id,
        date: new Date(date),
        reason: reason || null,
      },
    });

    return res.status(201).json({ ok: true, data: leave });
  } catch (error) {
    next(error);
  }
}
