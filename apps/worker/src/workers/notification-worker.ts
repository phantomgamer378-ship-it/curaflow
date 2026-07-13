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

      let emailSubject = "Notification from Clinic";
      let emailBody = "You have a new notification.";
      let smsBody = "You have a new notification.";

      let doctorName = "your doctor";
      let clinicName = "our clinic";
      let slotTimeStr = "";
      
      const appt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { doctor: { include: { profile: true, clinic: true } } }
      });

      if (appt && appt.doctor) {
        doctorName = appt.doctor.profile.name;
        clinicName = appt.doctor.clinic.name;
        slotTimeStr = new Date(appt.slotTime).toLocaleString();
      }

      if (job.name === "appointment_created" || job.name === "send-booking-confirmation") {
        emailSubject = `Appointment confirmed — Token #${tokenNo ?? appt?.tokenNo} with Dr. ${doctorName}`;
        emailBody = `Your appointment is confirmed for ${slotTimeStr} at ${clinicName}. If it's for today, your token is #${tokenNo ?? appt?.tokenNo}. You can manage this from your dashboard.`;
        smsBody = `Appointment confirmed with Dr. ${doctorName} at ${clinicName}. Token #${tokenNo ?? appt?.tokenNo}.`;
      } else if (job.name === "24h_reminder") {
        emailSubject = `Reminder: your appointment tomorrow with Dr. ${doctorName}`;
        emailBody = `Just a reminder that you have an appointment scheduled tomorrow at ${slotTimeStr} at ${clinicName}.`;
        smsBody = `Reminder: Appointment with Dr. ${doctorName} tomorrow at ${slotTimeStr}.`;
      } else if (job.name === "getting_close") {
        const ahead = data.patientsAhead || 0;
        emailSubject = `You're almost up — ${ahead} patients ahead of you`;
        emailBody = `There are only ${ahead} patients ahead of you for Dr. ${doctorName}. Please head to the clinic now if you haven't already. Check your dashboard for the live queue.`;
        smsBody = `You're almost up! Only ${ahead} patients ahead of you for Dr. ${doctorName}. Head to the clinic now.`;
      } else if (job.name === "you_are_next") {
        emailSubject = `You're next — please be ready`;
        emailBody = `You're next in line for Dr. ${doctorName}. Please make your way to the waiting area.`;
        smsBody = `You're next! Please proceed to the waiting area for Dr. ${doctorName}.`;
      } else if (job.name === "being_called") {
        emailSubject = `It's your turn — please proceed to Dr. ${doctorName}'s room`;
        emailBody = `It's your turn. Dr. ${doctorName} is ready to see you now. Please proceed to the consultation room.`;
        smsBody = `It's your turn! Dr. ${doctorName} is ready for you now.`;
      }

      // Create email notification
      const emailNotification = await prisma.notification.create({
        data: {
          userId: targetUserId,
          channel: "email",
          status: "pending",
          payload: JSON.stringify({
            jobName: job.name,
            subject: emailSubject,
            body: emailBody,
          })
        }
      });
      notificationId = emailNotification.id;

      // Create SMS notification (immediately) if it's an urgent trigger
      if (["getting_close", "you_are_next", "being_called", "appointment_created", "24h_reminder"].includes(job.name)) {
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            channel: "sms",
            status: "pending",
            payload: JSON.stringify({
              jobName: job.name,
              body: smsBody,
            })
          }
        });
      }
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
