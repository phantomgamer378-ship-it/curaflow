import { Router } from "express";
import {
  getPatients,
  getDoctors,
  getAppointmentsAdmin,
  getAnalytics,
  getLiveAnalytics,
  getAuditLogs,
  exportAuditLogs,
  createDoctor,
  updateAvailability,
  addHoliday,
  addLeave,
  adminAddQueueEntry,
  adminEditQueueEntry,
  adminDeleteQueueEntry,
  getClinics,
  updateClinic,
} from "./admin.controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { auditLog } from "../../middleware/audit";
import {
  createDoctorInputSchema,
  doctorAvailabilityInputSchema,
  clinicHolidayInputSchema,
  doctorLeaveInputSchema,
} from "@clinic/types";

const router = Router();

// Apply auth and admin role restrictions to all admin routes
router.use(requireAuth);
router.use(requireRole(["admin"]));

router.get("/patients", getPatients);
router.get("/doctors", getDoctors);
router.get("/appointments", getAppointmentsAdmin);
router.get("/analytics", getAnalytics);
router.get("/analytics/live", getLiveAnalytics);
router.get("/audit-logs", getAuditLogs);
router.get("/audit-logs/export", exportAuditLogs);

router.post(
  "/doctors",
  validate(createDoctorInputSchema),
  auditLog("CREATE_DOCTOR", "Doctor"),
  createDoctor
);

router.put(
  "/doctors/:id/availability",
  validate(doctorAvailabilityInputSchema),
  auditLog("UPDATE_DOCTOR_AVAILABILITY", "DoctorAvailability"),
  updateAvailability
);

router.post(
  "/clinics/:id/holidays",
  validate(clinicHolidayInputSchema),
  auditLog("ADD_CLINIC_HOLIDAY", "ClinicHoliday"),
  addHoliday
);

router.get("/clinics", getClinics);
router.patch(
  "/clinics/:id",
  auditLog("UPDATE_CLINIC", "Clinic"),
  updateClinic
);

router.post(
  "/doctors/:id/leaves",
  validate(doctorLeaveInputSchema),
  auditLog("ADD_DOCTOR_LEAVE", "DoctorLeave"),
  addLeave
);

// Admin Queue Management
router.post(
  "/queue/add",
  auditLog("ADMIN_ADD_TO_QUEUE", "QueueEntry"),
  adminAddQueueEntry
);

router.patch(
  "/queue/:entryId",
  auditLog("ADMIN_EDIT_QUEUE_ENTRY", "QueueEntry"),
  adminEditQueueEntry
);

router.delete(
  "/queue/:entryId",
  auditLog("ADMIN_REMOVE_FROM_QUEUE", "QueueEntry"),
  adminDeleteQueueEntry
);

export { router as adminRouter };
