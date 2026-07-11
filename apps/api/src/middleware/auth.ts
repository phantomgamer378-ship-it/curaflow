import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@clinic/db";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Unauthenticated: Missing authorization token" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ ok: false, error: "Unauthenticated: Missing token content" });
  }

  try {
    const secret = process.env.JWT_SECRET || "fallback_default_jwt_secret_key_change_me_in_prod";
    const payload = jwt.verify(token, secret) as any;
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
    };
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Unauthenticated: Invalid or expired token" });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Unauthenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: "Forbidden: Insufficient privileges" });
    }

    next();
  };
}
