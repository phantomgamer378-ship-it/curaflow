import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      autoConnect: false, // Wait until we explicitly connect
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};
