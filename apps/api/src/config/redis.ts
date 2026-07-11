import Redis from "ioredis";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_URL || "redis://localhost:6379";
    redisClient = new Redis(url, {
      maxRetriesPerRequest: null,
    });
  }
  return redisClient;
}
