import { NextResponse } from "next/server";
import { z, type ZodType } from "zod";
import { AppError, RateLimitError, ValidationError } from "@/lib/errors";

/** Best-effort client IP (behind a trusted proxy this is the first X-Forwarded-For hop). */
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/** Parses and validates a JSON body. Throws ValidationError (400) on malformed or invalid input. */
export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const raw = await req.json().catch(() => {
    throw new ValidationError("Request body must be valid JSON.");
  });
  return parseWith(schema, raw);
}

export function parseWith<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationError("Some details are invalid.", z.flattenError(result.error).fieldErrors);
  }
  return result.data;
}

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof RateLimitError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: 429, headers: { "Retry-After": String(err.retryAfterSeconds) } }
    );
  }
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message, code: err.code, details: err.details }, { status: err.status });
  }
  console.error("[api] unexpected error", err);
  return NextResponse.json({ error: "Something went wrong. Please try again.", code: "INTERNAL" }, { status: 500 });
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route handler so thrown AppErrors become consistent JSON error responses. */
export function apiHandler<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export const json = <T>(data: T, init?: number | ResponseInit) =>
  NextResponse.json(data, typeof init === "number" ? { status: init } : init);
