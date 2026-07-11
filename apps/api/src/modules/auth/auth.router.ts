import { Router } from "express";
import { signup, login, logout, forgotPassword, resetPassword } from "./auth.controller";
import { validate } from "../../middleware/validate";
import { signupInputSchema, loginInputSchema, forgotPasswordInputSchema, resetPasswordInputSchema } from "@clinic/types";

const router = Router();

router.post("/signup", validate(signupInputSchema), signup);
router.post("/login", validate(loginInputSchema), login);
router.post("/logout", logout);
router.post("/forgot-password", validate(forgotPasswordInputSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordInputSchema), resetPassword);

export { router as authRouter };
