/**
 * Goal 21 — Autonomous Business Operating Loop: End-to-End Certification Tests
 * Tests the complete Observe→Analyze→Decide→Plan→Execute→Verify→Learn→Improve cycle.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { installGeneralSmbPack } from "@boss/industry-pack-general-smb";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createBusinessMriService } from "../services/businessMriService.js";
import { createBusinessDnaService } from "../services/businessDnaService.js";
import { createBusinessHealthService } from "../services/businessHealthService.js";
import { createBusinessConstraintService } from "../services/businessConstraintService.js";
import { createBusinessRecommendationService } from "../services/businessRecommendationService.js";
import { createBusinessOperatingLoopService } from "../services/businessOperatingLoopService.js";
import { createExecutionPlanService } from "../services/executionPlanService.js";
import { createOutcomeVerificationService } from "../services/outcomeVerificationService.js";
import { createKpiMeasurementService } from "../services/kpiMeasurementService.js";
import {
  operatingLoopRegistry,
  planningRegistry,
  verificationRegistry,
  optimizationRegistry,
  learningRegistry,
} from "@boss/registries";
import { createExecutionPlan, verifyOutcome } from "@boss/mcp";
import type { RepositoryContainer } from "../container.js";
import { nowIso } from "@boss/shared";

const ORG_ID = "org-test-goal21";

// Ensure pack is installed for registry tests (createInMemoryContainer also calls this,
// but registry-only describe blocks run before any container is instantiated).
installGeneralSmbPack();

async function fullSetup(repos: RepositoryContainer) {
  const profileSvc = createBusinessProfileService(repos);
  const { business } = await profileSvc.createBusiness({
    orgId: ORG_ID,
    name: "Goal21 Operating Loop Co.",
    industry: "retail",
    employeeCount: 12,
    annualRevenue: 600000,
    businessType: "retail",
    yearsOperating: 6,
    locationCount: 2,
    businessHours: "Mon-Fri 9-6",
  });

  const mriSvc = createBusinessMriService(repos);
  const mri = await mriSvc.startMri(ORG_ID, business.id);
  await mriSvc.answer(ORG_ID, mri.id, { sectionKey: "identity", questionKey: "identity.employees", value: 12 });
  await mriSvc.answer(ORG_ID, mri.id, { sectionKey: "sales", questionKey: "sales.follow_up_process", value: "manual" });
  await mriSvc.answer(ORG_ID, mri.id, { sectionKey: "operations", questionKey: "operations.scheduling", value: "spreadsheet" });
  await mriSvc.answer(ORG_ID, mri.id, { sectionKey: "technology", questionKey: "technology.crm", value: false });
  await mriSvc.answer(ORG_ID, mri.id, { sectionKey: "goals", questionKey: "goals.priorities", value: ["growth", "automation"] });
  await mriSvc.completeSection(ORG_ID, mri.id, "identity");
  const completedMri = await mriSvc.completeMri(ORG_ID, mri.id);

  await createBusinessDnaService(repos).generate(ORG_ID, business.id, completedMri.id);
  await createBusinessHealthService(repos).generate(ORG_ID, business.id, completedMri.id);
  await createBusinessConstraintService(repos).analyze(ORG_ID, business.id, completedMri.id);
  await createBusinessRecommendationService(repos).analyze(ORG_ID, business.id);

  return { business, mri: completedMri };
}

async function makeDecision(repos: RepositoryContainer, businessId: string) {
  return repos.businessDecisions.create({
    orgId: ORG_ID,
    businessId,
    decisionType: "operational",
    objective: "Automate lead follow-up to increase conversion",
    context: "Manual processes causing 48h average response time",
    supportingRecommendationIds: [],
    supportingConstraintIds: [],
    appliedPolicyKeys: [],
    options: [],
    selectedOptionKey: "automate_crm_follow_up",
    expectedImpact: { revenueImpact: 25000, costImpact: 500, profitImpact: 24500, operationalImpact: "medium", customerImpact: "low", riskLevel: "low", affectedDomains: [], estimatedTimelineDays: 14 },
    expectedRoi: 25,
    expectedCost: 500,
    confidenceScore: 0.85,
    status: "generated",
    approvedAt: null,
    rejectedAt: null,
    completedAt: null,
    measuredAt: null,
    actualRoi: null,
    lessonsLearned: null,
    executiveSummary: null,
    generatedWorkflowId: null,
  });
}

describe("Goal 21 — Registry Layer (Workstream 6)", () => {
  it("operatingLoopRegistry contains seeded entries", () => {
    const loops = operatingLoopRegistry.list();
    expect(loops.length).toBeGreaterThanOrEqual(3);
    const daily = operatingLoopRegistry.get("standard_daily_loop");
    expect(daily).toBeDefined();
    expect(daily!.frequency).toBe("daily");
    expect(daily!.phases).toHaveLength(8);
    expect(daily!.autoApproveThreshold).toBeGreaterThan(0);
  });

  it("planningRegistry contains seeded templates with milestones", () => {
    const plans = planningRegistry.list();
    expect(plans.length).toBeGreaterThanOrEqual(3);
    const revenue = planningRegistry.get("revenue_recovery_plan");
    expect(revenue).toBeDefined();
    expect(revenue!.milestones.length).toBeGreaterThanOrEqual(3);
    expect(revenue!.defaultOwnerRole).toBe("owner");
    expect(revenue!.rollbackStrategyTemplate.length).toBeGreaterThan(10);
  });

  it("verificationRegistry contains seeded templates", () => {
    const verifications = verificationRegistry.list();
    expect(verifications.length).toBeGreaterThanOrEqual(5);
    const kpiVerif = verificationRegistry.get("revenue_kpi_verification");
    expect(kpiVerif).toBeDefined();
    expect(kpiVerif!.method).toBe("kpi_delta");
    expect(kpiVerif!.successThresholdPct).toBe(5);
    expect(kpiVerif!.minConfidence).toBeGreaterThan(0);
  });

  it("optimizationRegistry contains seeded recommendations", () => {
    const opts = optimizationRegistry.list();
    expect(opts.length).toBeGreaterThanOrEqual(7);
    const automate = optimizationRegistry.get("automate_lead_follow_up");
    expect(automate).toBeDefined();
    expect(automate!.domain).toBe("automation");
    expect(automate!.priority).toBe("high");
    expect(automate!.estimatedImpactPct).toBeGreaterThan(0);
  });

  it("learningRegistry contains seeded patterns", () => {
    const learnings = learningRegistry.list();
    expect(learnings.length).toBeGreaterThanOrEqual(6);
    const success = learningRegistry.get("lead_response_success_pattern");
    expect(success).toBeDefined();
    expect(success!.patternType).toBe("success_pattern");
    expect(success!.minOccurrences).toBeGreaterThanOrEqual(1);
  });
});

describe("Goal 21 — Planning Engine (MCP Intelligence)", () => {
  it("creates execution plan from decision with tasks and milestones", async () => {
    const repos = createInMemoryContainer();
    const { business } = await fullSetup(repos);
    const decision = await makeDecision(repos, business.id);

    const plan = createExecutionPlan(decision, nowIso());
    expect(plan.decisionId).toBe(decision.id);
    expect(plan.tasks.length).toBeGreaterThanOrEqual(1);
    expect(plan.milestones.length).toBeGreaterThanOrEqual(1);
    expect(plan.durationDays).toBeGreaterThan(0);
    expect(plan.rollbackStrategy.length).toBeGreaterThan(10);
    expect(plan.successMetrics.length).toBeGreaterThanOrEqual(1);
  });

  it("plan maps decisionType=strategic to revenue_recovery_plan", async () => {
    const repos = createInMemoryContainer();
    const { business } = await fullSetup(repos);
    const decision = await repos.businessDecisions.create({
      orgId: ORG_ID,
      businessId: business.id,
      decisionType: "strategic",
      objective: "Grow revenue by 20% this quarter",
      context: "Revenue has declined for 3 months",
      supportingRecommendationIds: [],
      supportingConstraintIds: [],
      appliedPolicyKeys: [],
      options: [],
      selectedOptionKey: null,
      expectedImpact: { revenueImpact: 50000, costImpact: 5000, profitImpact: 45000, operationalImpact: "low", customerImpact: "low", riskLevel: "medium", affectedDomains: [], estimatedTimelineDays: 30 },
      expectedRoi: 20,
      expectedCost: 5000,
      confidenceScore: 0.90,
      status: "generated",
      approvedAt: null,
      rejectedAt: null,
      completedAt: null,
      measuredAt: null,
      actualRoi: null,
      lessonsLearned: null,
      executiveSummary: null,
      generatedWorkflowId: null,
    });

    const plan = createExecutionPlan(decision, nowIso());
    expect(plan.planKey).toBe("revenue_recovery_plan");
    expect(plan.ownerRole).toBe("owner");
  });

  it("plan for technology decision maps to operational_efficiency_plan", async () => {
    const repos = createInMemoryContainer();
    const { business } = await fullSetup(repos);
    const decision = await repos.businessDecisions.create({
      orgId: ORG_ID,
      businessId: business.id,
      decisionType: "technology",
      objective: "Automate expense tracking",
      context: "Manual bookkeeping taking 8 hrs/week",
      supportingRecommendationIds: [],
      supportingConstraintIds: [],
      appliedPolicyKeys: [],
      options: [],
      selectedOptionKey: null,
      expectedImpact: { revenueImpact: 0, costImpact: 5000, profitImpact: 5000, operationalImpact: "high", customerImpact: "low", riskLevel: "low", affectedDomains: [], estimatedTimelineDays: 14 },
      expectedRoi: 60,
      expectedCost: 200,
      confidenceScore: 0.78,
      status: "generated",
      approvedAt: null,
      rejectedAt: null,
      completedAt: null,
      measuredAt: null,
      actualRoi: null,
      lessonsLearned: null,
      executiveSummary: null,
      generatedWorkflowId: null,
    });

    const plan = createExecutionPlan(decision, nowIso());
    expect(plan.planKey).toBe("operational_efficiency_plan");
  });
});

describe("Goal 21 — Verification Engine (MCP Intelligence)", () => {
  it("returns a valid status when KPI readings exist", async () => {
    const repos = createInMemoryContainer();
    const { business } = await fullSetup(repos);
    const decision = await makeDecision(repos, business.id);

    const baseline = [{ kpiKey: "workflow_completion_rate", label: "Workflow Completion Rate", value: 80, unit: "%", measuredAt: nowIso(), source: "health_score" as const, trend: "stable" as const }];
    const current = [{ kpiKey: "workflow_completion_rate", label: "Workflow Completion Rate", value: 95, unit: "%", measuredAt: nowIso(), source: "health_score" as const, trend: "up" as const }];

    const result = verifyOutcome(decision, baseline, current, nowIso());
    expect(result.decisionId).toBe(decision.id);
    expect(["success", "partial", "failure", "insufficient_data"]).toContain(result.status);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.summary.length).toBeGreaterThan(10);
  });

  it("returns insufficient_data when no baseline or current readings exist", async () => {
    const repos = createInMemoryContainer();
    const { business } = await fullSetup(repos);
    const decision = await makeDecision(repos, business.id);
    const result = verifyOutcome(decision, [], [], nowIso());
    expect(result.status).toBe("insufficient_data");
    expect(result.confidence).toBe(0);
  });
});

describe("Goal 21 — Execution Plan Service (API Layer)", () => {
  let repos: RepositoryContainer;
  let executionPlan: ReturnType<typeof createExecutionPlanService>;
  let businessId: string;

  beforeEach(async () => {
    repos = createInMemoryContainer();
    executionPlan = createExecutionPlanService(repos);
    const { business } = await fullSetup(repos);
    businessId = business.id;
  });

  it("creates and retrieves an execution plan", async () => {
    const decision = await makeDecision(repos, businessId);
    const plan = await executionPlan.createPlan(ORG_ID, businessId, decision.id);
    expect(plan.decisionId).toBe(decision.id);
    expect(plan.tasks.length).toBeGreaterThanOrEqual(1);

    const retrieved = await executionPlan.getPlan(ORG_ID, businessId, decision.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.decisionId).toBe(decision.id);
  });

  it("throws when decision not found", async () => {
    await expect(executionPlan.createPlan(ORG_ID, businessId, "nonexistent-id")).rejects.toThrow("not found");
  });

  it("emits business.plan.created event", async () => {
    const events: string[] = [];
    repos.eventBus.subscribe("business.plan.created", () => events.push("plan_created"));
    const decision = await makeDecision(repos, businessId);
    await executionPlan.createPlan(ORG_ID, businessId, decision.id);
    expect(events).toContain("plan_created");
  });
});

describe("Goal 21 — Outcome Verification Service (API Layer)", () => {
  it("verifies outcome and emits two events", async () => {
    const repos = createInMemoryContainer();
    const { business } = await fullSetup(repos);

    const events: string[] = [];
    repos.eventBus.subscribe("business.outcome.verified", () => events.push("outcome_verified"));
    repos.eventBus.subscribe("business.learning.recorded", () => events.push("learning_recorded"));

    const decision = await makeDecision(repos, business.id);
    const svc = createOutcomeVerificationService(repos);
    const result = await svc.verify(ORG_ID, business.id, decision.id);

    expect(result.decisionId).toBe(decision.id);
    expect(["success", "partial", "failure", "insufficient_data"]).toContain(result.status);
    expect(events).toContain("outcome_verified");
    expect(events).toContain("learning_recorded");
  });

  it("stores verification in memory and retrieves it", async () => {
    const repos = createInMemoryContainer();
    const { business } = await fullSetup(repos);
    const decision = await makeDecision(repos, business.id);
    const svc = createOutcomeVerificationService(repos);
    await svc.verify(ORG_ID, business.id, decision.id);

    const stored = await svc.getVerification(ORG_ID, business.id, decision.id);
    expect(stored).not.toBeNull();
    expect(stored!.decisionId).toBe(decision.id);
  });
});

describe("Goal 21 — Business Operating Loop (End-to-End)", () => {
  it("runs full 8-phase loop with health data", async () => {
    const repos = createInMemoryContainer();
    const { business } = await fullSetup(repos);

    const svc = createBusinessOperatingLoopService(repos);
    const result = await svc.run(ORG_ID, business.id);

    expect(result.orgId).toBe(ORG_ID);
    expect(result.businessId).toBe(business.id);
    expect(result.runId).toMatch(/^loop_[0-9a-f-]+$/);
    expect(result.phases).toHaveLength(8);
    expect(result.kpiReadings.length).toBeGreaterThan(0);
    expect(result.completedAt).toBeTruthy();

    const phaseNames = result.phases.map((p) => p.phase);
    expect(phaseNames).toContain("observe");
    expect(phaseNames).toContain("analyze");
    expect(phaseNames).toContain("decide");
    expect(phaseNames).toContain("plan");
    expect(phaseNames).toContain("execute");
    expect(phaseNames).toContain("verify");
    expect(phaseNames).toContain("learn");
    expect(phaseNames).toContain("improve");
  });

  it("emits business.loop.completed event", async () => {
    const repos = createInMemoryContainer();
    const { business } = await fullSetup(repos);

    const events: string[] = [];
    repos.eventBus.subscribe("business.loop.completed", () => events.push("loop_completed"));

    const svc = createBusinessOperatingLoopService(repos);
    await svc.run(ORG_ID, business.id);

    expect(events).toContain("loop_completed");
  });

  it("skips decision+plan phases when health is missing", async () => {
    const repos = createInMemoryContainer();
    // Only create a business profile — no health data
    const profileSvc = createBusinessProfileService(repos);
    const { business } = await profileSvc.createBusiness({
      orgId: ORG_ID,
      name: "No Health Co.",
      industry: "retail",
      employeeCount: 5,
      annualRevenue: 50000,
      businessType: "retail",
      yearsOperating: 1,
      locationCount: 1,
      businessHours: "Mon-Fri 9-5",
    });

    const svc = createBusinessOperatingLoopService(repos);
    const result = await svc.run(ORG_ID, business.id);

    const decide = result.phases.find((p) => p.phase === "decide");
    const plan = result.phases.find((p) => p.phase === "plan");
    expect(decide?.status).toBe("skipped");
    expect(plan?.status).toBe("skipped");
    expect(result.decisionsGenerated).toBe(0);
  });

  it("observe phase captures business signals", async () => {
    const repos = createInMemoryContainer();
    const { business } = await fullSetup(repos);

    const svc = createBusinessOperatingLoopService(repos);
    const result = await svc.run(ORG_ID, business.id);

    const observe = result.phases.find((p) => p.phase === "observe");
    expect(observe?.status).toBe("completed");
    expect(observe?.summary).toContain("constraint");
  });

  it("analyze phase derives KPI readings", async () => {
    const repos = createInMemoryContainer();
    const { business } = await fullSetup(repos);

    const svc = createBusinessOperatingLoopService(repos);
    const result = await svc.run(ORG_ID, business.id);

    expect(result.kpiReadings.length).toBeGreaterThan(0);
    const analyze = result.phases.find((p) => p.phase === "analyze");
    expect(analyze?.status).toBe("completed");
    expect(analyze?.summary).toContain("KPI readings");
  });

  it("loop is idempotent — multiple runs produce independent results", async () => {
    const repos = createInMemoryContainer();
    const { business } = await fullSetup(repos);

    const svc = createBusinessOperatingLoopService(repos);
    const run1 = await svc.run(ORG_ID, business.id);
    const run2 = await svc.run(ORG_ID, business.id);

    expect(run1.phases).toHaveLength(8);
    expect(run2.phases).toHaveLength(8);
    expect(run1.runId).not.toBe(run2.runId);
    expect(run1.kpiReadings.length).toBeGreaterThan(0);
    expect(run2.kpiReadings.length).toBeGreaterThan(0);
  });
});

describe("Goal 21 — KPI Measurement Service Integration", () => {
  it("derives KPI readings with health score and emits measurement event", async () => {
    const repos = createInMemoryContainer();
    const { business } = await fullSetup(repos);

    const events: string[] = [];
    repos.eventBus.subscribe("business.kpi.measured", () => events.push("kpi_measured"));

    const svc = createKpiMeasurementService(repos);
    const result = await svc.measure(ORG_ID, business.id);

    expect(result.readings.length).toBeGreaterThan(0);
    expect(result.measuredAt).toBeTruthy();
    expect(events).toContain("kpi_measured");

    const healthReading = result.readings.find((r) => r.kpiKey === "business_health_score");
    expect(healthReading?.value).not.toBeNull();
  });
});
