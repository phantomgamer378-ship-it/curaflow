import { Router } from "express";
import { getAppointments, getAvailableDoctors, bookAppointment, reschedule, cancel, getNotifications } from "./appointments.controller";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { auditLog } from "../../middleware/audit";
import { createAppointmentInputSchema, rescheduleAppointmentInputSchema } from "@clinic/types";

const router = Router();

router.use(requireAuth);

router.get("/doctors", getAvailableDoctors);
router.get("/", getAppointments);
router.get("/notifications", getNotifications);

router.post(
  "/",
  validate(createAppointmentInputSchema),
  auditLog("CREATE_APPOINTMENT", "Appointment"),
  bookAppointment
);

router.put(
  "/:id/reschedule",
  validate(rescheduleAppointmentInputSchema),
  auditLog("RESCHEDULE_APPOINTMENT", "Appointment"),
  reschedule
);

router.put(
  "/:id/cancel",
  auditLog("CANCEL_APPOINTMENT", "Appointment"),
  cancel
);

export { router as appointmentsRouter };
