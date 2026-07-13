import { createWorker } from "../lib/queue-setup";
import { createLogger } from "@clinic/observability";
import { prisma } from "@clinic/db";

const logger = createLogger("queue-worker");

export const queueWorker = createWorker<any>(
  "queue-queue",
  async (job) => {
    logger.info(`Running queue worker job: ${job.name}`);

    if (job.name === "activate-daily-queue") {
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayDate = new Date(todayStr);

      const startOfDay = new Date(todayDate);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(todayDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      // Find all appointments where slotTime's date is today and status='booked' with no matching queue entry.
      const appointments = await prisma.appointment.findMany({
        where: {
          slotTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: "booked",
          queueEntry: { is: null }
        },
        include: {
          doctor: true
        }
      });

      logger.info(`Found ${appointments.length} same-day appointments to activate into queues.`);

      if (appointments.length === 0) {
        return;
      }

      // Group by doctor to avoid duplicate session fetches and batched broadcasts
      const doctorAptsMap: Record<string, typeof appointments> = {};
      for (const appt of appointments) {
        const list = doctorAptsMap[appt.doctorId] || [];
        list.push(appt);
        doctorAptsMap[appt.doctorId] = list;
      }

      const affectedClinics = new Set<string>();

      for (const [doctorId, doctorApts] of Object.entries(doctorAptsMap)) {
        const firstApt = doctorApts[0];
        if (!firstApt || !firstApt.doctor) continue;
        const doctor = firstApt.doctor;
        affectedClinics.add(doctor.clinicId);

        await prisma.$transaction(async (tx) => {
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

          // Sort appointments by slotTime ascending to assign positions sequentially
          const sortedApts = doctorApts.sort((a, b) => new Date(a.slotTime).getTime() - new Date(b.slotTime).getTime());

          let positionCount = await tx.queueEntry.count({
            where: { sessionId: session.id }
          });

          for (const appt of sortedApts) {
            positionCount++;
            
            await tx.queueEntry.create({
              data: {
                sessionId: session.id,
                appointmentId: appt.id,
                position: positionCount,
                status: "waiting",
                joinedAt: new Date(),
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
        });
      }

      // Broadcast queue updates via Redis pub/sub to the API server
      const Redis = (await import("ioredis")).default;
      const url = process.env.UPSTASH_REDIS_URL || "redis://localhost:6379";
      const redisPublisher = new Redis(url, { maxRetriesPerRequest: null });
      
      for (const clinicId of affectedClinics) {
        try {
          await redisPublisher.publish("queue_broadcast", JSON.stringify({ clinicId }));
          logger.info(`Published queue update to Redis channel for clinic ${clinicId}`);
        } catch (err: any) {
          logger.error(`Failed to publish queue update for clinic ${clinicId}: ${err.message}`);
        }
      }
      await redisPublisher.quit();
    } else if (job.name === "recalc-and-notify") {
      const { doctorId, clinicId } = job.data;
      if (!doctorId || !clinicId) return;

      const todayStr = new Date().toISOString().slice(0, 10);
      const todayDate = new Date(todayStr);

      const session = await prisma.queueSession.findFirst({
        where: { doctorId, sessionDate: todayDate }
      });
      if (!session) return;

      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
      if (!clinic) return;

      const threshold = clinic.gettingCloseThreshold;

      const waitingEntries = await prisma.queueEntry.findMany({
        where: { sessionId: session.id, status: "waiting" },
        orderBy: { position: "asc" }
      });

      const existingEvents = await prisma.queueEvent.findMany({
        where: {
          sessionId: session.id,
          type: { in: ["NOTIFY_GETTING_CLOSE", "NOTIFY_NEXT"] }
        }
      });

      const { notificationQueue } = await import("../../lib/queue-setup");

      for (const entry of waitingEntries) {
        const patientsAhead = waitingEntries.filter(e => e.position < entry.position).length;

        const hasGettingClose = existingEvents.some(
          ev => ev.type === "NOTIFY_GETTING_CLOSE" && JSON.parse(ev.payload).appointmentId === entry.appointmentId
        );
        const hasNext = existingEvents.some(
          ev => ev.type === "NOTIFY_NEXT" && JSON.parse(ev.payload).appointmentId === entry.appointmentId
        );

        if (patientsAhead <= threshold && !hasGettingClose) {
          await prisma.queueEvent.create({
            data: {
              sessionId: session.id,
              type: "NOTIFY_GETTING_CLOSE",
              payload: JSON.stringify({ appointmentId: entry.appointmentId })
            }
          });
          await notificationQueue.add("getting_close", {
            appointmentId: entry.appointmentId,
            patientsAhead
          });
        }

        if (patientsAhead === 0 && !hasNext) {
          await prisma.queueEvent.create({
            data: {
              sessionId: session.id,
              type: "NOTIFY_NEXT",
              payload: JSON.stringify({ appointmentId: entry.appointmentId })
            }
          });
          await notificationQueue.add("you_are_next", {
            appointmentId: entry.appointmentId
          });
        }
      }
    } else if (job.name === "send-24h-reminders") {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      // Find appointments between 24h and 25h from now that haven't had a 24h reminder
      const appointments = await prisma.appointment.findMany({
        where: {
          slotTime: {
            gte: in24h,
            lt: in25h
          },
          status: "booked"
        },
        include: {
          patient: { include: { profile: true } }
        }
      });

      const { notificationQueue } = await import("../../lib/queue-setup");

      for (const appt of appointments) {
        // Check if we've already sent a reminder (we can use an audit log or a simple check)
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: appt.patient.profileId,
            payload: { contains: appt.id },
            // A bit of a hack without JSON querying, but works for the payload shape
          }
        });

        // Better check: We check if the notification payload contains the jobName
        const alreadySent = await prisma.notification.findFirst({
          where: {
            userId: appt.patient.profileId,
            payload: {
              contains: `"jobName":"24h_reminder"`
            }
          }
        });

        // To make it strict to the appointment:
        const sentForThisAppt = await prisma.notification.findFirst({
          where: {
            userId: appt.patient.profileId,
            payload: {
              contains: appt.id
            }
          }
        });

        // A robust way since SQLite doesn't do deep JSON querying easily:
        // We'll just dispatch it; the notification worker will create the record.
        // Wait, to prevent duplicates if the cron runs every 15m, we need a lock.
        // Let's use AuditLog to record it.
        const auditLog = await prisma.auditLog.findFirst({
          where: {
            action: "NOTIFY_24H_REMINDER",
            resourceId: appt.id
          }
        });

        if (!auditLog && appt.patient.profile?.email) {
          await prisma.auditLog.create({
            data: {
              action: "NOTIFY_24H_REMINDER",
              resourceType: "appointment",
              resourceId: appt.id
            }
          });
          await notificationQueue.add("24h_reminder", {
            appointmentId: appt.id
          });
        }
      }
    }
  },
  {
    concurrency: 1
  }
);
