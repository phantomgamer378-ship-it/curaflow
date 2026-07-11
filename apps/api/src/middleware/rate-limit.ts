import { Request, Response, NextFunction } from "express";

const windowMs = 15 * 60 * 1000; // 15 minutes
const maxRequests = 100;

// Simple in-memory store for rate limiting (use Redis for multi-instance production)
const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(limit: number = maxRequests) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== "production") {
      return next();
    }
    const key = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    const entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      return res.status(429).json({
        ok: false,
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }

    entry.count++;
    return next();
  };
}

/** Strict limiter for auth endpoints — 10 req/15min */
export const authRateLimiter = rateLimiter(10);

/** Standard limiter for general API routes — 100 req/15min */
export const apiRateLimiter = rateLimiter(100);
