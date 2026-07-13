import { Router } from "express";
import { signup, login, logout, forgotPassword, resetPassword, updateProfile, getProfile, changePassword } from "./auth.controller";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { signupInputSchema, loginInputSchema, forgotPasswordInputSchema, resetPasswordInputSchema } from "@clinic/types";

const router = Router();

router.post("/signup", validate(signupInputSchema), signup);
router.post("/login", validate(loginInputSchema), login);
router.post("/logout", logout);
router.post("/forgot-password", validate(forgotPasswordInputSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordInputSchema), resetPassword);

router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.post("/change-password", requireAuth, changePassword);

export { router as authRouter };
