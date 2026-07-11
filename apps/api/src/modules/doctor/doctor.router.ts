import { Router } from "express";
import { getTodayAppointments, getDoctorProfile } from "./doctor.controller";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);
router.use(requireRole(["doctor"]));

router.get("/today", getTodayAppointments);
router.get("/profile", getDoctorProfile);

export { router as doctorRouter };
