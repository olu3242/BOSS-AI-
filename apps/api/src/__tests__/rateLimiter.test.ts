import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { createRateLimiter, _bucketsForTesting } from "../http/rateLimiter.js";

function makeReq(orgId?: string, ip = "127.0.0.1"): Request {
  const token = orgId
    ? `header.${Buffer.from(JSON.stringify({ org_id: orgId })).toString("base64url")}.sig`
    : undefined;
  return {
    header: (name: string) =>
      name.toLowerCase() === "authorization" && token ? `Bearer ${token}` : undefined,
    ip,
  } as unknown as Request;
}

function makeRes(): { headers: Record<string, string>; res: Response } {
  const headers: Record<string, string> = {};
  const res = {
    setHeader: (name: string, value: string) => { headers[name] = value; },
  } as unknown as Response;
  return { headers, res };
}

describe("createRateLimiter", () => {
  beforeEach(() => {
    _bucketsForTesting.clear();
  });

  it("allows requests within capacity and sets headers", () => {
    const limiter = createRateLimiter({ capacity: 5, ratePerMinute: 5 });
    const req = makeReq("org-1");
    const { headers, res } = makeRes();
    const next = vi.fn();

    limiter(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
    expect(headers["X-RateLimit-Limit"]).toBe("5");
    expect(headers["X-RateLimit-Remaining"]).toBe("4");
    expect(headers["X-RateLimit-Reset"]).toBeDefined();
  });

  it("returns 429 when capacity is exhausted", () => {
    const limiter = createRateLimiter({ capacity: 3, ratePerMinute: 3 });
    const req = makeReq("org-throttle");
    const next = vi.fn();

    for (let i = 0; i < 3; i++) {
      const { res } = makeRes();
      limiter(req, res, next);
    }

    const { headers, res } = makeRes();
    limiter(req, res, next);

    expect(next).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 429, code: "rate_limited" })
    );
    expect(headers["X-RateLimit-Remaining"]).toBe("0");
    expect(headers["Retry-After"]).toBeDefined();
  });

  it("buckets are isolated per org_id", () => {
    const limiter = createRateLimiter({ capacity: 2, ratePerMinute: 2 });
    const nextA = vi.fn();
    const nextB = vi.fn();

    for (let i = 0; i < 2; i++) {
      limiter(makeReq("org-a"), makeRes().res, nextA);
    }
    // org-a is now at 0 tokens; org-b should still be allowed
    limiter(makeReq("org-b"), makeRes().res, nextB);

    expect(nextA).toHaveBeenCalledTimes(2);
    expect(nextB).toHaveBeenCalledOnce();
    expect(nextB).toHaveBeenCalledWith();
  });

  it("falls back to IP when no org_id in token", () => {
    const limiter = createRateLimiter({ capacity: 2, ratePerMinute: 2 });
    const next = vi.fn();
    const req = makeReq(undefined, "10.0.0.1");

    limiter(req, makeRes().res, next);
    limiter(req, makeRes().res, next);
    limiter(req, makeRes().res, next);

    expect(next).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 429 })
    );
  });

  it("tokens refill over time", async () => {
    const limiter = createRateLimiter({ capacity: 2, ratePerMinute: 120 });
    const req = makeReq("org-refill");
    const next = vi.fn();

    limiter(req, makeRes().res, next);
    limiter(req, makeRes().res, next);
    // exhausted

    const bucket = _bucketsForTesting.get("org-refill")!;
    // Simulate 1 second passing (120 req/min = 2 req/sec → should gain 2 tokens)
    bucket.lastRefillAt = Date.now() - 1000;

    limiter(req, makeRes().res, next);
    expect(next).toHaveBeenLastCalledWith();
  });
});
