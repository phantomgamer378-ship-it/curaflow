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

export async function getClinics(req: Request, res: Response, next: NextFunction) {
  try {
    const clinics = await prisma.clinic.findMany();
    return res.json({ ok: true, data: clinics });
  } catch (error) {
    next(error);
  }
}

export async function updateClinic(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, openTime, closeTime, gettingCloseThreshold } = req.body;
    
    const clinic = await prisma.clinic.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(openTime !== undefined && { openTime }),
        ...(closeTime !== undefined && { closeTime }),
        ...(gettingCloseThreshold !== undefined && { gettingCloseThreshold }),
      }
    });
    
    return res.json({ ok: true, data: clinic });
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
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Total & Today Appointments
    const totalAppointments = await prisma.appointment.count();
    const appointmentsToday = await prisma.appointment.count({
      where: { slotTime: { gte: todayStart, lte: todayEnd } }
    });

    // 2. Doctors Online
    const doctorsOnline = await prisma.doctor.count({
      where: { isOnline: true }
    });

    // 3. No-Show & Completion rates
    const completedCount = await prisma.appointment.count({ where: { status: "completed" } });
    const cancelledCount = await prisma.appointment.count({ where: { status: "cancelled" } });
    const noShowCount = await prisma.appointment.count({ where: { status: "no_show" } });

    const total7Days = await prisma.appointment.count({
      where: { slotTime: { gte: sevenDaysAgo } }
    });
    const noShow7Days = await prisma.appointment.count({
      where: { status: "no_show", slotTime: { gte: sevenDaysAgo } }
    });
    const noShowRate7Days = total7Days > 0 ? (noShow7Days / total7Days) * 100 : 0;

    const cancellationRate = totalAppointments > 0 ? (cancelledCount / totalAppointments) * 100 : 0;
    const noShowRate = totalAppointments > 0 ? (noShowCount / totalAppointments) * 100 : 0;
    const completionRate = totalAppointments > 0 ? (completedCount / totalAppointments) * 100 : 0;

    // 4. Avg Wait Time Today based on active waiting entries
    const waitingCount = await prisma.queueEntry.count({
      where: { status: "waiting" }
    });
    const avgWaitTimeToday = waitingCount > 0 ? waitingCount * 12 : 11;

    // 5. Doctor Status List
    const doctorsList = await prisma.doctor.findMany({
      where: { deletedAt: null },
      include: {
        profile: {
          select: { name: true, email: true }
        }
      }
    });

    // 6. Recent Activity Feed (10 Audit Logs)
    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
          select: { name: true }
        }
      }
    });

    return res.json({
      ok: true,
      data: {
        totalAppointments,
        appointmentsToday,
        doctorsOnline,
        completedCount,
        cancelledCount,
        noShowCount,
        noShowRate7Days: parseFloat(noShowRate7Days.toFixed(2)),
        cancellationRate: parseFloat(cancellationRate.toFixed(2)),
        noShowRate: parseFloat(noShowRate.toFixed(2)),
        completionRate: parseFloat(completionRate.toFixed(2)),
        avgWaitTimeToday,
        doctorsList,
        recentAuditLogs
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getLiveAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const { clinicId } = req.query;
    if (!clinicId) return res.status(400).json({ ok: false, error: "Missing clinicId" });
    
    const stats = await computeLiveAdminStats(clinicId as string);
    return res.json({ ok: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseInt((req.query.limit as string) || "25", 10);
    const cursor = req.query.cursor as string;
    const { actorId, action, resourceType, dateFrom, dateTo, search, sortBy = "createdAt", sortDir = "desc" } = req.query;

    const where: any = {};
    if (actorId) where.actorId = actorId;
    if (action) {
      where.action = { in: (action as string).split(",") };
    }
    if (resourceType) {
      where.resourceType = { in: (resourceType as string).split(",") };
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    if (search) {
      where.OR = [
        { action: { contains: search as string } },
        { resourceType: { contains: search as string } },
        { profile: { name: { contains: search as string } } }
      ];
    }

    const query: any = {
      where,
      take: limit + 1, // Fetch one extra to see if there is a next page
      orderBy: { [sortBy as string]: sortDir === "asc" ? "asc" : "desc" },
      include: {
        profile: { select: { name: true, role: true } }
      }
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1; // Skip the cursor itself
    }

    const logs = await prisma.auditLog.findMany(query);

    let nextCursor = null;
    let hasMore = false;
    
    if (logs.length > limit) {
      hasMore = true;
      const nextItem = logs.pop(); // Remove the extra item
      if (nextItem) nextCursor = nextItem.id;
    }

    return res.json({
      ok: true,
      data: logs,
      pagination: { nextCursor, hasMore },
    });
  } catch (error) {
    next(error);
  }
}

export async function exportAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { actorId, action, resourceType, dateFrom, dateTo, search } = req.query;

    const where: any = {};
    if (actorId) where.actorId = actorId;
    if (action) where.action = { in: (action as string).split(",") };
    if (resourceType) where.resourceType = { in: (resourceType as string).split(",") };
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    if (search) {
      where.OR = [
        { action: { contains: search as string } },
        { resourceType: { contains: search as string } },
        { profile: { name: { contains: search as string } } }
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { profile: { select: { name: true, role: true } } }
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");

    // Super simple CSV generator
    const headers = ["Timestamp", "Actor", "Role", "Action", "Resource Type", "Resource ID", "Metadata"];
    const rows = logs.map(l => [
      l.createdAt.toISOString(),
      `"${l.profile?.name || 'System'}"`,
      l.profile?.role || 'system',
      l.action,
      l.resourceType,
      l.resourceId || '',
      `"${l.metadata.replace(/"/g, '""')}"`
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    return res.send(csv);
  } catch (error) {
    next(error);
  }
}

export async function computeLiveAdminStats(clinicId: string) {
  // 1. Appointments Today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const appointmentsToday = await prisma.appointment.count({
    where: {
      clinicId,
      slotTime: { gte: todayStart }
    }
  });

  // 2. Patients Waiting Now
  const patientsWaitingNow = await prisma.queueEntry.count({
    where: {
      status: "waiting",
      appointment: { clinicId }
    }
  });

  // 3. Doctors Online
  const doctorsOnline = await prisma.doctor.count({
    where: {
      clinicId,
      isOnline: true
    }
  });

  // 4. No Shows Today
  const noShowsToday = await prisma.appointment.count({
    where: {
      clinicId,
      status: "no_show",
      updatedAt: { gte: todayStart }
    }
  });

  // 5. Avg Wait Time Today (rough estimate based on checked-in patients minus joined time)
  // Since we don't have direct SQL `filter` via Prisma, we fetch the completed ones today
  const completedEntries = await prisma.queueEntry.findMany({
    where: {
      status: "completed",
      checkedInAt: { not: null },
      updatedAt: { gte: todayStart },
      appointment: { clinicId }
    },
    select: { checkedInAt: true, updatedAt: true }
  });

  let totalWaitMs = 0;
  let count = 0;
  for (const e of completedEntries) {
    if (e.checkedInAt) {
      totalWaitMs += (e.updatedAt.getTime() - e.checkedInAt.getTime());
      count++;
    }
  }
  const avgWaitTimeMinutes = count > 0 ? Math.round(totalWaitMs / count / 60000) : 0;

  // 6. Doctor Performance Table
  const doctors = await prisma.doctor.findMany({
    where: { clinicId, deletedAt: null },
    include: { profile: { select: { name: true } } }
  });

  // We do separate queries per doctor since Prisma doesn't do complex GROUP BY easily with relational counts
  const doctorPerformance = await Promise.all(doctors.map(async (doc) => {
    const patientsSeenToday = await prisma.appointment.count({
      where: { doctorId: doc.id, status: "completed", updatedAt: { gte: todayStart } }
    });
    
    const docNoShowsToday = await prisma.appointment.count({
      where: { doctorId: doc.id, status: "no_show", updatedAt: { gte: todayStart } }
    });

    const docCompletedEntries = await prisma.queueEntry.findMany({
      where: { status: "completed", checkedInAt: { not: null }, updatedAt: { gte: todayStart }, appointment: { doctorId: doc.id } },
      select: { checkedInAt: true, updatedAt: true }
    });
    let dTotal = 0;
    for (const e of docCompletedEntries) {
      if (e.checkedInAt) dTotal += (e.updatedAt.getTime() - e.checkedInAt.getTime());
    }
    const avgConsultationMinutes = docCompletedEntries.length > 0 ? Math.round(dTotal / docCompletedEntries.length / 60000) : 0;

    return {
      doctorId: doc.id,
      doctorName: doc.profile.name,
      patientsSeenToday,
      noShowsToday: docNoShowsToday,
      avgConsultationMinutes
    };
  }));

  return {
    appointmentsToday,
    patientsWaitingNow,
    doctorsOnline,
    noShowsToday,
    avgWaitTimeMinutes,
    doctorPerformance
  };
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

export async function adminAddQueueEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const { patientId, doctorId, clinicId, slotTime } = req.body;

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return res.status(400).json({ ok: false, error: "Patient not found" });

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) return res.status(400).json({ ok: false, error: "Doctor not found" });

    const slotDate = slotTime ? new Date(slotTime) : new Date();

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

    const result = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.create({
        data: {
          patientId,
          doctorId,
          clinicId: doctor.clinicId,
          slotTime: slotDate,
          tokenNo,
          status: "checked_in", // Checked in because admin checked them in physically
        },
      });

      // Get or create queue session
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

      const entry = await tx.queueEntry.create({
        data: {
          sessionId: session.id,
          appointmentId: appt.id,
          position: positionCount + 1,
          status: "waiting",
          joinedAt: new Date(),
          checkedInAt: new Date(),
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

      return { appt, entry };
    });

    const { getLiveQueueSnapshot } = await import("@clinic/queue");
    const { broadcastQueueUpdate } = await import("../../config/socket");
    const snapshot = await getLiveQueueSnapshot(doctor.clinicId);
    broadcastQueueUpdate(doctor.clinicId, snapshot);

    return res.status(201).json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function adminEditQueueEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const { entryId } = req.params;
    const { status, position, doctorId } = req.body;

    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { appointment: true, session: true }
    });

    if (!entry) {
      return res.status(404).json({ ok: false, error: "Queue entry not found" });
    }

    const clinicId = entry.appointment.clinicId;

    await prisma.$transaction(async (tx) => {
      // 1. Status Update
      if (status) {
        await tx.queueEntry.update({
          where: { id: entryId },
          data: { status }
        });
        
        let apptStatus = "booked";
        if (status === "in_consultation") apptStatus = "in_consultation";
        if (status === "completed") apptStatus = "completed";
        if (status === "no_show") apptStatus = "no_show";

        await tx.appointment.update({
          where: { id: entry.appointmentId },
          data: { status: apptStatus }
        });
      }

      // 2. Doctor Reassignment
      if (doctorId && doctorId !== entry.session.doctorId) {
        const newDoctor = await tx.doctor.findUnique({ where: { id: doctorId } });
        if (!newDoctor) throw new Error("Target doctor not found");

        const startOfDay = new Date(entry.session.sessionDate);
        startOfDay.setUTCHours(0, 0, 0, 0);

        // Find or create target doctor session
        let newSession = await tx.queueSession.findUnique({
          where: {
            doctorId_sessionDate: {
              doctorId,
              sessionDate: startOfDay,
            }
          }
        });

        if (!newSession) {
          newSession = await tx.queueSession.create({
            data: {
              doctorId,
              sessionDate: startOfDay,
              status: newDoctor.isOnline ? "active" : "not_started",
              currentToken: 0
            }
          });
        }

        const newSessionEntriesCount = await tx.queueEntry.count({
          where: { sessionId: newSession.id }
        });

        // Update appointment and move entry
        await tx.appointment.update({
          where: { id: entry.appointmentId },
          data: { doctorId }
        });

        await tx.queueEntry.update({
          where: { id: entryId },
          data: {
            sessionId: newSession.id,
            position: newSessionEntriesCount + 1
          }
        });

        // Compact positions in old session
        const oldSessionEntries = await tx.queueEntry.findMany({
          where: { sessionId: entry.sessionId, id: { not: entryId } },
          orderBy: { position: "asc" }
        });

        let pos = 1;
        for (const oldEntry of oldSessionEntries) {
          await tx.queueEntry.update({
            where: { id: oldEntry.id },
            data: { position: pos }
          });
          pos++;
        }
      }

      // 3. Manual Position Reorder
      if (position !== undefined && position !== entry.position) {
        const sessionEntries = await tx.queueEntry.findMany({
          where: { sessionId: entry.sessionId },
          orderBy: { position: "asc" }
        });

        const otherEntries = sessionEntries.filter(e => e.id !== entryId);
        
        // Insert entry at target position index (1-indexed)
        const targetIndex = Math.max(0, Math.min(position - 1, otherEntries.length));
        otherEntries.splice(targetIndex, 0, entry);

        let pos = 1;
        for (const orderedEntry of otherEntries) {
          await tx.queueEntry.update({
            where: { id: orderedEntry.id },
            data: { position: pos }
          });
          pos++;
        }
      }
    });

    const { getLiveQueueSnapshot } = await import("@clinic/queue");
    const { broadcastQueueUpdate } = await import("../../config/socket");
    const snapshot = await getLiveQueueSnapshot(clinicId);
    broadcastQueueUpdate(clinicId, snapshot);

    return res.json({ ok: true, message: "Queue entry updated successfully" });
  } catch (error: any) {
    next(error);
  }
}

export async function adminDeleteQueueEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const { entryId } = req.params;

    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { appointment: true }
    });

    if (!entry) {
      return res.status(404).json({ ok: false, error: "Queue entry not found" });
    }

    const clinicId = entry.appointment.clinicId;

    await prisma.$transaction(async (tx) => {
      // Deleting queue entry & soft-cancelling the appointment
      await tx.appointment.update({
        where: { id: entry.appointmentId },
        data: { status: "cancelled" }
      });

      await tx.queueEntry.delete({
        where: { id: entryId }
      });

      // Compact positions
      const sessionEntries = await tx.queueEntry.findMany({
        where: { sessionId: entry.sessionId },
        orderBy: { position: "asc" }
      });

      let pos = 1;
      for (const orderedEntry of sessionEntries) {
        await tx.queueEntry.update({
          where: { id: orderedEntry.id },
          data: { position: pos }
        });
        pos++;
      }
    });

    const { getLiveQueueSnapshot } = await import("@clinic/queue");
    const { broadcastQueueUpdate } = await import("../../config/socket");
    const snapshot = await getLiveQueueSnapshot(clinicId);
    broadcastQueueUpdate(clinicId, snapshot);

    return res.json({ ok: true, message: "Queue entry deleted and appointment cancelled successfully" });
  } catch (error) {
    next(error);
  }
}
