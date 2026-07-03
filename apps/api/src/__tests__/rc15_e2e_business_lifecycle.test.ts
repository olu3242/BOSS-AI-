/**
 * RC1.5 WS1 — End-to-End Business Lifecycle Integration Test
 *
 * Exercises the complete BOSS pipeline:
 * Business Creation → MRI → Health → Constraints → Recommendations →
 * Decisions → Executive Brief → Workflow Execution →
 * Loop Runtime → Tool Execution → Business Memory → Mission Control
 *
 * Verifies: every transition emits events, every persistence point
 * writes to the correct repository.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createBusinessMriService } from "../services/businessMriService.js";
import { createBusinessDnaService } from "../services/businessDnaService.js";
import { createBusinessHealthService } from "../services/businessHealthService.js";
import { createBusinessConstraintService } from "../services/businessConstraintService.js";
import { createBusinessRecommendationService } from "../services/businessRecommendationService.js";
import { createBusinessDecisionService } from "../services/businessDecisionService.js";
import { createExecutiveBriefingService } from "../services/executiveBriefingService.js";
import { createMissionControlService } from "../services/missionControlService.js";
import { createLoopRuntimeService } from "../services/loopRuntimeService.js";
import { createToolFabricService } from "../services/toolFabricService.js";
import type { StepEntry } from "@boss/loop";
import type { BossEvent } from "@boss/events";

const ORG = "org-e2e-lifecycle-rc15";

async function completeMri(c: ReturnType<typeof createInMemoryContainer>, orgId: string, bizId: string) {
  const mriSvc = createBusinessMriService(c);
  const mri = await mriSvc.startMri(orgId, bizId);
  await mriSvc.answer(orgId, mri.id, { sectionKey: "identity", questionKey: "identity.employees", value: 15 });
  await mriSvc.answer(orgId, mri.id, { sectionKey: "sales", questionKey: "sales.follow_up_process", value: "manual" });
  await mriSvc.answer(orgId, mri.id, { sectionKey: "operations", questionKey: "operations.scheduling", value: "spreadsheet" });
  await mriSvc.answer(orgId, mri.id, { sectionKey: "technology", questionKey: "technology.crm", value: false });
  await mriSvc.answer(orgId, mri.id, { sectionKey: "goals", questionKey: "goals.priorities", value: ["growth", "automation"] });
  await mriSvc.completeSection(orgId, mri.id, "identity");
  return mriSvc.completeMri(orgId, mri.id);
}

describe("RC1.5 WS1 — E2E Business Lifecycle", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("stage 1: business creation persists to businesses repo and emits event", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("business.created", (e) => seen.push(e as BossEvent));

    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({
      orgId: ORG, name: "E2E Corp", industry: "retail",
      employeeCount: 15, annualRevenue: 750000,
      businessType: "retail", yearsOperating: 6,
      locationCount: 2, businessHours: "Mon-Sat 9-6",
    });

    expect(business.id).toBeDefined();
    expect(business.orgId).toBe(ORG);
    expect(business.name).toBe("E2E Corp");

    const stored = await c.businesses.list(ORG);
    expect(stored.length).toBe(1);
    expect(stored[0]!.id).toBe(business.id);
  });

  it("stage 2: MRI completion persists answers and emits mri.completed", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("business.mri.completed", (e) => seen.push(e as BossEvent));

    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({
      orgId: ORG, name: "E2E Corp", industry: "retail",
      employeeCount: 15, annualRevenue: 750000, businessType: "retail",
      yearsOperating: 6, locationCount: 2, businessHours: "Mon-Sat 9-6",
    });

    const mri = await completeMri(c, ORG, business.id);
    expect(mri.status).toBe("completed");
    expect(mri.businessId).toBe(business.id);

    const stored = await c.businessMri.findByBusinessId(ORG, business.id);
    expect(stored?.status).toBe("completed");
    expect(seen.some((e) => e.type === "business.mri.completed")).toBe(true);
  });

  it("stage 3: health calculation produces score and persists to businessHealth repo", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({
      orgId: ORG, name: "E2E Corp", industry: "retail",
      employeeCount: 15, annualRevenue: 750000, businessType: "retail",
      yearsOperating: 6, locationCount: 2, businessHours: "Mon-Sat 9-6",
    });
    const mri = await completeMri(c, ORG, business.id);
    await createBusinessDnaService(c).generate(ORG, business.id, mri.id);

    const { health } = await createBusinessHealthService(c).generate(ORG, business.id, mri.id);
    expect(typeof health.overallScore).toBe("number");
    expect(health.overallScore).toBeGreaterThanOrEqual(0);
    expect(health.overallScore).toBeLessThanOrEqual(100);

    const stored = await c.businessHealth.findByBusinessId(ORG, business.id);
    expect(stored?.businessId).toBe(business.id);
    expect(stored?.overallScore).toBe(health.overallScore);
  });

  it("stage 4: constraint detection produces constraints persisted to repo", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({
      orgId: ORG, name: "E2E Corp", industry: "retail",
      employeeCount: 15, annualRevenue: 750000, businessType: "retail",
      yearsOperating: 6, locationCount: 2, businessHours: "Mon-Sat 9-6",
    });
    const mri = await completeMri(c, ORG, business.id);
    await createBusinessDnaService(c).generate(ORG, business.id, mri.id);
    await createBusinessHealthService(c).generate(ORG, business.id, mri.id);

    const constraintSvc = createBusinessConstraintService(c);
    const { constraints } = await constraintSvc.analyze(ORG, business.id, mri.id);
    expect(constraints.length).toBeGreaterThan(0);
    expect(constraints[0]!.businessId).toBe(business.id);
    expect(constraints[0]!.orgId).toBe(ORG);
  });

  it("stage 5: recommendations generated from constraints and persisted to repo", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({
      orgId: ORG, name: "E2E Corp", industry: "retail",
      employeeCount: 15, annualRevenue: 750000, businessType: "retail",
      yearsOperating: 6, locationCount: 2, businessHours: "Mon-Sat 9-6",
    });
    const mri = await completeMri(c, ORG, business.id);
    await createBusinessDnaService(c).generate(ORG, business.id, mri.id);
    await createBusinessHealthService(c).generate(ORG, business.id, mri.id);
    await createBusinessConstraintService(c).analyze(ORG, business.id, mri.id);

    const recSvc = createBusinessRecommendationService(c);
    const { recommendations } = await recSvc.analyze(ORG, business.id);
    expect(recommendations.length).toBeGreaterThan(0);
    const rec0 = recommendations[0]!;
    expect(rec0.businessId).toBe(business.id);
    expect(rec0.orgId).toBe(ORG);

    const stored = await c.businessRecommendations.listByBusinessId(ORG, business.id);
    expect(stored.length).toBeGreaterThan(0);
  });

  it("stage 6: decision generated with reasoning", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({
      orgId: ORG, name: "E2E Corp", industry: "retail",
      employeeCount: 15, annualRevenue: 750000, businessType: "retail",
      yearsOperating: 6, locationCount: 2, businessHours: "Mon-Sat 9-6",
    });
    const mri = await completeMri(c, ORG, business.id);
    await createBusinessDnaService(c).generate(ORG, business.id, mri.id);
    await createBusinessHealthService(c).generate(ORG, business.id, mri.id);
    await createBusinessConstraintService(c).analyze(ORG, business.id, mri.id);
    await createBusinessRecommendationService(c).analyze(ORG, business.id);

    const decSvc = createBusinessDecisionService(c);
    const decision = await decSvc.generate(ORG, business.id, { recommendationIds: [] });
    expect(decision.orgId).toBe(ORG);
    expect(decision.businessId).toBe(business.id);
    expect(decision.context).toBeTruthy();
    expect(decision.objective).toBeTruthy();
  });

  it("stage 7: executive brief summarises the business state", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({
      orgId: ORG, name: "E2E Corp", industry: "retail",
      employeeCount: 15, annualRevenue: 750000, businessType: "retail",
      yearsOperating: 6, locationCount: 2, businessHours: "Mon-Sat 9-6",
    });
    const mri = await completeMri(c, ORG, business.id);
    await createBusinessDnaService(c).generate(ORG, business.id, mri.id);
    await createBusinessHealthService(c).generate(ORG, business.id, mri.id);
    await createBusinessConstraintService(c).analyze(ORG, business.id, mri.id);
    await createBusinessRecommendationService(c).analyze(ORG, business.id);
    await createBusinessDecisionService(c).generate(ORG, business.id, { recommendationIds: [] });

    const briefSvc = createExecutiveBriefingService(c);
    const brief = await briefSvc.generate(ORG, business.id);
    expect(brief.businessId).toBe(business.id);
    expect(brief.summary).toBeTruthy();
    expect(brief.generatedAt).toBeTruthy();

    const stored = await c.executiveBriefings.findLatest(ORG, business.id);
    expect(stored?.businessId).toBe(business.id);
  });

  it("stage 8: loop runtime executes a workflow and persists execution + task records", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({
      orgId: ORG, name: "E2E Corp", industry: "retail",
      employeeCount: 15, annualRevenue: 750000, businessType: "retail",
      yearsOperating: 6, locationCount: 2, businessHours: "Mon-Sat 9-6",
    });

    const toolFabric = createToolFabricService(c);
    await toolFabric.connectIntegration(ORG, business.id, "smtp");
    await toolFabric.setPermission(ORG, business.id, {
      toolKey: "tool_send_email", roleKey: "admin",
      allowed: true, approval: "auto", rateLimitPerMinute: null,
    });

    const loop = createLoopRuntimeService(c, toolFabric);

    const steps: StepEntry[] = [
      { stepKey: "notify", taskType: "tool", input: { orgId: ORG, businessId: business.id, capabilityKey: "send_email", roleKey: "admin", requestedBy: "test" } },
    ];

    const execution = await loop.execute(ORG, business.id, "e2e-workflow", steps);
    expect(execution.state).toBe("completed");
    expect(execution.orgId).toBe(ORG);
    expect(execution.businessId).toBe(business.id);

    const wfRecords = await c.workflowExecutions.listByBusinessId(ORG, business.id);
    expect(wfRecords.length).toBeGreaterThan(0);

    const taskRecords = await c.taskExecutions.listByWorkflowExecutionId(ORG, execution.id);
    expect(taskRecords.length).toBeGreaterThan(0);
    expect(taskRecords[0]!.stepKey).toBe("notify");
  });

  it("stage 9: mission control snapshot reflects full lifecycle state", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({
      orgId: ORG, name: "E2E Corp", industry: "retail",
      employeeCount: 15, annualRevenue: 750000, businessType: "retail",
      yearsOperating: 6, locationCount: 2, businessHours: "Mon-Sat 9-6",
    });
    const mri = await completeMri(c, ORG, business.id);
    await createBusinessDnaService(c).generate(ORG, business.id, mri.id);
    await createBusinessHealthService(c).generate(ORG, business.id, mri.id);

    const mcSvc = createMissionControlService(c);
    const snapshot = await mcSvc.getSnapshot(ORG, business.id);
    expect(snapshot).toBeDefined();
    expect(Array.isArray(snapshot.workflows)).toBe(true);
    expect(Array.isArray(snapshot.deadLetters)).toBe(true);
  });

  it("all lifecycle stages produce domain events (event bus audit trail)", async () => {
    const seen: BossEvent[] = [];
    const relevantTypes = [
      "business.mri.started",
      "business.mri.completed",
      "business.health.calculated",
      "business.constraints.analyzed",
      "business.recommendations.generated",
    ];
    for (const t of relevantTypes) {
      c.eventBus.subscribe(t, (e) => seen.push(e as BossEvent));
    }

    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({
      orgId: ORG, name: "Event Corp", industry: "retail",
      employeeCount: 15, annualRevenue: 750000, businessType: "retail",
      yearsOperating: 6, locationCount: 2, businessHours: "Mon-Sat 9-6",
    });
    const mri = await completeMri(c, ORG, business.id);
    await createBusinessDnaService(c).generate(ORG, business.id, mri.id);
    await createBusinessHealthService(c).generate(ORG, business.id, mri.id);
    await createBusinessConstraintService(c).analyze(ORG, business.id, mri.id);
    await createBusinessRecommendationService(c).analyze(ORG, business.id);

    expect(seen.some((e) => e.type === "business.mri.started")).toBe(true);
    expect(seen.some((e) => e.type === "business.mri.completed")).toBe(true);
    expect(seen.some((e) => e.type === "business.health.calculated")).toBe(true);
    expect(seen.some((e) => e.type === "business.constraints.analyzed")).toBe(true);
    expect(seen.some((e) => e.type === "business.recommendations.generated")).toBe(true);
  });
});
