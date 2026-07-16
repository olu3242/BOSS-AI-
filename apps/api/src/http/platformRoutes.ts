import { randomUUID } from "node:crypto";
import express, { type Request, type Response, type Router } from "express";
import {
  createPlatformAdministrationService,
  PlatformAdministrationError,
  type PlatformAdministrationService,
} from "../platformAdministration.js";
import { ApiError } from "./apiError.js";

function requestIds(req: Request, res: Response): { traceId: string; correlationId: string } {
  const traceId = String(res.getHeader("x-trace-id") ?? randomUUID());
  const correlationId =
    (typeof req.headers["x-correlation-id"] === "string"
      ? req.headers["x-correlation-id"]
      : undefined) ?? traceId;
  return { traceId, correlationId };
}

function translate(error: unknown): never {
  if (error instanceof PlatformAdministrationError) {
    throw new ApiError(error.status, error.code, error.message);
  }
  throw error;
}

export function createPlatformRouter(
  providedService?: PlatformAdministrationService,
): Router {
  const router = express.Router();
  let service: PlatformAdministrationService | undefined = providedService;
  const platformService = () => {
    service ??= createPlatformAdministrationService();
    return service;
  };

  router.post("/super-admins/bootstrap", async (req, res, next) => {
    try {
      const result = await platformService().bootstrapFounder({
        authorization: req.header("authorization"),
        bootstrapSecret: req.header("x-bootstrap-secret"),
        payload: req.body ?? {},
        ...requestIds(req, res),
      });
      res.status(201).json(result);
    } catch (error) {
      try {
        translate(error);
      } catch (translated) {
        next(translated);
      }
    }
  });

  router.get("/me/permissions", async (req, res, next) => {
    try {
      const permissions = await platformService().permissions({
        authorization: req.header("authorization"),
        ...requestIds(req, res),
      });
      res.json({ permissions });
    } catch (error) {
      try {
        translate(error);
      } catch (translated) {
        next(translated);
      }
    }
  });

  router.get("/dashboard", async (req, res, next) => {
    try {
      const identity = await platformService().authorize({
        authorization: req.header("authorization"),
        permissionKey: "platform.dashboard.read",
        ...requestIds(req, res),
      });
      res.json({
        status: "authorized",
        actorId: identity.userId,
      });
    } catch (error) {
      try {
        translate(error);
      } catch (translated) {
        next(translated);
      }
    }
  });

  return router;
}
