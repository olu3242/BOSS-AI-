import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { ObservabilityService } from "../services/observabilityService.js";

export function requestTracing(obs: ObservabilityService) {
  return (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers["x-trace-id"] as string | undefined) ?? randomUUID();
    const startedAt = Date.now();
    res.setHeader("x-trace-id", traceId);

    res.on("finish", () => {
      const latencyMs = Date.now() - startedAt;
      const isError = res.statusCode >= 500;
      obs.recordRequest(latencyMs, isError);
    });

    next();
  };
}
