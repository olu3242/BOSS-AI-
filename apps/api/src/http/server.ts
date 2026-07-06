import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import type { createApi } from "../index.js";
import { ApiError } from "./apiError.js";
import { mintDevToken, requireOrgId, requireRole } from "./auth.js";
import { requestTracing } from "./telemetry.js";
import {
  validate,
  validateData,
  validateSafe,
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
  CreateGoalSchema,
  UpdateGoalSchema,
  UpdateGoalStatusSchema,
  UpdateCustomerSchema,
  UpdateLeadSchema,
  UpdateOpportunitySchema,
  UpdateEstimateSchema,
  UpdateAppointmentSchema,
  UpdateJobSchema,
  UpdateInvoiceSchema,
  CreatePaymentSchema,
  CreateReviewSchema,
  UpdateStaffSchema,
  UpdateTaskSchema,
  UpdateDocumentSchema,
  CreateConversationSchema,
  AddMessageSchema,
  UpdateWorkflowSchema,
  UpdateLifecyclePolicySchema,
  SaveSearchSchema,
  SendNotificationSchema,
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
      return api.businessConstraint.updateStatus(orgId, constraintId, body.status);
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
  v1.get(
    "/recommendations/:recommendationId",
    wrap(async (req) => api.businessRecommendation.get(await requireOrgId(req), param(req, "recommendationId")))
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

  // KPI Measurement & History — Goal 19 Business Intelligence
  v1.get(
    "/businesses/:businessId/kpis",
    wrap(async (req) => api.kpiMeasurement.measure(await requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/kpis/history",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const { kpiKey, limit } = req.query as { kpiKey?: string; limit?: string };
      return api.kpiMeasurement.history(orgId, param(req, "businessId"), kpiKey, limit ? parseInt(limit, 10) : undefined);
    })
  );

  // Business Goals / OKRs — Goal 19 WS8
  v1.post(
    "/businesses/:businessId/goals",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const body = validate(CreateGoalSchema, req);
      return api.businessGoal.create(orgId, param(req, "businessId"), body);
    })
  );
  v1.get(
    "/businesses/:businessId/goals",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const status = req.query.status as string | undefined;
      return api.businessGoal.list(orgId, param(req, "businessId"), status as Parameters<typeof api.businessGoal.list>[2]);
    })
  );
  v1.get(
    "/businesses/:businessId/goals/:goalId",
    wrap(async (req) => api.businessGoal.get(await requireOrgId(req), param(req, "goalId")))
  );
  v1.patch(
    "/businesses/:businessId/goals/:goalId",
    wrap(async (req) => {
      const body = validate(UpdateGoalSchema, req);
      return api.businessGoal.update(await requireOrgId(req), param(req, "goalId"), body);
    })
  );
  v1.post(
    "/goals/:goalId/status",
    wrap(async (req) => {
      const body = validate(UpdateGoalStatusSchema, req);
      return api.businessGoal.updateStatus(await requireOrgId(req), param(req, "goalId"), body.status);
    })
  );

  // Executive Briefings — Goal 19 WS7
  v1.post(
    "/businesses/:businessId/briefings/generate",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const { period } = req.body as { period?: string };
      return api.executiveBriefing.generate(orgId, param(req, "businessId"), period as Parameters<typeof api.executiveBriefing.generate>[2]);
    })
  );
  v1.get(
    "/businesses/:businessId/briefings/latest",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const period = req.query.period as string | undefined;
      return api.executiveBriefing.getLatest(orgId, param(req, "businessId"), period as Parameters<typeof api.executiveBriefing.getLatest>[2]);
    })
  );
  v1.get(
    "/businesses/:businessId/briefings",
    wrap(async (req) => api.executiveBriefing.list(await requireOrgId(req), param(req, "businessId")))
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
      await requireOrgId(req);
      const code = param(req, "code");
      const { businessId } = req.body as { businessId: string };
      if (!businessId) throw new ApiError(400, "missing_business_id", "businessId is required");
      return api.betaInvite.redeem(code, businessId);
    })
  );

  // Customer analytics (internal CS / admin use — requires admin role)
  v1.get(
    "/analytics/activation",
    wrap(async (req) => {
      await requireRole(req, "admin");
      return api.productAnalytics.getActivationRate();
    })
  );

  v1.get(
    "/analytics/wab",
    wrap(async (req) => {
      await requireRole(req, "admin");
      const count = await api.productAnalytics.getWab();
      return { wab: count };
    })
  );

  v1.get(
    "/analytics/mab",
    wrap(async (req) => {
      await requireRole(req, "admin");
      const count = await api.productAnalytics.getMab();
      return { mab: count };
    })
  );

  v1.get(
    "/analytics/funnel/:orgId/:businessId",
    wrap(async (req) => {
      await requireRole(req, "admin");
      const orgId = param(req, "orgId");
      const businessId = param(req, "businessId");
      return api.productAnalytics.queryFunnel(orgId, businessId);
    })
  );

  v1.get(
    "/cs/health",
    wrap(async (req) => {
      await requireRole(req, "admin");
      return api.customerHealth.listScores([]);
    })
  );

  v1.get(
    "/cs/health/:orgId/:businessId",
    wrap(async (req) => {
      await requireRole(req, "admin");
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

  // Platform-internal tick — runs all due BTE jobs across all orgs.
  // Called by the external cron/scheduler (e.g. pg_cron, Inngest, Railway).
  // Auth: service-to-service bearer token validated upstream.
  v1.post(
    "/bte/tick",
    wrap(async () => api.bte.runDue())
  );

  // ── AI Workforce routes ───────────────────────────────────────────────────
  v1.get(
    "/ai-workforce",
    wrap(async (_req) => api.aiWorkforce.listAll())
  );

  // /active must be registered before /:employeeKey or Express captures it as a key lookup
  v1.get(
    "/ai-workforce/active",
    wrap(async (req) => api.aiWorkforce.listActiveForOrg(await requireOrgId(req)))
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

  // ── Customer OS routes ────────────────────────────────────────────────────
  v1.get(
    "/businesses/:businessId/customers",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const q = typeof req.query["q"] === "string" ? req.query["q"] : undefined;
      if (q?.trim()) return api.customer.search(orgId, param(req, "businessId"), q);
      return api.customer.list(orgId, param(req, "businessId"));
    })
  );

  v1.post(
    "/businesses/:businessId/customers",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      return api.customer.create(orgId, param(req, "businessId"), req.body as Parameters<typeof api.customer.create>[2]);
    })
  );

  v1.get(
    "/businesses/:businessId/customers/:customerId",
    wrap(async (req) => api.customer.get(await requireOrgId(req), param(req, "customerId")))
  );

  v1.patch(
    "/businesses/:businessId/customers/:customerId",
    wrap(async (req) => api.customer.update(await requireOrgId(req), param(req, "customerId"), validate(UpdateCustomerSchema, req.body)))
  );

  v1.delete(
    "/businesses/:businessId/customers/:customerId",
    wrap(async (req) => {
      await api.customer.delete(await requireOrgId(req), param(req, "customerId"));
      return { deleted: true };
    })
  );

  v1.get(
    "/businesses/:businessId/customers/:customerId/interactions",
    wrap(async (req) => api.customer.listInteractions(await requireOrgId(req), param(req, "customerId")))
  );

  v1.post(
    "/businesses/:businessId/customers/:customerId/interactions",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      return api.customer.addInteraction(
        orgId,
        param(req, "businessId"),
        param(req, "customerId"),
        req.body as Parameters<typeof api.customer.addInteraction>[3]
      );
    })
  );

  // ── Jobs routes ───────────────────────────────────────────────────────────
  v1.get(
    "/businesses/:businessId/jobs",
    wrap(async (req) => api.job.list(await requireOrgId(req), param(req, "businessId")))
  );

  v1.post(
    "/businesses/:businessId/jobs",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      return api.job.create(orgId, param(req, "businessId"), req.body as Parameters<typeof api.job.create>[2]);
    })
  );

  v1.get(
    "/businesses/:businessId/jobs/:jobId",
    wrap(async (req) => api.job.get(await requireOrgId(req), param(req, "jobId")))
  );

  v1.patch(
    "/businesses/:businessId/jobs/:jobId",
    wrap(async (req) => api.job.update(await requireOrgId(req), param(req, "jobId"), validate(UpdateJobSchema, req.body)))
  );

  v1.delete(
    "/businesses/:businessId/jobs/:jobId",
    wrap(async (req) => {
      await api.job.delete(await requireOrgId(req), param(req, "jobId"));
      return { deleted: true };
    })
  );

  v1.post(
    "/businesses/:businessId/jobs/:jobId/start",
    wrap(async (req) => api.job.start(await requireOrgId(req), param(req, "jobId")))
  );

  v1.post(
    "/businesses/:businessId/jobs/:jobId/complete",
    wrap(async (req) => {
      const body = req.body as { actualDurationMinutes?: number };
      return api.job.complete(await requireOrgId(req), param(req, "jobId"), body.actualDurationMinutes);
    })
  );

  // ── Appointments routes ───────────────────────────────────────────────────
  v1.get(
    "/businesses/:businessId/appointments",
    wrap(async (req) => api.appointment.list(await requireOrgId(req), param(req, "businessId")))
  );

  v1.post(
    "/businesses/:businessId/appointments",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      return api.appointment.create(orgId, param(req, "businessId"), req.body as Parameters<typeof api.appointment.create>[2]);
    })
  );

  v1.get(
    "/businesses/:businessId/appointments/:appointmentId",
    wrap(async (req) => api.appointment.get(await requireOrgId(req), param(req, "appointmentId")))
  );

  v1.patch(
    "/businesses/:businessId/appointments/:appointmentId",
    wrap(async (req) => api.appointment.update(await requireOrgId(req), param(req, "appointmentId"), validate(UpdateAppointmentSchema, req.body)))
  );

  v1.delete(
    "/businesses/:businessId/appointments/:appointmentId",
    wrap(async (req) => {
      await api.appointment.delete(await requireOrgId(req), param(req, "appointmentId"));
      return { deleted: true };
    })
  );

  v1.post(
    "/businesses/:businessId/appointments/:appointmentId/confirm",
    wrap(async (req) => api.appointment.confirm(await requireOrgId(req), param(req, "appointmentId")))
  );

  v1.post(
    "/businesses/:businessId/appointments/:appointmentId/cancel",
    wrap(async (req) => api.appointment.cancel(await requireOrgId(req), param(req, "appointmentId")))
  );

  // ── Invoices routes ───────────────────────────────────────────────────────
  v1.get(
    "/businesses/:businessId/invoices",
    wrap(async (req) => api.invoice.list(await requireOrgId(req), param(req, "businessId")))
  );

  v1.post(
    "/businesses/:businessId/invoices",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      return api.invoice.create(orgId, param(req, "businessId"), req.body as Parameters<typeof api.invoice.create>[2]);
    })
  );

  v1.get(
    "/businesses/:businessId/invoices/:invoiceId",
    wrap(async (req) => api.invoice.get(await requireOrgId(req), param(req, "invoiceId")))
  );

  v1.patch(
    "/businesses/:businessId/invoices/:invoiceId",
    wrap(async (req) => api.invoice.update(await requireOrgId(req), param(req, "invoiceId"), validate(UpdateInvoiceSchema, req.body) as Parameters<typeof api.invoice.update>[2]))
  );

  v1.post(
    "/businesses/:businessId/invoices/:invoiceId/send",
    wrap(async (req) => api.invoice.send(await requireOrgId(req), param(req, "invoiceId")))
  );

  v1.post(
    "/businesses/:businessId/invoices/:invoiceId/mark-paid",
    wrap(async (req) => {
      const body = req.body as { paymentMethod?: string };
      return api.invoice.markPaid(await requireOrgId(req), param(req, "invoiceId"), body.paymentMethod);
    })
  );

  // ── Payments routes ───────────────────────────────────────────────────────
  v1.get(
    "/businesses/:businessId/payments",
    wrap(async (req) => api.payment.list(await requireOrgId(req), param(req, "businessId")))
  );

  v1.post(
    "/businesses/:businessId/payments",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      return api.payment.create(orgId, param(req, "businessId"), validate(CreatePaymentSchema, req.body) as Parameters<typeof api.payment.create>[2]);
    })
  );

  v1.get(
    "/businesses/:businessId/payments/:paymentId",
    wrap(async (req) => api.payment.get(await requireOrgId(req), param(req, "paymentId")))
  );

  v1.patch(
    "/businesses/:businessId/payments/:paymentId/status",
    wrap(async (req) => {
      const { status } = req.body as { status: string };
      return api.payment.updateStatus(await requireOrgId(req), param(req, "paymentId"), status as Parameters<typeof api.payment.updateStatus>[2]);
    })
  );

  // ── Reviews routes ────────────────────────────────────────────────────────
  v1.get(
    "/businesses/:businessId/reviews",
    wrap(async (req) => api.review.list(await requireOrgId(req), param(req, "businessId")))
  );

  v1.post(
    "/businesses/:businessId/reviews",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      return api.review.create(orgId, param(req, "businessId"), validate(CreateReviewSchema, req.body));
    })
  );

  v1.patch(
    "/businesses/:businessId/reviews/:reviewId/respond",
    wrap(async (req) => {
      const { response } = req.body as { response: string };
      return api.review.respond(await requireOrgId(req), param(req, "reviewId"), response);
    })
  );

  v1.patch(
    "/businesses/:businessId/reviews/:reviewId/status",
    wrap(async (req) => {
      const { status } = req.body as { status: string };
      return api.review.updateStatus(await requireOrgId(req), param(req, "reviewId"), status as Parameters<typeof api.review.updateStatus>[2]);
    })
  );

  // ── Sales OS — Leads routes ───────────────────────────────────────────────
  v1.get(
    "/businesses/:businessId/leads",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const q = (req.query as Record<string, string>).q;
      if (q?.trim()) return api.lead.search(orgId, param(req, "businessId"), q);
      return api.lead.list(orgId, param(req, "businessId"));
    })
  );

  v1.post(
    "/businesses/:businessId/leads",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      return api.lead.create(orgId, param(req, "businessId"), req.body as Parameters<typeof api.lead.create>[2]);
    })
  );

  v1.get(
    "/businesses/:businessId/leads/:leadId",
    wrap(async (req) => api.lead.get(await requireOrgId(req), param(req, "leadId")))
  );

  v1.patch(
    "/businesses/:businessId/leads/:leadId",
    wrap(async (req) => api.lead.update(await requireOrgId(req), param(req, "leadId"), validate(UpdateLeadSchema, req.body) as Parameters<typeof api.lead.update>[2]))
  );

  v1.delete(
    "/businesses/:businessId/leads/:leadId",
    wrap(async (req) => {
      await api.lead.delete(await requireOrgId(req), param(req, "leadId"));
      return { deleted: true };
    })
  );

  v1.post(
    "/businesses/:businessId/leads/:leadId/qualify",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actor = (req.body as { actor?: string }).actor ?? "system";
      return api.lead.qualify(orgId, param(req, "leadId"), actor);
    })
  );

  v1.post(
    "/businesses/:businessId/leads/:leadId/assign",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const { assignedTo } = req.body as { assignedTo: string };
      return api.lead.assign(orgId, param(req, "leadId"), assignedTo);
    })
  );

  v1.post(
    "/businesses/:businessId/leads/:leadId/convert",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const { convertedCustomerId } = req.body as { convertedCustomerId: string };
      return api.lead.convert(orgId, param(req, "leadId"), convertedCustomerId);
    })
  );

  v1.post(
    "/businesses/:businessId/leads/:leadId/lost",
    wrap(async (req) => api.lead.markLost(await requireOrgId(req), param(req, "leadId")))
  );

  // ── Staff routes ─────────────────────────────────────────────────────────
  v1.get(
    "/businesses/:businessId/staff",
    wrap(async (req) => api.staff.list(await requireOrgId(req), param(req, "businessId")))
  );
  v1.post(
    "/businesses/:businessId/staff",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      return api.staff.create(orgId, param(req, "businessId"), req.body as Parameters<typeof api.staff.create>[2], actorId);
    })
  );
  v1.get(
    "/businesses/:businessId/staff/:staffId",
    wrap(async (req) => api.staff.get(await requireOrgId(req), param(req, "staffId")))
  );
  v1.patch(
    "/businesses/:businessId/staff/:staffId",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      return api.staff.update(orgId, param(req, "staffId"), validate(UpdateStaffSchema, req.body), actorId);
    })
  );
  v1.delete(
    "/businesses/:businessId/staff/:staffId",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      await api.staff.delete(orgId, param(req, "staffId"), actorId);
      return { deleted: true };
    })
  );

  // ── Opportunity routes ────────────────────────────────────────────────────
  v1.get(
    "/businesses/:businessId/opportunities",
    wrap(async (req) => api.opportunity.list(await requireOrgId(req), param(req, "businessId")))
  );
  v1.post(
    "/businesses/:businessId/opportunities",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      return api.opportunity.create(orgId, param(req, "businessId"), req.body as Parameters<typeof api.opportunity.create>[2], actorId);
    })
  );
  v1.get(
    "/businesses/:businessId/opportunities/:opportunityId",
    wrap(async (req) => api.opportunity.get(await requireOrgId(req), param(req, "opportunityId")))
  );
  v1.patch(
    "/businesses/:businessId/opportunities/:opportunityId",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      return api.opportunity.update(orgId, param(req, "opportunityId"), validate(UpdateOpportunitySchema, req.body) as Parameters<typeof api.opportunity.update>[2], actorId);
    })
  );
  v1.delete(
    "/businesses/:businessId/opportunities/:opportunityId",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      await api.opportunity.delete(orgId, param(req, "opportunityId"), actorId);
      return { deleted: true };
    })
  );

  // ── Conversation routes ───────────────────────────────────────────────────
  v1.get(
    "/businesses/:businessId/conversations",
    wrap(async (req) => {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      return api.conversation.list(await requireOrgId(req), param(req, "businessId"), limit);
    })
  );
  v1.post(
    "/businesses/:businessId/conversations",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      return api.conversation.create(orgId, param(req, "businessId"), validate(CreateConversationSchema, req.body) as unknown as Parameters<typeof api.conversation.create>[2], actorId);
    })
  );
  v1.get(
    "/businesses/:businessId/conversations/:conversationId",
    wrap(async (req) => api.conversation.get(await requireOrgId(req), param(req, "conversationId")))
  );
  v1.patch(
    "/businesses/:businessId/conversations/:conversationId",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      return api.conversation.update(orgId, param(req, "conversationId"), req.body as Parameters<typeof api.conversation.update>[2], actorId);
    })
  );
  v1.delete(
    "/businesses/:businessId/conversations/:conversationId",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      await api.conversation.delete(orgId, param(req, "conversationId"), actorId);
      return { deleted: true };
    })
  );
  v1.post(
    "/businesses/:businessId/conversations/:conversationId/messages",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      const msg = validateData(AddMessageSchema, req.body);
      return api.conversation.update(orgId, param(req, "conversationId"), { body: msg.body }, actorId);
    })
  );

  // ── Task routes ───────────────────────────────────────────────────────────
  v1.get(
    "/businesses/:businessId/tasks",
    wrap(async (req) => api.task.list(await requireOrgId(req), param(req, "businessId")))
  );
  v1.post(
    "/businesses/:businessId/tasks",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      return api.task.create(orgId, param(req, "businessId"), req.body as Parameters<typeof api.task.create>[2], actorId);
    })
  );
  v1.get(
    "/businesses/:businessId/tasks/:taskId",
    wrap(async (req) => api.task.get(await requireOrgId(req), param(req, "taskId")))
  );
  v1.get(
    "/businesses/:businessId/tasks/:taskId/children",
    wrap(async (req) => api.task.listChildren(await requireOrgId(req), param(req, "taskId")))
  );
  v1.patch(
    "/businesses/:businessId/tasks/:taskId",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      return api.task.update(orgId, param(req, "taskId"), validate(UpdateTaskSchema, req.body) as Parameters<typeof api.task.update>[2], actorId);
    })
  );
  v1.delete(
    "/businesses/:businessId/tasks/:taskId",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      await api.task.delete(orgId, param(req, "taskId"), actorId);
      return { deleted: true };
    })
  );

  // ── Document routes ───────────────────────────────────────────────────────
  v1.get(
    "/businesses/:businessId/documents",
    wrap(async (req) => api.document.list(await requireOrgId(req), param(req, "businessId")))
  );
  v1.post(
    "/businesses/:businessId/documents",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      return api.document.create(orgId, param(req, "businessId"), req.body as Parameters<typeof api.document.create>[2], actorId);
    })
  );
  v1.get(
    "/businesses/:businessId/documents/:documentId",
    wrap(async (req) => api.document.get(await requireOrgId(req), param(req, "documentId")))
  );
  v1.patch(
    "/businesses/:businessId/documents/:documentId",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      return api.document.update(orgId, param(req, "documentId"), validate(UpdateDocumentSchema, req.body), actorId);
    })
  );
  v1.delete(
    "/businesses/:businessId/documents/:documentId",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      await api.document.delete(orgId, param(req, "documentId"), actorId);
      return { deleted: true };
    })
  );

  // ── Estimate routes ───────────────────────────────────────────────────────
  v1.get(
    "/businesses/:businessId/estimates",
    wrap(async (req) => api.estimate.list(await requireOrgId(req), param(req, "businessId")))
  );
  v1.post(
    "/businesses/:businessId/estimates",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      return api.estimate.create(orgId, param(req, "businessId"), req.body as Parameters<typeof api.estimate.create>[2], actorId);
    })
  );
  v1.get(
    "/businesses/:businessId/estimates/:estimateId",
    wrap(async (req) => api.estimate.get(await requireOrgId(req), param(req, "estimateId")))
  );
  v1.patch(
    "/businesses/:businessId/estimates/:estimateId",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      return api.estimate.update(orgId, param(req, "estimateId"), validate(UpdateEstimateSchema, req.body) as Parameters<typeof api.estimate.update>[2], actorId);
    })
  );
  v1.post(
    "/businesses/:businessId/estimates/:estimateId/send",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      return api.estimate.send(orgId, param(req, "estimateId"), actorId);
    })
  );
  v1.post(
    "/businesses/:businessId/estimates/:estimateId/accept",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      return api.estimate.accept(orgId, param(req, "estimateId"), actorId);
    })
  );
  v1.post(
    "/businesses/:businessId/estimates/:estimateId/decline",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      return api.estimate.decline(orgId, param(req, "estimateId"), actorId);
    })
  );
  v1.post(
    "/businesses/:businessId/estimates/:estimateId/convert",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      const { invoiceId } = req.body as { invoiceId: string };
      return api.estimate.convert(orgId, param(req, "estimateId"), invoiceId, actorId);
    })
  );
  v1.delete(
    "/businesses/:businessId/estimates/:estimateId",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const actorId = req.headers["x-actor-id"] as string ?? "system";
      await api.estimate.delete(orgId, param(req, "estimateId"), actorId);
      return { deleted: true };
    })
  );

  // ── Workflow routes ───────────────────────────────────────────────────────
  v1.post(
    "/businesses/:businessId/workflows",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const body = req.body as Record<string, unknown>;
      return api.workflow.create(orgId, param(req, "businessId"), body as Parameters<Api["workflow"]["create"]>[2]);
    })
  );
  v1.get(
    "/businesses/:businessId/workflows",
    wrap(async (req) => api.workflow.list(await requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/workflows/:workflowId",
    wrap(async (req) => api.workflow.getById(await requireOrgId(req), param(req, "workflowId")))
  );
  v1.patch(
    "/businesses/:businessId/workflows/:workflowId",
    wrap(async (req) => api.workflow.update(await requireOrgId(req), param(req, "workflowId"), validate(UpdateWorkflowSchema, req.body)))
  );
  v1.post(
    "/businesses/:businessId/workflows/:workflowId/publish",
    wrap(async (req) => api.workflow.publish(await requireOrgId(req), param(req, "workflowId")))
  );
  v1.post(
    "/businesses/:businessId/workflows/:workflowId/archive",
    wrap(async (req) => api.workflow.archive(await requireOrgId(req), param(req, "workflowId")))
  );
  v1.delete(
    "/businesses/:businessId/workflows/:workflowId",
    wrap(async (req) => {
      await api.workflow.delete(await requireOrgId(req), param(req, "workflowId"));
      return { deleted: true };
    })
  );

  // ── WorkflowRun routes ────────────────────────────────────────────────────
  v1.post(
    "/businesses/:businessId/workflow-runs",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const body = req.body as Record<string, unknown>;
      return api.workflowRun.create(orgId, param(req, "businessId"), body as Parameters<Api["workflowRun"]["create"]>[2]);
    })
  );
  v1.get(
    "/businesses/:businessId/workflow-runs",
    wrap(async (req) => api.workflowRun.listByBusiness(await requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/workflow-runs/:runId",
    wrap(async (req) => api.workflowRun.getById(await requireOrgId(req), param(req, "runId")))
  );
  v1.get(
    "/businesses/:businessId/workflows/:workflowId/runs",
    wrap(async (req) => api.workflowRun.listByWorkflow(await requireOrgId(req), param(req, "workflowId")))
  );
  v1.post(
    "/businesses/:businessId/workflow-runs/:runId/complete",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const { result, durationMs } = req.body as { result: Record<string, unknown>; durationMs: number };
      return api.workflowRun.complete(orgId, param(req, "runId"), result, durationMs);
    })
  );
  v1.post(
    "/businesses/:businessId/workflow-runs/:runId/fail",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const { errorMessage, durationMs } = req.body as { errorMessage: string; durationMs: number };
      return api.workflowRun.fail(orgId, param(req, "runId"), errorMessage, durationMs);
    })
  );
  v1.post(
    "/businesses/:businessId/workflow-runs/:runId/cancel",
    wrap(async (req) => api.workflowRun.cancel(await requireOrgId(req), param(req, "runId")))
  );

  // ── LifecyclePolicy routes ────────────────────────────────────────────────
  v1.post(
    "/businesses/:businessId/lifecycle-policies",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const body = req.body as Record<string, unknown>;
      return api.lifecyclePolicy.create(orgId, param(req, "businessId"), body as Parameters<Api["lifecyclePolicy"]["create"]>[2]);
    })
  );
  v1.get(
    "/businesses/:businessId/lifecycle-policies",
    wrap(async (req) => api.lifecyclePolicy.list(await requireOrgId(req), param(req, "businessId")))
  );
  v1.get(
    "/businesses/:businessId/lifecycle-policies/:policyId",
    wrap(async (req) => api.lifecyclePolicy.getById(await requireOrgId(req), param(req, "policyId")))
  );
  v1.patch(
    "/businesses/:businessId/lifecycle-policies/:policyId",
    wrap(async (req) => api.lifecyclePolicy.update(await requireOrgId(req), param(req, "policyId"), validate(UpdateLifecyclePolicySchema, req.body)))
  );
  v1.delete(
    "/businesses/:businessId/lifecycle-policies/:policyId",
    wrap(async (req) => {
      await api.lifecyclePolicy.delete(await requireOrgId(req), param(req, "policyId"));
      return { deleted: true };
    })
  );

  // ── Analytics routes ──────────────────────────────────────────────────────
  v1.get(
    "/businesses/:businessId/analytics",
    wrap(async (req) => api.analytics.getBusinessAnalytics(await requireOrgId(req), param(req, "businessId")))
  );

  // ── Search Platform routes ─────────────────────────────────────────────────
  v1.post(
    "/search",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const { entity, businessId, q, filters, sort, cursor, limit } = req.body as {
        entity: string;
        businessId?: string;
        q?: string;
        filters?: unknown[];
        sort?: unknown[];
        cursor?: string;
        limit?: number;
      };
      return api.search.search({ orgId, entity, businessId, q, filters: filters as never, sort: sort as never, cursor, limit });
    })
  );
  v1.get(
    "/search/entities",
    wrap(async (_req) => ({ entities: api.search.registeredEntities() }))
  );
  v1.post(
    "/search/saved",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const body = validate(SaveSearchSchema, req.body);
      return api.search.saveSearch({ ...body, orgId } as Parameters<typeof api.search.saveSearch>[0]);
    })
  );
  v1.get(
    "/search/saved",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const { businessId, entity } = req.query as { businessId: string; entity: string };
      return api.search.listSavedSearches(orgId, businessId, entity);
    })
  );
  v1.post(
    "/search/saved/:savedSearchId/run",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const { businessId, cursor } = req.query as { businessId: string; cursor?: string };
      return api.search.runSavedSearch(param(req, "savedSearchId"), orgId, businessId, cursor);
    })
  );

  // ── Communication Platform routes ─────────────────────────────────────────
  v1.post(
    "/businesses/:businessId/notifications/send",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const errors = validateSafe(SendNotificationSchema, req.body);
      if (errors) throw new ApiError(400, "validation_error", errors.join("; "));
      const body = validate(SendNotificationSchema, req.body);
      return api.communication.send({ orgId, businessId: param(req, "businessId"), recipient: body.recipient, channel: body.channel as never, templateKey: body.templateKey, subject: body.subject, body: body.body });
    })
  );
  v1.post(
    "/businesses/:businessId/notifications/send-template",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const { templateKey, recipient, vars } = req.body as { templateKey: string; recipient: string; vars: Record<string, unknown> };
      return api.communication.sendTemplate(templateKey, orgId, param(req, "businessId"), recipient, vars ?? {});
    })
  );
  v1.get(
    "/businesses/:businessId/notifications/history",
    wrap(async (req) => {
      const orgId = await requireOrgId(req);
      const limit = req.query["limit"] ? Number(req.query["limit"]) : 50;
      return api.communication.deliveryHistory(orgId, param(req, "businessId"), limit);
    })
  );
  v1.get(
    "/notifications/templates",
    wrap(async (_req) => ({ templates: api.communication.listTemplates() }))
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
