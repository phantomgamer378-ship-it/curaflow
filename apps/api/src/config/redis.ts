import Redis from "ioredis";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_URL || "redis://localhost:6379";
    console.log("[Redis Config] Initializing client with URL:", url.includes("@") ? url.split("@")[1] : url);
    redisClient = new Redis(url, {
      maxRetriesPerRequest: null,
    });
    redisClient.on("connect", () => {
      console.log("[Redis] Client connected successfully.");
    });
    redisClient.on("error", (err) => {
      console.error("[Redis] Client error:", err.message);
    });
  }
  return redisClient;
}
