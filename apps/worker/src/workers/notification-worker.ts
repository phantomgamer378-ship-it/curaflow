import { createWorker } from "../lib/queue-setup";
import { createLogger } from "@clinic/observability";
import { prisma } from "@clinic/db";

const logger = createLogger("notification-worker");

export const notificationWorker = createWorker<any>(
  "notification-queue",
  async (job) => {
    const data = job.data;
    
    let notificationId = data.notificationId;

    // If we received an event-based trigger instead of a pre-created notificationId
    if (!notificationId) {
      const { userId, email, name, appointmentId, tokenNo, resetToken, newSlotTime } = data;
      
      // Determine user ID if not explicitly provided
      let targetUserId = userId;
      if (!targetUserId && appointmentId) {
        const appt = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          include: { patient: true }
        });
        if (appt) {
          targetUserId = appt.patient.profileId;
        }
      }

      if (!targetUserId) {
        logger.info(`No target user found for job ${job.name}, skipping notification creation.`);
        return;
      }

      // Create notification in DB
      const newNotification = await prisma.notification.create({
        data: {
          userId: targetUserId,
          channel: "email",
          status: "pending",
          payload: {
            jobName: job.name,
            email,
            name,
            tokenNo,
            resetToken,
            newSlotTime,
          }
        }
      });
      notificationId = newNotification.id;
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    try {
      logger.info(`Sending ${notification.channel} notification to user ${notification.userId}`, {
        payload: JSON.stringify(notification.payload)
      });
      
      // Here, standard integration with Resend / Twilio / MSG91 would happen.
      // We simulate successful transmission by logging and updating status.
      
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: "sent" }
      });

    } catch (error: any) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: "failed",
          payload: {
            ...(notification.payload as any),
            error: error.message
          }
        }
      });
      throw error;
    }
  }
);
