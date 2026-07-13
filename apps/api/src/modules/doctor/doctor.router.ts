import { Router } from "express";
import { getTodayAppointments, getDoctorProfile, goOnline, pauseQueue, goOffline, updateDoctorProfile } from "./doctor.controller";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);
router.use(requireRole(["doctor"]));

router.get("/today", getTodayAppointments);
router.get("/profile", getDoctorProfile);
router.patch("/profile", updateDoctorProfile);
router.post("/status/online", goOnline);
router.post("/status/pause", pauseQueue);
router.post("/status/offline", goOffline);

export { router as doctorRouter };
