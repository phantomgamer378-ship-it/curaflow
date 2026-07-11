/**
 * Notification integration hooks.
 * Agent drafts messages; actual sending is done by the notification service.
 */

export type NotificationChannel = "email" | "sms" | "whatsapp";
export type NotificationTone = "formal" | "friendly" | "urgent";

export interface DraftNotificationInput {
  type: "booking_confirmation" | "reminder" | "delay" | "reschedule" | "cancellation";
  patient_name: string;
  doctor_name: string;
  clinic_name: string;
  appointment_date: string;
  appointment_time: string;
  token_no?: number;
  channel: NotificationChannel;
  tone: NotificationTone;
  additional_context?: string;
}

export interface DraftedNotification {
  channel: NotificationChannel;
  subject?: string;
  body: string;
  is_ai_draft: true;
}

/**
 * Generate a notification template. This is a deterministic template engine,
 * NOT an LLM call. For AI-personalized messages, use the Reminder Agent.
 */
export function draftNotificationTemplate(input: DraftNotificationInput): DraftedNotification {
  const { type, patient_name, doctor_name, clinic_name, appointment_date, appointment_time, token_no, channel, tone } = input;

  const greeting = tone === "formal"
    ? `Dear ${patient_name},`
    : tone === "urgent"
      ? `Hi ${patient_name} — important update:`
      : `Hey ${patient_name}! 👋`;

  let body = "";
  let subject = "";

  switch (type) {
    case "booking_confirmation":
      subject = `Appointment Confirmed — ${clinic_name}`;
      body = `${greeting}\n\nYour appointment with Dr. ${doctor_name} is confirmed.\n📅 Date: ${appointment_date}\n🕐 Time: ${appointment_time}${token_no ? `\n🎫 Token: T-${token_no}` : ""}\n\nPlease arrive 10 minutes early.`;
      break;
    case "reminder":
      subject = `Appointment Reminder — ${clinic_name}`;
      body = `${greeting}\n\nThis is a reminder for your upcoming appointment with Dr. ${doctor_name}.\n📅 ${appointment_date} at ${appointment_time}${token_no ? `\n🎫 Token: T-${token_no}` : ""}\n\nSee you soon!`;
      break;
    case "delay":
      subject = `Delay Notice — ${clinic_name}`;
      body = `${greeting}\n\nWe're experiencing some delays at ${clinic_name}. Dr. ${doctor_name}'s schedule is running behind.\n\nWe apologize for the inconvenience and will update you shortly.`;
      break;
    case "reschedule":
      subject = `Appointment Rescheduled — ${clinic_name}`;
      body = `${greeting}\n\nYour appointment with Dr. ${doctor_name} has been rescheduled.\n📅 New date: ${appointment_date}\n🕐 New time: ${appointment_time}\n\nPlease contact us if this doesn't work for you.`;
      break;
    case "cancellation":
      subject = `Appointment Cancelled — ${clinic_name}`;
      body = `${greeting}\n\nYour appointment with Dr. ${doctor_name} on ${appointment_date} has been cancelled.\n\nPlease book a new appointment when you're ready.`;
      break;
  }

  // Adapt for channel
  if (channel === "sms" || channel === "whatsapp") {
    // Strip subject for SMS/WhatsApp, keep body concise
    return { channel, body: body.replace(/\n\n/g, "\n"), is_ai_draft: true };
  }

  return { channel, subject, body, is_ai_draft: true };
}
