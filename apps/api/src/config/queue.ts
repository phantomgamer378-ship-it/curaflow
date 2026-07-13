import { Queue } from "bullmq";
import Redis from "ioredis";

let notificationQueueInstance: Queue | null = null;
let queueQueueInstance: Queue | null = null;
let analyticsQueueInstance: Queue | null = null;
let aiQueueInstance: Queue | null = null;

function getRedisInstance(): Redis {
  const url = process.env.UPSTASH_REDIS_URL || "redis://localhost:6379";
  console.log("[BullMQ Queue Config] Initializing Queue Redis client with URL:", url.includes("@") ? url.split("@")[1] : url);
  return new Redis(url, {
    maxRetriesPerRequest: null,
  });
}

function getNotificationQueue() {
  if (!notificationQueueInstance) {
    notificationQueueInstance = new Queue("notification-queue", { connection: getRedisInstance() as any });
  }
  return notificationQueueInstance;
}

function getQueueQueue() {
  if (!queueQueueInstance) {
    queueQueueInstance = new Queue("queue-queue", { connection: getRedisInstance() as any });
  }
  return queueQueueInstance;
}

function getAnalyticsQueue() {
  if (!analyticsQueueInstance) {
    analyticsQueueInstance = new Queue("analytics-queue", { connection: getRedisInstance() as any });
  }
  return analyticsQueueInstance;
}

function getAiQueue() {
  if (!aiQueueInstance) {
    aiQueueInstance = new Queue("ai-queue", { connection: getRedisInstance() as any });
  }
  return aiQueueInstance;
}

export const notificationQueue = {
  add: (name: string, data: any, opts?: any) => getNotificationQueue().add(name, data, opts)
};
export const queueQueue = {
  add: (name: string, data: any, opts?: any) => getQueueQueue().add(name, data, opts)
};
export const analyticsQueue = {
  add: (name: string, data: any, opts?: any) => getAnalyticsQueue().add(name, data, opts)
};
export const aiQueue = {
  add: (name: string, data: any, opts?: any) => getAiQueue().add(name, data, opts)
};
