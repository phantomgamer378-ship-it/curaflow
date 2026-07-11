import { Queue, type ConnectionOptions } from "bullmq";

function getConnection(): ConnectionOptions {
  const url = process.env.UPSTASH_REDIS_URL || "redis://localhost:6379";
  const connection: ConnectionOptions = {
    url,
    maxRetriesPerRequest: null,
  };

  if (url.startsWith("rediss://")) {
    return {
      ...connection,
      tls: {},
    };
  }

  return connection;
}

export const notificationQueue = new Queue("notification-queue", { connection: getConnection() });
export const queueQueue = new Queue("queue-queue", { connection: getConnection() });
export const analyticsQueue = new Queue("analytics-queue", { connection: getConnection() });
export const aiQueue = new Queue("ai-queue", { connection: getConnection() });
