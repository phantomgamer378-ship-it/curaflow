import { Router } from "express";
import { 
  getQueueStatus, 
  startConsult, 
  completeConsult, 
  markConsultNoShow, 
  startSession, 
  patientJoinQueue 
} from "./queue.controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { auditLog } from "../../middleware/audit";

const router = Router();

// Public route to get queue status
router.get("/:clinicId/current", getQueueStatus);

// Session management
router.post("/start-session", requireAuth, startSession);
router.post("/join", requireAuth, patientJoinQueue);

// Doctor routes
router.post(
  "/:id/start",
  requireAuth,
  requireRole(["doctor"]),
  auditLog("START_CONSULTATION", "Appointment"),
  startConsult
);

router.post(
  "/:id/complete",
  requireAuth,
  requireRole(["doctor"]),
  auditLog("COMPLETE_CONSULTATION", "Appointment"),
  completeConsult
);

router.post(
  "/:id/no-show",
  requireAuth,
  requireRole(["doctor"]),
  auditLog("NO_SHOW_MARKED", "Appointment"),
  markConsultNoShow
);

export { router as queueRouter };
