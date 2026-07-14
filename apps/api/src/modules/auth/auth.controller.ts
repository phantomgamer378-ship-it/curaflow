import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db";
import { notificationQueue } from "../../config/queue";
import { generateToken, hashToken } from "./crypto";
import { OAuth2Client } from "google-auth-library";

function getGoogleClient() {
  return new OAuth2Client(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/auth/google/callback"
  );
}

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

    const { raw: verifyTokenRaw, hash: verifyTokenHash } = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        profileId: profile.id,
        tokenHash: verifyTokenHash,
        expiresAt,
      }
    });

    // Queue registration notification
    await notificationQueue.add("send-welcome-email", {
      userId: profile.id,
      email: profile.email,
      name: profile.name,
      verifyToken: verifyTokenRaw,
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
      // Invalidate existing active tokens
      await prisma.passwordResetToken.updateMany({
        where: { profileId: profile.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const { raw: resetTokenRaw, hash: resetTokenHash } = generateToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      
      await prisma.passwordResetToken.create({
        data: {
          profileId: profile.id,
          tokenHash: resetTokenHash,
          expiresAt,
          ip: req.ip,
        }
      });

      await notificationQueue.add("password_reset", {
        userId: profile.id,
        email: profile.email,
        resetToken: resetTokenRaw,
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
    const tokenHash = hashToken(token);
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash }
    });

    if (!resetTokenRecord || resetTokenRecord.usedAt || resetTokenRecord.expiresAt < new Date()) {
      return res.status(400).json({ ok: false, error: "Invalid or expired reset token" });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    
    await prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: resetTokenRecord.profileId },
        data: { passwordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: resetTokenRecord.id },
        data: { usedAt: new Date() }
      });
    });

    await notificationQueue.add("password_changed_confirmation", {
      userId: resetTokenRecord.profileId,
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

export async function googleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { next: redirectTo } = req.body;
    
    if (!process.env.GOOGLE_OAUTH_CLIENT_ID) {
      return res.status(500).json({ ok: false, error: "Google OAuth is not configured on the server." });
    }

    const googleClient = getGoogleClient();
    const url = googleClient.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
      state: encodeURIComponent(redirectTo || "/patient"),
      redirect_uri: process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/auth/google/callback"
    });
    
    return res.status(200).json({ ok: true, data: { url } });
  } catch (error) {
    next(error);
  }
}

export async function googleCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const { code, state, error: authError } = req.query;
    const redirectTo = state ? decodeURIComponent(state as string) : '/patient';
    
    if (authError) {
      return res.status(400).send(`Authentication failed: ${authError}`);
    }

    if (!code) {
      return res.status(400).send("No authorization code provided.");
    }

    // Exchange code for tokens
    const googleClient = getGoogleClient();
    const { tokens } = await googleClient.getToken({
      code: code as string,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/auth/google/callback"
    });
    googleClient.setCredentials(tokens);
    
    // Verify ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).send("Invalid Google account data.");
    }

    const email = payload.email;
    const name = payload.name || "Google User";

    let profile = await prisma.profile.findUnique({ where: { email } });
    
    if (!profile) {
      profile = await prisma.$transaction(async (tx) => {
        const newProfile = await tx.profile.create({
          data: {
            email,
            passwordHash: bcrypt.hashSync(crypto.randomUUID(), 10), // Random dummy password
            name,
            role: "patient",
            phone: "",
            emailVerifiedAt: new Date() // Pre-verified via Google
          },
        });

        await tx.patient.create({
          data: { profileId: newProfile.id },
        });

        return newProfile;
      });
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

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3003";
    
    res.cookie("authToken", token, {
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    
    return res.redirect(`${frontendUrl}${redirectTo}`);
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.query.token as string;
    if (!token) return res.status(400).json({ ok: false, error: "Token is required" });

    const tokenHash = hashToken(token);
    const verificationRecord = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash }
    });

    if (!verificationRecord || verificationRecord.usedAt || verificationRecord.expiresAt < new Date()) {
      return res.status(400).json({ ok: false, error: "Invalid or expired verification link" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: verificationRecord.profileId },
        data: { emailVerifiedAt: new Date() }
      });
      await tx.emailVerificationToken.update({
        where: { id: verificationRecord.id },
        data: { usedAt: new Date() }
      });
    });

    return res.json({ ok: true, data: { message: "Email verified successfully" } });
  } catch (error) {
    next(error);
  }
}

export async function resendVerification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) return res.status(404).json({ ok: false, error: "User not found" });
    if (profile.emailVerifiedAt) return res.status(400).json({ ok: false, error: "Email is already verified" });

    // Invalidate existing unused tokens
    await prisma.emailVerificationToken.updateMany({
      where: { profileId: userId, usedAt: null },
      data: { usedAt: new Date() }
    });

    const { raw: verifyTokenRaw, hash: verifyTokenHash } = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        profileId: userId,
        tokenHash: verifyTokenHash,
        expiresAt,
      }
    });

    await notificationQueue.add("send-welcome-email", {
      userId: profile.id,
      email: profile.email,
      name: profile.name,
      verifyToken: verifyTokenRaw,
    });

    return res.json({ ok: true, data: { message: "Verification email sent" } });
  } catch (error) {
    next(error);
  }
}
