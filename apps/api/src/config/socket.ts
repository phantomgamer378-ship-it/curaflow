import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { getRedisClient } from "./redis";
import { createLogger } from "@clinic/observability";

const logger = createLogger("sockets");
let io: Server;

export function initSockets(server: HttpServer) {
  const pubClient = getRedisClient();
  const subClient = pubClient.duplicate();

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

export function broadcastQueueUpdate(clinicId: string, data: { current_token: number; waiting_count: number }) {
  try {
    getIO().to(`clinic:${clinicId}`).emit("queue_updated", data);
    logger.info(`Broadcasted queue update for clinic ${clinicId}`, data);
  } catch (error: any) {
    logger.error("Failed to broadcast queue update:", { error: error.message });
  }
}
