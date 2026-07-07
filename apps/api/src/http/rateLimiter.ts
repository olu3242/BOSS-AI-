import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./apiError.js";

interface Bucket {
  tokens: number;
  lastRefillAt: number;
}

export interface RateLimiterOptions {
  capacity?: number;
  ratePerMinute?: number;
}

const buckets = new Map<string, Bucket>();

// Prune buckets that are full (idle tenants) every 5 minutes to prevent unbounded growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    const elapsedMs = now - bucket.lastRefillAt;
    if (elapsedMs > 300_000) buckets.delete(key);
  }
}, 300_000).unref();

function computeTokens(bucket: Bucket, now: number, capacity: number, ratePerMinute: number): number {
  const elapsedMs = now - bucket.lastRefillAt;
  const added = (elapsedMs / 60_000) * ratePerMinute;
  return Math.min(capacity, bucket.tokens + added);
}

function extractOrgId(req: Request): string | null {
  const authHeader = req.header("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<string, unknown>;
    const orgId = payload.org_id;
    return typeof orgId === "string" && orgId.length > 0 ? orgId : null;
  } catch {
    return null;
  }
}

/**
 * Per-tenant token bucket rate limiter.
 * Bucket key is org_id from the JWT (decoded without verification — we only
 * need it for bucketing, not for authorization). Falls back to client IP for
 * unauthenticated requests.
 * Default: 100 req/min per tenant.
 */
export function createRateLimiter(options: RateLimiterOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  const capacity = options.capacity ?? 100;
  const ratePerMinute = options.ratePerMinute ?? 100;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = extractOrgId(req) ?? req.ip ?? "unknown";
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { tokens: capacity - 1, lastRefillAt: now };
      buckets.set(key, bucket);
      res.setHeader("X-RateLimit-Limit", String(capacity));
      res.setHeader("X-RateLimit-Remaining", String(Math.max(0, Math.floor(bucket.tokens))));
      res.setHeader("X-RateLimit-Reset", String(Math.ceil((now + 60_000) / 1000)));
      next();
      return;
    }

    const refilled = computeTokens(bucket, now, capacity, ratePerMinute);
    const resetEpoch = Math.ceil((now + ((capacity - refilled) / ratePerMinute) * 60_000) / 1000);

    res.setHeader("X-RateLimit-Limit", String(capacity));
    res.setHeader("X-RateLimit-Reset", String(resetEpoch));

    if (refilled < 1) {
      const retryAfterSec = Math.ceil((1 - refilled) / ratePerMinute * 60);
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("Retry-After", String(retryAfterSec));
      bucket.tokens = refilled;
      bucket.lastRefillAt = now;
      next(new ApiError(429, "rate_limited", `Rate limit exceeded — retry after ${retryAfterSec}s`));
      return;
    }

    bucket.tokens = refilled - 1;
    bucket.lastRefillAt = now;
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, Math.floor(bucket.tokens))));
    next();
  };
}

export { buckets as _bucketsForTesting };
