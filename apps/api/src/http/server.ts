import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import type { createApi } from "../index.js";
import { ApiError } from "./apiError.js";
import { mintDevToken, requireOrgId } from "./auth.js";
import { requestTracing } from "./telemetry.js";
import {
  validate,
  CreateBusinessSchema,
  SubmitMriResponseSchema,
  UpdateConstraintStatusSchema,
  UpdateRecommendationStatusSchema,
  SetPermissionSchema,
  RequestToolSchema,
  DelegateMultiAgentTaskSchema,
} from "./validation.js";

type Api = ReturnType<typeof createApi>;
type Handler = (req: Request, res: Response) => Promise<unknown>;

function param(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) {
    throw new ApiError(400, "missing_param", `Missing required route parameter "${name}"`);
  }
  return value;
}

function wrap(handler: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).then(
      (result) => res.json(result),
      (error) => next(error)
    );
  };
}

/**
 * Thin HTTP transport over the existing controllers — every route is a
 * direct pass-through, no business logic lives here. org_id comes from a
 * verified Supabase JWT's `org_id` claim (see ./auth.ts) — token minting
 * still has no real login UI behind it (TD-030), so this closes the
 * verification half of TD-006/TD-027, not the issuance half.
 * All mutating routes validate request bodies via Zod (TD-028 resolved).
 */
export function createHttpServer(api: Api): Express {
  const app = express();
  app.use(express.json());
  app.use(requestTracing(api.observability));

  // Unauthenticated health endpoint — standard ops probe
  app.get("/health", (_req, res) => {
    const snap = api.observability.getSnapshot();
    res.json({ status: "ok", ...snap });
  });

  const v1 = express.Router();

  if (process.env.NODE_ENV !== "production") {
    v1.post(
      "/auth/dev-token",
      wrap(async (req) => ({ token: await mintDevToken(String(req.body.orgId)) }))
    );
  }

  v1.post(
    "/businesses",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const body = validate(CreateBusinessSchema, req);
      return api.business.create({ ...body, orgId });
    })
  );
  v1.get(
    "/businesses/:businessId",
    wrap(async (req) => api.business.getProfile(await requireOrgId(req), param(req, "businessId")))
  );

  v1.post(
    "/businesses/:businessId/mri",
    wrap(async (req) => api.businessMri.start(await requireOrgId(req), param(req, "businessId")))
  );
  v1.post(
    "/mri/:mriId/answers",
    wrap(async (req) => {
      const body = validate(SubmitMriResponseSchema, req);
      return api.businessMri.answer(await requireOrgId(req), param(req, "mriId"), body as never);
    })
  );
  v1.post(
    "/mri/:mriId/sections/:sectionKey/complete",
    wrap(async (req) =>
      api.businessMri.completeSection(await requireOrgId(req), param(req, "mriId"), param(req, "sectionKey") as never)
    )
  );
  v1.post(
    "/mri/:mriId/complete",
    wrap(async (req) => api.businessMri.complete(await requireOrgId(req), param(req, "mriId")))
  );
  v1.get(
    "/mri/:mriId/responses",
    wrap(async (req) => api.businessMri.getResponses(await requireOrgId(req), param(req, "mriId")))
  );

  v1.post(
    "/businesses/:businessId/dna",
    wrap(async (req) => api.businessDna.generate(await requireOrgId(req), param(req, "businessId"), req.body.businessMriId as string))
  );
  v1.get(
    "/businesses/:businessId/dna",
    wrap(async (req) => api.businessDna.getDna(await requireOrgId(req), param(req, "businessId")))
  );

  v1.post(
    "/businesses/:businessId/health",
    wrap(async (req) => api.businessHealth.generate(await requireOrgId(req), param(req, "businessId"), req.body.businessMriId as string))
  );
  v1.get(
    "/businesses/:businessId/health",
    wrap(async (req) => api.businessHealth.getHealth(await requireOrgId(req), param(req, "businessId")))
  );

  v1.post(
    "/businesses/:businessId/capabilities",
    wrap(async (req) =>
      api.businessCapability.evaluate(await requireOrgId(req), param(req, "businessId"), req.body.businessMriId as string, req.body.dna as never)
    )
  );
  v1.get(
    "/businesses/:businessId/capabilities",
    wrap(async (req) => api.businessCapability.list(await requireOrgId(req), param(req, "businessId")))
  );

  v1.get(
    "/businesses/:businessId/timeline",
    wrap(async (req) => api.businessTimeline.list(await requireOrgId(req), param(req, "businessId")))
  );

  v1.post(
    "/businesses/:businessId/constraints/analyze",
    wrap(async (req) =>
      api.businessConstraint.analyze(await requireOrgId(req), param(req, "businessId"), req.body.businessMriId as string)
    )
  );
  v1.get(
    "/businesses/:businessId/constraints",
    wrap(async (req) => api.businessConstraint.list(await requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/constraints/priorities",
    wrap(async (req) => api.businessConstraint.getPriorities(await requireOrgId(req), param(req, "businessId")))
  );
  v1.post(
    "/constraints/:constraintId/status",
    wrap(async (req) => {
      const body = validate(UpdateConstraintStatusSchema, req);
      const orgId = await requireOrgId(req);
      const constraintId = param(req, "constraintId");
      return body.status === "dismissed"
        ? api.businessConstraint.dismiss(orgId, constraintId)
        : api.businessConstraint.dismiss(orgId, constraintId);
    })
  );
  v1.post(
    "/constraints/:constraintId/dismiss",
    wrap(async (req) => api.businessConstraint.dismiss(await requireOrgId(req), param(req, "constraintId")))
  );

  v1.post(
    "/businesses/:businessId/recommendations/analyze",
    wrap(async (req) => api.businessRecommendation.analyze(await requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/recommendations",
    wrap(async (req) => api.businessRecommendation.list(await requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/recommendations/priorities",
    wrap(async (req) => api.businessRecommendation.getPriorities(await requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/recommendations/roadmap",
    wrap(async (req) => api.businessRecommendation.getRoadmap(await requireOrgId(req), param(req, "businessId")))
  );
  v1.post(
    "/recommendations/:recommendationId/status",
    wrap(async (req) => {
      const body = validate(UpdateRecommendationStatusSchema, req);
      const orgId = await requireOrgId(req);
      const recommendationId = param(req, "recommendationId");
      if (body.status === "approved") {
        return api.businessRecommendation.approve(orgId, recommendationId);
      }
      return api.businessRecommendation.dismiss(orgId, recommendationId);
    })
  );
  v1.post(
    "/recommendations/:recommendationId/dismiss",
    wrap(async (req) => api.businessRecommendation.dismiss(await requireOrgId(req), param(req, "recommendationId")))
  );
  v1.post(
    "/recommendations/:recommendationId/approve",
    wrap(async (req) => api.businessRecommendation.approve(await requireOrgId(req), param(req, "recommendationId")))
  );

  v1.post(
    "/businesses/:businessId/integrations/:providerKey/connect",
    wrap(async (req) =>
      api.toolFabric.connectIntegration(await requireOrgId(req), param(req, "businessId"), param(req, "providerKey"))
    )
  );
  v1.post(
    "/businesses/:businessId/integrations/:providerKey/disconnect",
    wrap(async (req) =>
      api.toolFabric.disconnectIntegration(await requireOrgId(req), param(req, "businessId"), param(req, "providerKey"))
    )
  );
  v1.get(
    "/businesses/:businessId/integrations",
    wrap(async (req) => api.toolFabric.listIntegrations(await requireOrgId(req), param(req, "businessId")))
  );
  v1.post(
    "/businesses/:businessId/permissions",
    wrap(async (req) => {
      const body = validate(SetPermissionSchema, req);
      return api.toolFabric.setPermission(await requireOrgId(req), param(req, "businessId"), body);
    })
  );
  v1.get(
    "/businesses/:businessId/permissions",
    wrap(async (req) => api.toolFabric.listPermissions(await requireOrgId(req), param(req, "businessId")))
  );
  v1.post(
    "/businesses/:businessId/tools/requests",
    wrap(async (req) => {
      const body = validate(RequestToolSchema, req);
      return api.toolFabric.requestTool(await requireOrgId(req), param(req, "businessId"), body);
    })
  );
  v1.get(
    "/businesses/:businessId/tools/executions",
    wrap(async (req) => api.toolFabric.listExecutions(await requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/tools/audit",
    wrap(async (req) => api.toolFabric.listAuditHistory(await requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/providers/health",
    wrap(async (req) => api.toolFabric.listProviderHealth(await requireOrgId(req), param(req, "businessId")))
  );

  v1.get(
    "/businesses/:businessId/mission-control",
    wrap(async (req) => api.missionControl.getSnapshot(await requireOrgId(req), param(req, "businessId")))
  );

  v1.post(
    "/businesses/:businessId/multi-agent/delegate",
    wrap(async (req) => {
      const body = validate(DelegateMultiAgentTaskSchema, req);
      const { employeeKeys, ...ctx } = body;
      return api.multiAgentRuntime.delegateTask(await requireOrgId(req), param(req, "businessId"), ctx, employeeKeys);
    })
  );

  v1.get(
    "/metrics",
    wrap(async (_req) => api.observability.getSnapshot())
  );

  app.use("/api/v1", v1);

  app.use((req, res) => {
    res.status(404).json({
      code: "not_found",
      message: `No route for ${req.method} ${req.path}`,
      details: null,
      traceId: randomUUID(),
    });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const traceId = randomUUID();
    if (error instanceof ApiError) {
      res.status(error.status).json({ code: error.code, message: error.message, details: null, traceId });
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ code: "internal_error", message, details: null, traceId });
  });

  return app;
}
