import { Router } from "express";
import { updatePatientProfile } from "./patient.controller";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);
router.use(requireRole(["patient"]));

router.patch("/profile", updatePatientProfile);

export { router as patientRouter };
