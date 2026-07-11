import { z } from "zod";

export const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  RESEND_API_KEY: z.string().min(1).optional(),
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_FROM_NUMBER: z.string().min(1).optional(),
  SENTRY_DSN: z.string().url().optional(),
  UPSTASH_REDIS_URL: z.string().url().optional()
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
