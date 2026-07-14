import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { getRedisClient } from "./redis";
import { createLogger } from "@clinic/observability";

const logger = createLogger("sockets");
let io: Server;

export function initSockets(server: HttpServer) {
  const url = process.env.UPSTASH_REDIS_URL || "redis://localhost:6379";
  const pubClient = getRedisClient();
  const subClient = new Redis(url, { maxRetriesPerRequest: null });

  // Custom subscription for cross-process queue updates
  const broadcastSubClient = new Redis(url, { maxRetriesPerRequest: null });
  broadcastSubClient.subscribe("queue_broadcast").catch(err => {
    logger.error("Failed to subscribe to queue_broadcast channel:", err);
  });
  broadcastSubClient.on("message", async (channel, message) => {
    if (channel === "queue_broadcast") {
      try {
        const payload = JSON.parse(message);
        if (payload.type === "admin_stats") {
          const { clinicId } = payload;
          const { computeLiveAdminStats } = await import("@clinic/admin"); // We need to export it or just call the API controller.
          // Wait, importing the controller from here creates a circular dependency or it's cleaner to just fetch it or pass it.
          // Actually, since this is for cross-process, we can just pass the stats in the message to avoid re-computing!
          const { clinicId: cId, stats } = payload;
          getIO().to(`clinic:${cId}`).emit("admin_stats_updated", stats);
        } else {
          const { clinicId } = payload;
          const { getLiveQueueSnapshot } = await import("@clinic/queue");
          const snapshot = await getLiveQueueSnapshot(clinicId);
          broadcastQueueUpdate(clinicId, snapshot);
        }
      } catch (err: any) {
        logger.error("Failed to broadcast from sub client:", err);
      }
    }
  });

  io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Allow kiosk screen or client to join a specific clinic room
    socket.on("join_clinic", (clinicId: string) => {
      socket.join(`clinic:${clinicId}`);
      logger.info(`Socket ${socket.id} joined room clinic:${clinicId}`);
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
}

import { PublicQueueSnapshot } from "@clinic/types";

export function broadcastQueueUpdate(clinicId: string, data: PublicQueueSnapshot) {
  try {
    getIO().to(`clinic:${clinicId}`).emit("queue_updated", data);
    logger.info(`Broadcasted queue update for clinic ${clinicId}`);
  } catch (error: any) {
    logger.error("Failed to broadcast queue update:", { error: error.message });
  }
}

export function broadcastAdminStatsUpdate(clinicId: string, stats: any) {
  try {
    getIO().to(`clinic:${clinicId}`).emit("admin_stats_updated", stats);
    // Also publish to redis so other workers broadcast it
    const pubClient = getRedisClient();
    pubClient.publish("queue_broadcast", JSON.stringify({ type: "admin_stats", clinicId, stats })).catch(() => {});
    logger.info(`Broadcasted admin stats update for clinic ${clinicId}`);
  } catch (error: any) {
    logger.error("Failed to broadcast admin stats update:", { error: error.message });
  }
}
