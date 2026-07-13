import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { prisma } from "../config/db";

export function auditLog(action: string, resourceType: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (body) {
      res.send = originalSend;
      let parsedBody: any = null;
      try {
        parsedBody = typeof body === "string" ? JSON.parse(body) : body;
      } catch (err) {
        parsedBody = body;
      }

      // Log successful requests (status code 2xx and response ok flag true or undefined)
      if (res.statusCode >= 200 && res.statusCode < 300 && (!parsedBody || parsedBody.ok !== false)) {
        prisma.auditLog.create({
          data: {
            actorId: req.user?.id || null,
            actorRole: req.user?.role || null,
            action,
            resourceType,
            resourceId: req.params.id || parsedBody?.data?.id || null,
            ip: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || null,
            metadata: JSON.stringify({
              body: req.body,
              query: req.query,
            })
          }
        }).catch((err) => {
          console.error("Failed to write audit log:", err);
        });
      }
      return originalSend.call(this, body);
    };

    next();
  };
}
