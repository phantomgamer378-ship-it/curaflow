import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db";
import { notificationQueue } from "../../config/queue";

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name, role = "patient", phone } = req.body;

    const existing = await prisma.profile.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ ok: false, error: "Email is already registered" });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    // Create profile and nested patient/doctor in a transaction
    const profile = await prisma.$transaction(async (tx) => {
      const newProfile = await tx.profile.create({
        data: {
          email,
          passwordHash,
          name,
          role,
          phone,
        },
      });

      if (role === "doctor") {
        let clinic = await tx.clinic.findFirst();
        if (!clinic) {
          clinic = await tx.clinic.create({
            data: { name: "Main Clinic", openTime: "09:00", closeTime: "17:00" },
          });
        }
        await tx.doctor.create({
          data: { profileId: newProfile.id, clinicId: clinic.id, specialty: "General" },
        });
      } else {
        await tx.patient.create({
          data: {
            profileId: newProfile.id,
          },
        });
      }

      return newProfile;
    });

    // Queue registration notification
    await notificationQueue.add("send-welcome-email", {
      userId: profile.id,
      email: profile.email,
      name: profile.name,
    });

    let redirectTo = "/patient";
    if (profile.role === "doctor") {
      redirectTo = "/doctor";
    } else if (profile.role === "admin") {
      redirectTo = "/admin";
    }

    const secret = process.env.JWT_SECRET || "fallback_default_jwt_secret_key_change_me_in_prod";
    const token = jwt.sign(
      {
        sub: profile.id,
        email: profile.email,
        role: profile.role,
        name: profile.name,
      },
      secret,
      { expiresIn: "7d" }
    );

    // Create secure HTTP-only refresh cookie
    const refreshToken = jwt.sign({ sub: profile.id }, secret, { expiresIn: "7d" });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({
      ok: true,
      data: {
        token,
        userId: profile.id,
        role: profile.role,
        redirectTo,
        confirmationRequired: false,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const profile = await prisma.profile.findUnique({
      where: { email, deletedAt: null },
    });

    if (!profile || !bcrypt.compareSync(password, profile.passwordHash)) {
      return res.status(401).json({ ok: false, error: "Invalid email or password" });
    }

    const secret = process.env.JWT_SECRET || "fallback_default_jwt_secret_key_change_me_in_prod";
    const token = jwt.sign(
      {
        sub: profile.id,
        email: profile.email,
        role: profile.role,
        name: profile.name,
      },
      secret,
      { expiresIn: "7d" }
    );

    // Create secure HTTP-only refresh cookie
    const refreshToken = jwt.sign({ sub: profile.id }, secret, { expiresIn: "7d" });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Check role routing
    let redirectTo = "/patient";
    if (profile.role === "doctor") {
      redirectTo = "/doctor";
    } else if (profile.role === "admin") {
      redirectTo = "/admin";
    }

    return res.json({
      ok: true,
      data: {
        token,
        userId: profile.id,
        role: profile.role,
        redirectTo,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie("refresh_token");
    return res.json({ ok: true, data: { message: "Successfully logged out" } });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    const profile = await prisma.profile.findUnique({ where: { email } });

    if (profile) {
      // In a full implementation we would generate a reset token and write it to Redis or DB
      const resetToken = jwt.sign(
        { sub: profile.id, action: "password_reset" },
        process.env.JWT_SECRET || "fallback_default_jwt_secret_key_change_me_in_prod",
        { expiresIn: "1h" }
      );

      await notificationQueue.add("send-password-reset", {
        userId: profile.id,
        email: profile.email,
        resetToken,
      });
    }

    return res.json({
      ok: true,
      data: { message: "If that email exists, we have sent a reset password link" },
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    const secret = process.env.JWT_SECRET || "fallback_default_jwt_secret_key_change_me_in_prod";

    let payload: any;
    try {
      payload = jwt.verify(token, secret);
    } catch (err) {
      return res.status(400).json({ ok: false, error: "Invalid or expired reset token" });
    }

    if (payload.action !== "password_reset") {
      return res.status(400).json({ ok: false, error: "Invalid token usage" });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    await prisma.profile.update({
      where: { id: payload.sub },
      data: { passwordHash },
    });

    return res.json({
      ok: true,
      data: { message: "Password has been successfully updated" },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { name, phone } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: userId },
      data: {
        name,
        phone
      }
    });

    return res.json({
      ok: true,
      data: {
        id: updatedProfile.id,
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        role: updatedProfile.role
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        patient: true,
        doctor: true
      }
    });
    
    if (!profile) {
      return res.status(404).json({ ok: false, error: "Profile not found" });
    }
    
    return res.json({ ok: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    if (!bcrypt.compareSync(currentPassword, profile.passwordHash)) {
      return res.status(400).json({ ok: false, error: "Current password is incorrect" });
    }

    const newPasswordHash = bcrypt.hashSync(newPassword, 10);
    await prisma.profile.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    return res.json({ ok: true, message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
}
