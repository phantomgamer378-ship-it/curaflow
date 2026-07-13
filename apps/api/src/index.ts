import dotenv from "dotenv";
import path from "path";

// Load environment variables before importing other local files
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import { initSockets } from "./config/socket";
import { errorHandler } from "./middleware/error";
import { createLogger } from "@clinic/observability";

// We will import routers next
import { authRouter } from "./modules/auth/auth.router";
import { patientRouter } from "./modules/patient/patient.router";
import { queueRouter } from "./modules/queue/queue.router";
import { appointmentsRouter } from "./modules/appointments/appointments.router";
import { adminRouter } from "./modules/admin/admin.router";
import { doctorRouter } from "./modules/doctor/doctor.router";
import { doctorsPublicRouter } from "./modules/doctor/doctors.public.router";
import { aiRouter } from "./modules/ai/ai.router";
import { authRateLimiter, apiRateLimiter } from "./middleware/rate-limit";

const logger = createLogger("express-api");
const app = express();
const httpServer = createServer(app);

// Security configuration
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Health check (no auth, no rate limit)
app.get("/api/health", (_req, res) => res.json({ ok: true, status: "healthy", ts: new Date().toISOString() }));

// Register API Routes with rate limiting
app.use("/api/auth", authRateLimiter, authRouter);
app.use("/api/patient", apiRateLimiter, patientRouter);
app.use("/api/queue", queueRouter);
app.use("/api/appointments", apiRateLimiter, appointmentsRouter);
app.use("/api/admin", apiRateLimiter, adminRouter);
app.use("/api/doctor", apiRateLimiter, doctorRouter);
app.use("/api/doctors", apiRateLimiter, doctorsPublicRouter);
app.use("/api/ai", apiRateLimiter, aiRouter);

// Global Error Handler Middleware
app.use(errorHandler);

// Initialize Sockets
initSockets(httpServer);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  logger.info(`Express API Server running on port ${PORT}`);
});
