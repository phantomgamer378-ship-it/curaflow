import { Queue, Worker, type WorkerOptions } from "bullmq";
import Redis from "ioredis";
import { createLogger } from "@clinic/observability";

const logger = createLogger("queue");

function getRedisInstance(): Redis {
  const url = process.env.UPSTASH_REDIS_URL || "redis://localhost:6379";
  return new Redis(url, {
    maxRetriesPerRequest: null,
  });
}

export function getQueue(name: string) {
  return new Queue(name, { connection: getRedisInstance() as any });
}

export const notificationQueue = { get: () => getQueue("notification-queue") };
export const queueQueue = { get: () => getQueue("queue-queue") };
export const analyticsQueue = { get: () => getQueue("analytics-queue") };
export const aiQueue = { get: () => getQueue("ai-queue") };

export function createWorker<T>(
  queueName: string,
  processor: (job: { name: string; data: T }) => Promise<void>,
  options: Omit<WorkerOptions, "connection"> = {}
) {
  const worker = new Worker(
    queueName,
    async (job) => {
      logger.info(`Processing job ${job.name} in ${queueName}`, { id: job.id ?? null });
      await processor(job);
    },
    { ...options, connection: getRedisInstance() as any }
  );

  worker.on("completed", (job) => {
    logger.info(`Job completed: ${job.name}`, { id: job.id ?? null });
  });

  worker.on("failed", (job, err) => {
    logger.error(`Job failed: ${job?.name ?? "unknown"}`, { id: job?.id ?? null, error: err.message });
  });

  return worker;
}
