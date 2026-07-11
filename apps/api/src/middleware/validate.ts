import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate schema against body
      const parsedBody = await schema.parseAsync(req.body);

      // Keep validated values on the request object for type-safe route usage
      req.body = parsedBody;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          ok: false,
          error: "Validation failed",
          details: error.errors,
        });
      }
      return res.status(500).json({ ok: false, error: "Internal validation error" });
    }
  };
};
