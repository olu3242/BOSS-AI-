import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import type { createApi } from "../index.js";

type Api = ReturnType<typeof createApi>;
type Handler = (req: Request, res: Response) => Promise<unknown>;

class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
  }
}

function requireOrgId(req: Request): string {
  const orgId = req.header("x-org-id");
  if (!orgId) {
    throw new ApiError(401, "missing_org_id", "x-org-id header is required");
  }
  return orgId;
}

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
 * direct pass-through, no business logic lives here. org_id is read from
 * the `x-org-id` header (TD-006: no auth/JWT yet, so this is a placeholder
 * for the JWT-derived org_id the API conventions call for).
 */
export function createHttpServer(api: Api): Express {
  const app = express();
  app.use(express.json());

  const v1 = express.Router();

  v1.post(
    "/businesses",
    wrap(async (req) => api.business.create({ ...req.body, orgId: requireOrgId(req) }))
  );
  v1.get(
    "/businesses/:businessId",
    wrap(async (req) => api.business.getProfile(requireOrgId(req), param(req, "businessId")))
  );

  v1.post(
    "/businesses/:businessId/mri",
    wrap(async (req) => api.businessMri.start(requireOrgId(req), param(req, "businessId")))
  );
  v1.post(
    "/mri/:mriId/answers",
    wrap(async (req) => api.businessMri.answer(requireOrgId(req), param(req, "mriId"), req.body))
  );
  v1.post(
    "/mri/:mriId/sections/:sectionKey/complete",
    wrap(async (req) =>
      api.businessMri.completeSection(requireOrgId(req), param(req, "mriId"), param(req, "sectionKey") as never)
    )
  );
  v1.post(
    "/mri/:mriId/complete",
    wrap(async (req) => api.businessMri.complete(requireOrgId(req), param(req, "mriId")))
  );
  v1.get(
    "/mri/:mriId/responses",
    wrap(async (req) => api.businessMri.getResponses(requireOrgId(req), param(req, "mriId")))
  );

  v1.post(
    "/businesses/:businessId/dna",
    wrap(async (req) => api.businessDna.generate(requireOrgId(req), param(req, "businessId"), req.body.businessMriId))
  );
  v1.get(
    "/businesses/:businessId/dna",
    wrap(async (req) => api.businessDna.getDna(requireOrgId(req), param(req, "businessId")))
  );

  v1.post(
    "/businesses/:businessId/health",
    wrap(async (req) => api.businessHealth.generate(requireOrgId(req), param(req, "businessId"), req.body.businessMriId))
  );
  v1.get(
    "/businesses/:businessId/health",
    wrap(async (req) => api.businessHealth.getHealth(requireOrgId(req), param(req, "businessId")))
  );

  v1.post(
    "/businesses/:businessId/capabilities",
    wrap(async (req) =>
      api.businessCapability.evaluate(requireOrgId(req), param(req, "businessId"), req.body.businessMriId, req.body.dna)
    )
  );
  v1.get(
    "/businesses/:businessId/capabilities",
    wrap(async (req) => api.businessCapability.list(requireOrgId(req), param(req, "businessId")))
  );

  v1.get(
    "/businesses/:businessId/timeline",
    wrap(async (req) => api.businessTimeline.list(requireOrgId(req), param(req, "businessId")))
  );

  v1.post(
    "/businesses/:businessId/constraints/analyze",
    wrap(async (req) =>
      api.businessConstraint.analyze(requireOrgId(req), param(req, "businessId"), req.body.businessMriId)
    )
  );
  v1.get(
    "/businesses/:businessId/constraints",
    wrap(async (req) => api.businessConstraint.list(requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/constraints/priorities",
    wrap(async (req) => api.businessConstraint.getPriorities(requireOrgId(req), param(req, "businessId")))
  );
  v1.post(
    "/constraints/:constraintId/dismiss",
    wrap(async (req) => api.businessConstraint.dismiss(requireOrgId(req), param(req, "constraintId")))
  );

  v1.post(
    "/businesses/:businessId/recommendations/analyze",
    wrap(async (req) => api.businessRecommendation.analyze(requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/recommendations",
    wrap(async (req) => api.businessRecommendation.list(requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/recommendations/priorities",
    wrap(async (req) => api.businessRecommendation.getPriorities(requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/recommendations/roadmap",
    wrap(async (req) => api.businessRecommendation.getRoadmap(requireOrgId(req), param(req, "businessId")))
  );
  v1.post(
    "/recommendations/:recommendationId/dismiss",
    wrap(async (req) => api.businessRecommendation.dismiss(requireOrgId(req), param(req, "recommendationId")))
  );
  v1.post(
    "/recommendations/:recommendationId/approve",
    wrap(async (req) => api.businessRecommendation.approve(requireOrgId(req), param(req, "recommendationId")))
  );

  v1.post(
    "/businesses/:businessId/integrations/:providerKey/connect",
    wrap(async (req) =>
      api.toolFabric.connectIntegration(requireOrgId(req), param(req, "businessId"), param(req, "providerKey"))
    )
  );
  v1.post(
    "/businesses/:businessId/integrations/:providerKey/disconnect",
    wrap(async (req) =>
      api.toolFabric.disconnectIntegration(requireOrgId(req), param(req, "businessId"), param(req, "providerKey"))
    )
  );
  v1.get(
    "/businesses/:businessId/integrations",
    wrap(async (req) => api.toolFabric.listIntegrations(requireOrgId(req), param(req, "businessId")))
  );
  v1.post(
    "/businesses/:businessId/permissions",
    wrap(async (req) => api.toolFabric.setPermission(requireOrgId(req), param(req, "businessId"), req.body))
  );
  v1.get(
    "/businesses/:businessId/permissions",
    wrap(async (req) => api.toolFabric.listPermissions(requireOrgId(req), param(req, "businessId")))
  );
  v1.post(
    "/businesses/:businessId/tools/requests",
    wrap(async (req) => api.toolFabric.requestTool(requireOrgId(req), param(req, "businessId"), req.body))
  );
  v1.get(
    "/businesses/:businessId/tools/executions",
    wrap(async (req) => api.toolFabric.listExecutions(requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/tools/audit",
    wrap(async (req) => api.toolFabric.listAuditHistory(requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/providers/health",
    wrap(async (req) => api.toolFabric.listProviderHealth(requireOrgId(req), param(req, "businessId")))
  );

  v1.get(
    "/businesses/:businessId/mission-control",
    wrap(async (req) => api.missionControl.getSnapshot(requireOrgId(req), param(req, "businessId")))
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
