import { NextResponse } from "next/server";
import type { z } from "zod";

export function jsonWithSchema<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  payload: z.input<TSchema>,
  init?: ResponseInit
) {
  return NextResponse.json(schema.parse(payload), init);
}

export function apiError(error: string, status: number, details?: unknown) {
  return NextResponse.json(
    details === undefined ? { ok: false, error } : { ok: false, error, details },
    { status }
  );
}
