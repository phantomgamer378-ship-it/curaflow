import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  patientAssistant,
  queueAssistant,
  doctorNoteAssistant,
  adminInsightsAssistant,
  reminderPreview,
} from "./ai.controller";

export const aiRouter = Router();

// All AI routes require authentication
aiRouter.use(requireAuth);

// Patient AI assistant — booking helper
aiRouter.post("/assistant/patient", requireRole(["patient"]), patientAssistant);

// Queue intelligence — available to all roles
aiRouter.post("/assistant/queue", queueAssistant);

// Doctor note drafting — doctors only
aiRouter.post("/assistant/doctor-note", requireRole(["doctor"]), doctorNoteAssistant);

// Admin insights — admins only
aiRouter.post("/assistant/admin-insights", requireRole(["admin"]), adminInsightsAssistant);

// Reminder preview — admins only
aiRouter.post("/assistant/reminder-preview", requireRole(["admin"]), reminderPreview);
