export type NotificationChannel = "email" | "sms" | "whatsapp";

export interface NotificationProvider {
  send(to: string, payload: Record<string, unknown>): Promise<{ providerId: string }>;
}
