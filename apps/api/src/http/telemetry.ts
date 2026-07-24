import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { ObservabilityService } from "../services/observabilityService.js";

export function requestTracing(obs: ObservabilityService) {
  return (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers["x-trace-id"] as string | undefined) ?? randomUUID();
    // Store on res.locals so downstream middleware and handlers can read it.
    res.locals["traceId"] = traceId;
    const startedAt = Date.now();
    res.setHeader("x-trace-id", traceId);

    res.on("finish", () => {
      const latencyMs = Date.now() - startedAt;
      const isError = res.statusCode >= 500;
      obs.recordRequest(latencyMs, isError);
      if (process.env.NODE_ENV !== "test") {
        process.stdout.write(
          JSON.stringify({
            level: isError ? "error" : "info",
            time: new Date().toISOString(),
            traceId,
            service: "boss-api",
            event: "http_request",
            method: req.method,
            path: req.path,
            status: res.statusCode,
            latencyMs,
          }) + "\n",
        );
      }
    });

    next();
  };
}
