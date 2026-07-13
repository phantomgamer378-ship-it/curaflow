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
    }
  },
  {
    concurrency: 1
  }
);
