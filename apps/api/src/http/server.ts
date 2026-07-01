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
  GenerateDecisionSchema,
  MeasureDecisionSchema,
  CreateScenarioSchema,
  CompareScenarioSchema,
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
    const errorRate = snap.counters.httpRequests > 0
      ? snap.counters.httpErrors / snap.counters.httpRequests
      : 0;
    const healthy = errorRate < 0.05 && snap.memoryMb.heapUsed < 900;
    res.status(healthy ? 200 : 503).json({
      status: healthy ? "ok" : "degraded",
      version: process.env.npm_package_version ?? "0.9.0-rc1",
      checks: {
        api: "ok",
        errorRate: `${(errorRate * 100).toFixed(1)}%`,
        heapMb: snap.memoryMb.heapUsed,
        uptimeMs: snap.uptimeMs,
      },
      ...snap,
    });
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

  // ─── Decision Intelligence (Goal 21) ───────────────────────────────────────

  v1.post(
    "/businesses/:businessId/decisions/generate",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const body = validate(GenerateDecisionSchema, req);
      return api.businessDecision.generate(orgId, param(req, "businessId"), body);
    })
  );
  v1.get(
    "/businesses/:businessId/decisions",
    wrap(async (req) => api.businessDecision.list(await requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/decisions/priorities",
    wrap(async (req) => api.businessDecision.getPriorityRanking(await requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/decisions/optimize",
    wrap(async (req) => api.businessDecision.getOptimizationReport(await requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/decisions/:decisionId/brief",
    wrap(async (req) => api.businessDecision.getExecutiveBrief(await requireOrgId(req), param(req, "decisionId")))
  );
  v1.post(
    "/decisions/:decisionId/evaluate",
    wrap(async (req) => api.businessDecision.evaluate(await requireOrgId(req), param(req, "decisionId")))
  );
  v1.post(
    "/decisions/:decisionId/approve",
    wrap(async (req) => api.businessDecision.approve(await requireOrgId(req), param(req, "decisionId")))
  );
  v1.post(
    "/decisions/:decisionId/reject",
    wrap(async (req) => api.businessDecision.reject(await requireOrgId(req), param(req, "decisionId")))
  );
  v1.post(
    "/decisions/:decisionId/schedule",
    wrap(async (req) => api.businessDecision.schedule(await requireOrgId(req), param(req, "decisionId")))
  );
  v1.post(
    "/decisions/:decisionId/measure",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const body = validate(MeasureDecisionSchema, req);
      return api.businessDecision.measure(orgId, param(req, "decisionId"), body);
    })
  );
  v1.post(
    "/decisions/:decisionId/archive",
    wrap(async (req) => api.businessDecision.archive(await requireOrgId(req), param(req, "decisionId")))
  );

  // ─── Scenario Simulation (Goal 22) ─────────────────────────────────────────

  v1.post(
    "/businesses/:businessId/scenarios",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const body = validate(CreateScenarioSchema, req);
      return api.scenario.create(orgId, param(req, "businessId"), body);
    })
  );
  v1.get(
    "/businesses/:businessId/scenarios",
    wrap(async (req) => api.scenario.list(await requireOrgId(req), param(req, "businessId")))
  );
  v1.post(
    "/businesses/:businessId/scenarios/compare",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const body = validate(CompareScenarioSchema, req);
      return api.scenario.compare(orgId, param(req, "businessId"), body);
    })
  );
  v1.get(
    "/businesses/:businessId/forecasts",
    wrap(async (req) => api.scenario.getForecast(await requireOrgId(req), param(req, "businessId")))
  );

  // KPI Measurement — Goal 19 Business Intelligence
  v1.get(
    "/businesses/:businessId/kpis",
    wrap(async (req) => api.kpiMeasurement.measure(await requireOrgId(req), param(req, "businessId")))
  );

  // Root Cause Analysis — Goal 20 Business Decision OS
  v1.get(
    "/businesses/:businessId/rootcause",
    wrap(async (req) => api.rootCause.analyze(await requireOrgId(req), param(req, "businessId")))
  );

  // Goal 21 — Autonomous Business Operating Loop
  v1.post(
    "/businesses/:businessId/operating-loop/run",
    wrap(async (req) => api.businessOperatingLoop.run(await requireOrgId(req), param(req, "businessId")))
  );

  v1.post(
    "/businesses/:businessId/plans/:decisionId",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      return api.executionPlan.createPlan(orgId, param(req, "businessId"), param(req, "decisionId"));
    })
  );

  v1.get(
    "/businesses/:businessId/plans/:decisionId",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      return api.executionPlan.getPlan(orgId, param(req, "businessId"), param(req, "decisionId"));
    })
  );

  v1.post(
    "/businesses/:businessId/verification/:decisionId",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      return api.outcomeVerification.verify(orgId, param(req, "businessId"), param(req, "decisionId"));
    })
  );

  v1.get(
    "/businesses/:businessId/verification/:decisionId",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      return api.outcomeVerification.getVerification(orgId, param(req, "businessId"), param(req, "decisionId"));
    })
  );

  // Goal 22 — Unified Business Workspace
  v1.get(
    "/businesses/:businessId/workspace",
    wrap(async (req) => api.workspace.getWorkspace(await requireOrgId(req), param(req, "businessId")))
  );

  v1.get(
    "/businesses/:businessId/approvals",
    wrap(async (req) => api.workspace.getPendingApprovals(await requireOrgId(req), param(req, "businessId")))
  );

  v1.get(
    "/metrics",
    wrap(async (_req) => api.observability.getSnapshot())
  );

  // Feature flags — public read (values safe to expose, no secrets)
  v1.get("/flags", (_req, res) => {
    res.json(api.featureFlags.getAll());
  });

  // Support feedback — authenticated, associates report with org
  v1.post(
    "/support/feedback",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const { message, businessId, pageUrl, category } = req.body as {
        message: string;
        businessId?: string;
        pageUrl?: string;
        category?: string;
      };
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        throw new ApiError(400, "missing_message", "message is required");
      }
      return api.support.submitFeedback({ orgId, message, businessId, pageUrl, category });
    })
  );

  // NPS rating (post-MRI, post-workspace)
  v1.post(
    "/nps",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const { businessId, score, comment } = req.body as { businessId?: string; score: number; comment?: string };
      if (typeof score !== "number" || score < 0 || score > 10) {
        throw new ApiError(400, "invalid_score", "score must be 0–10");
      }
      await api.productAnalytics.track({
        type: "analytics.nps.submitted",
        orgId,
        businessId,
        properties: { score, comment: comment ?? null },
      });
      return { status: "recorded" };
    })
  );

  // Beta invite management (internal — no extra auth beyond org token)
  v1.post(
    "/beta/invites",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      return api.betaInvite.generate(orgId);
    })
  );

  v1.get(
    "/beta/invites",
    wrap(async () => {
      return api.betaInvite.list();
    })
  );

  v1.post(
    "/beta/invites/:code/validate",
    wrap(async (req) => {
      const code = param(req, "code");
      const invite = await api.betaInvite.validate(code);
      return { valid: invite !== null, invite: invite ?? null };
    })
  );

  v1.post(
    "/beta/invites/:code/redeem",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const code = param(req, "code");
      const { businessId } = req.body as { businessId: string };
      if (!businessId) throw new ApiError(400, "missing_business_id", "businessId is required");
      return api.betaInvite.redeem(code, businessId);
    })
  );

  // Customer analytics (internal CS use)
  v1.get(
    "/analytics/activation",
    wrap(async () => {
      return api.productAnalytics.getActivationRate();
    })
  );

  v1.get(
    "/analytics/wab",
    wrap(async () => {
      const count = await api.productAnalytics.getWab();
      return { wab: count };
    })
  );

  v1.get(
    "/analytics/mab",
    wrap(async () => {
      const count = await api.productAnalytics.getMab();
      return { mab: count };
    })
  );

  v1.get(
    "/analytics/funnel/:orgId/:businessId",
    wrap(async (req) => {
      const orgId = param(req, "orgId");
      const businessId = param(req, "businessId");
      return api.productAnalytics.queryFunnel(orgId, businessId);
    })
  );

  v1.get(
    "/cs/health",
    wrap(async () => {
      return api.customerHealth.listScores([]);
    })
  );

  v1.get(
    "/cs/health/:orgId/:businessId",
    wrap(async (req) => {
      const orgId = param(req, "orgId");
      const businessId = param(req, "businessId");
      return api.customerHealth.computeScore(orgId, businessId);
    })
  );

  // Marketplace
  v1.get(
    "/marketplace/packs",
    wrap(async (req) => {
      const { q, category } = req.query;
      if (q || category) {
        return api.marketplace.searchCatalog(String(q ?? ""), category ? String(category) : undefined);
      }
      return api.marketplace.listCatalog();
    })
  );

  v1.get(
    "/marketplace/packs/:packKey",
    wrap(async (req) => {
      const packKey = param(req, "packKey");
      const pack = api.marketplace.getPackDetail(packKey);
      if (!pack) {
        throw new ApiError(404, "not_found", `Pack '${packKey}' not found`);
      }
      return pack;
    })
  );

  v1.get(
    "/marketplace/installed",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      return api.marketplace.listInstalled(orgId);
    })
  );

  v1.post(
    "/marketplace/packs/:packKey/install",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const packKey = param(req, "packKey");
      return api.marketplace.installPack(orgId, packKey);
    })
  );

  v1.delete(
    "/marketplace/packs/:packKey/install",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const packKey = param(req, "packKey");
      await api.marketplace.uninstallPack(orgId, packKey);
      return { status: "uninstalled" };
    })
  );

  // ── BTE routes ────────────────────────────────────────────────────────────
  v1.post(
    "/businesses/:businessId/bte/run",
    wrap(async (req) => api.bte.runCycle(await requireOrgId(req), param(req, "businessId")))
  );

  v1.post(
    "/businesses/:businessId/bte/schedule",
    wrap(async (req) => api.bte.scheduleDailyCycle(await requireOrgId(req), param(req, "businessId")))
  );

  v1.delete(
    "/businesses/:businessId/bte/schedule",
    wrap(async (req) => {
      await api.bte.cancelDailyCycle(await requireOrgId(req), param(req, "businessId"));
      return { status: "cancelled" };
    })
  );

  v1.get(
    "/bte/schedules",
    wrap(async (req) => api.bte.listScheduled(await requireOrgId(req)))
  );

  // ── AI Workforce routes ───────────────────────────────────────────────────
  v1.get(
    "/ai-workforce",
    wrap(async (_req) => api.aiWorkforce.listAll())
  );

  v1.get(
    "/ai-workforce/:employeeKey",
    wrap(async (req) => {
      const employee = api.aiWorkforce.getEmployee(param(req, "employeeKey"));
      if (!employee) throw new ApiError(404, "not_found", `AI employee '${param(req, "employeeKey")}' not found`);
      return employee;
    })
  );

  v1.post(
    "/ai-workforce/:employeeKey/activate",
    wrap(async (req) => api.aiWorkforce.activateEmployee(await requireOrgId(req), param(req, "employeeKey")))
  );

  v1.post(
    "/ai-workforce/:employeeKey/deactivate",
    wrap(async (req) => {
      await api.aiWorkforce.deactivateEmployee(await requireOrgId(req), param(req, "employeeKey"));
      return { status: "deactivated" };
    })
  );

  v1.get(
    "/ai-workforce/active",
    wrap(async (req) => api.aiWorkforce.listActiveForOrg(await requireOrgId(req)))
  );

  // ── Org Health routes ─────────────────────────────────────────────────────
  v1.get(
    "/org/health",
    wrap(async (req) => api.orgHealth.getOrgSummary(await requireOrgId(req)))
  );

  v1.get(
    "/businesses/:businessId/health-summary",
    wrap(async (req) => api.orgHealth.getBusinessSummary(await requireOrgId(req), param(req, "businessId")))
  );

  // ── Insight routes ────────────────────────────────────────────────────────
  v1.get(
    "/org/insights",
    wrap(async (req) => api.insight.getOrgInsights(await requireOrgId(req)))
  );

  v1.get(
    "/org/constraint-frequencies",
    wrap(async (req) => api.insight.getConstraintFrequencies(await requireOrgId(req)))
  );

  v1.get(
    "/recommendations/templates",
    wrap(async (_req) => api.insight.getRecommendationTemplates())
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
