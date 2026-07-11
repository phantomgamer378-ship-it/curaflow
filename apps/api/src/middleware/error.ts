import { Request, Response, NextFunction } from "express";
import { createLogger } from "@clinic/observability";

const logger = createLogger("error-handler");

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error("Unhandled API Error", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  return res.status(statusCode).json({
    ok: false,
    error: message,
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}
