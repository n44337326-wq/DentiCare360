import { RateLimitError } from "@/lib/errors";

/**
 * Fixed-window in-memory rate limiter. Good for a single server instance; a
 * horizontally scaled deployment should back this with Redis (same interface).
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const globalForLimiter = globalThis as unknown as { __denticareBuckets?: Map<string, Bucket> };
const buckets = (globalForLimiter.__denticareBuckets ??= new Map());

export interface RateLimitOptions {
  /** Namespace, e.g. "ai-chat". Keeps limits for different endpoints independent. */
  scope: string;
  /** Who is being limited: user id, IP, email … */
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit({ scope, key, limit, windowMs }: RateLimitOptions, now = Date.now()): RateLimitResult {
  const id = `${scope}:${key}`;
  const bucket = buckets.get(id);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    sweep(now);
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

/** Throws RateLimitError (HTTP 429) when the limit is exceeded. */
export function enforceRateLimit(options: RateLimitOptions) {
  const result = checkRateLimit(options);
  if (!result.ok) throw new RateLimitError(result.retryAfterSeconds);
  return result;
}

export function resetRateLimits() {
  buckets.clear();
}

let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [id, b] of buckets) if (b.resetAt <= now) buckets.delete(id);
}
