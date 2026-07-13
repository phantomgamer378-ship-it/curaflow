// Load environment variables FIRST before anything else
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Try multiple .env locations for reliability
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "../../.env") });

import { createLogger } from "@clinic/observability";

const logger = createLogger("worker-main");

// Debug: verify env loaded
if (!process.env.DATABASE_URL) {
  logger.error("DATABASE_URL not found in env! Check .env file location.");
}
if (!process.env.UPSTASH_REDIS_URL) {
  logger.error("UPSTASH_REDIS_URL not found in env! Check .env file location.");
}

async function main() {
  logger.info("Starting background workers...");
  logger.info(`Redis URL: ${process.env.UPSTASH_REDIS_URL ? "configured" : "MISSING"}`);
  logger.info(`Database URL: ${process.env.DATABASE_URL ? "configured" : "MISSING"}`);

  // Lazy import so env vars are available when these modules initialize
  const { notificationWorker } = await import("./workers/notification-worker");
  const { aiWorker } = await import("./workers/ai-worker");
  const { queueWorker } = await import("./workers/queue-worker");

  const { queueQueue } = await import("./lib/queue-setup");
  const qQueue = queueQueue.get();

  // Register the 24h reminder cron job (runs every hour)
  await qQueue.add(
    "send-24h-reminders",
    {},
    {
      repeat: { pattern: "0 * * * *" },
      jobId: "send-24h-reminders-job"
    }
  );

  logger.info("All workers started successfully.");

  process.on("SIGINT", async () => {
    logger.info("Shutting down workers...");
    await notificationWorker.close();
    await aiWorker.close();
    await queueWorker.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    logger.info("Shutting down workers...");
    await notificationWorker.close();
    await aiWorker.close();
    await queueWorker.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Failed to start workers:", err);
  process.exit(1);
});
