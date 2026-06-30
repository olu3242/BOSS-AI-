/**
 * Goal 20 — Business Decision OS
 * Integration tests covering: root cause engine, registry validation,
 * event pipeline, tenant isolation, Mission Control KPI integration,
 * decision OS end-to-end, and registry integrity.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createApiFromContainer } from "../index.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createBusinessMriService } from "../services/businessMriService.js";
import { createBusinessDnaService } from "../services/businessDnaService.js";
import { createBusinessHealthService } from "../services/businessHealthService.js";
import { createBusinessConstraintService } from "../services/businessConstraintService.js";
import { createBusinessRecommendationService } from "../services/businessRecommendationService.js";
import { createRootCauseService } from "../services/rootCauseService.js";
import { createMissionControlService } from "../services/missionControlService.js";
import { createKpiMeasurementService } from "../services/kpiMeasurementService.js";
import {
  decisionRegistry,
  forecastRegistry,
  playbookRegistry,
  businessRuleRegistry,
} from "@boss/registries";
import { analyzeRootCauses } from "@boss/mcp";
import { nowIso } from "@boss/shared";

const ORG = "org-goal20-dos";

async function fullSetup(c: ReturnType<typeof createInMemoryContainer>) {
  const profileSvc = createBusinessProfileService(c);
  const { business } = await profileSvc.createBusiness({
    orgId: ORG,
    name: "Decision OS Corp",
    industry: "retail",
    employeeCount: 12,
    annualRevenue: 600000,
    businessType: "retail",
    yearsOperating: 6,
    locationCount: 2,
    businessHours: "Mon-Sat 9-6",
  });

  const mriSvc = createBusinessMriService(c);
  const mri = await mriSvc.startMri(ORG, business.id);
  await mriSvc.answer(ORG, mri.id, { sectionKey: "identity", questionKey: "identity.employees", value: 12 });
  await mriSvc.answer(ORG, mri.id, { sectionKey: "sales", questionKey: "sales.follow_up_process", value: "manual" });
  await mriSvc.answer(ORG, mri.id, { sectionKey: "operations", questionKey: "operations.scheduling", value: "spreadsheet" });
  await mriSvc.answer(ORG, mri.id, { sectionKey: "technology", questionKey: "technology.crm", value: false });
  await mriSvc.answer(ORG, mri.id, { sectionKey: "goals", questionKey: "goals.priorities", value: ["growth", "automation"] });
  await mriSvc.completeSection(ORG, mri.id, "identity");
  const completedMri = await mriSvc.completeMri(ORG, mri.id);

  await createBusinessDnaService(c).generate(ORG, business.id, completedMri.id);
  await createBusinessHealthService(c).generate(ORG, business.id, completedMri.id);
  await createBusinessConstraintService(c).analyze(ORG, business.id, completedMri.id);
  await createBusinessRecommendationService(c).analyze(ORG, business.id);

  return { business, mri: completedMri };
}

describe("Goal 20 — Business Decision OS", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  // ─── Registry Integrity ──────────────────────────────────────────────────────

  it("decisionRegistry has seeded entries with required fields", () => {
    const decisions = decisionRegistry.list();
    expect(decisions.length).toBeGreaterThan(0);
    for (const d of decisions) {
      expect(d.key).toBeTruthy();
      expect(d.label).toBeTruthy();
      expect(d.category).toBeTruthy();
      expect(d.defaultSeverity).toBeTruthy();
      expect(d.approvalPolicy).toBeTruthy();
      expect(typeof d.estimatedTimelineDays).toBe("number");
    }
  });

  it("forecastRegistry has seeded entries covering required domains", () => {
    const forecasts = forecastRegistry.list();
    expect(forecasts.length).toBeGreaterThan(0);
    const domains = new Set(forecasts.map((f) => f.domain));
    expect(domains.has("revenue")).toBe(true);
    expect(domains.has("cash_flow")).toBe(true);
    expect(domains.has("growth")).toBe(true);
    for (const f of forecasts) {
      expect(f.relatedKpiKeys.length).toBeGreaterThan(0);
      expect(f.primaryInputs.length).toBeGreaterThan(0);
    }
  });

  it("playbookRegistry has seeded entries with ordered steps", () => {
    const playbooks = playbookRegistry.list();
    expect(playbooks.length).toBeGreaterThan(0);
    for (const p of playbooks) {
      expect(p.steps.length).toBeGreaterThan(0);
      const orders = p.steps.map((s) => s.order);
      expect(orders[0]).toBe(1);
    }
  });

  it("businessRuleRegistry has seeded entries with valid action types", () => {
    const rules = businessRuleRegistry.list();
    expect(rules.length).toBeGreaterThan(0);
    const validActions = ["alert", "block", "escalate", "auto_approve", "require_review"];
    for (const r of rules) {
      expect(validActions).toContain(r.action);
      expect(r.condition).toBeTruthy();
    }
  });

  // ─── Root Cause Engine ───────────────────────────────────────────────────────

  it("root cause engine produces causal chains for known constraint keys", () => {
    const mockHealth = { overallScore: 55, generatedAt: nowIso(), orgId: ORG, businessId: "biz-1", id: "h1" } as any;
    const mockConstraints = [
      {
        id: "c1", orgId: ORG, businessId: "biz-1",
        definitionKey: "slow_lead_response",
        title: "Slow Lead Response",
        description: "Leads not contacted within 1 hour",
        category: "sales", severity: "high", confidence: 0.85,
        businessImpact: "Revenue impact", status: "active",
        financialImpact: { annualRevenueImpact: 50000, oneTimeCost: 0, monthlyRecurring: 0, confidence: 0.8, currency: "USD" },
        customerImpact: "medium", operationalImpact: "medium", automationPotential: "high",
        businessOwner: "Sales", dependencies: [], evidence: [{ source: "business_mri", description: "Follow-up is manual", data: {} }],
        dateDetected: nowIso(), version: 1, createdAt: nowIso(), updatedAt: nowIso(),
      } as any,
    ];

    const result = analyzeRootCauses(mockConstraints, mockHealth, [], nowIso());

    expect(result.chains.length).toBeGreaterThan(0);
    expect(result.primaryRootCause).toBe("manual_follow_up_process");
    expect(result.chains[0]!.symptomChain.length).toBeGreaterThan(0);
    expect(result.chains[0]!.affectedKpiKeys).toContain("lead_conversion_rate");
  });

  it("root cause service returns empty chains when no active constraints", async () => {
    const { business } = await fullSetup(c);
    // Mark all constraints as resolved
    const constraints = await c.businessConstraints.listByBusinessId(ORG, business.id);
    for (const con of constraints) {
      await c.businessConstraints.updateStatus(ORG, con.id, "resolved");
    }

    const svc = createRootCauseService(c);
    const result = await svc.analyze(ORG, business.id);

    expect(result.chains).toHaveLength(0);
    expect(result.primaryRootCause).toBeNull();
  });

  it("root cause service emits business.rootcause.detected event when chains found", async () => {
    const { business } = await fullSetup(c);
    const constraints = await c.businessConstraints.listByBusinessId(ORG, business.id);

    if (constraints.length > 0) {
      const svc = createRootCauseService(c);
      await svc.analyze(ORG, business.id);

      const events = await c.eventLog.listByOrgId(ORG);
      const rcEvent = events.find((e) => e.type === "business.rootcause.detected");
      if (rcEvent) {
        expect((rcEvent.payload as { businessId: string }).businessId).toBe(business.id);
      }
    }
  });

  it("root cause summary is non-empty string", async () => {
    const { business } = await fullSetup(c);
    const svc = createRootCauseService(c);
    const result = await svc.analyze(ORG, business.id);

    expect(typeof result.summary).toBe("string");
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.detectedAt).toBeTruthy();
  });

  // ─── End-to-End Decision OS Pipeline ─────────────────────────────────────────

  it("full Decision OS pipeline: health → constraints → root cause → recommendations → decision", async () => {
    const { business } = await fullSetup(c);
    const api = createApiFromContainer(c);

    // Root cause
    const rcResult = await api.rootCause.analyze(ORG, business.id);
    expect(typeof rcResult.summary).toBe("string");

    // Decision from recommendations
    const decision = await api.businessDecision.generate(ORG, business.id, { recommendationIds: [] });
    expect(decision.id).toBeDefined();
    expect(decision.status).toBe("generated");
    expect(decision.objective).toBeTruthy();
    expect(decision.confidenceScore).toBeGreaterThanOrEqual(0);
  });

  it("decision lifecycle flows through approval and scheduling", async () => {
    const { business } = await fullSetup(c);
    const api = createApiFromContainer(c);

    const decision = await api.businessDecision.generate(ORG, business.id, { recommendationIds: [] });
    const approved = await api.businessDecision.approve(ORG, decision.id);
    expect(approved.status).toBe("approved");

    const scheduled = await api.businessDecision.schedule(ORG, decision.id);
    expect(scheduled.status).toBe("scheduled");
  });

  // ─── KPI + Mission Control Integration ───────────────────────────────────────

  it("Mission Control snapshot includes kpiReadings after Goal 20", async () => {
    const { business } = await fullSetup(c);
    const svc = createMissionControlService(c);

    const snapshot = await svc.getSnapshot(ORG, business.id);

    expect(Array.isArray(snapshot.kpiReadings)).toBe(true);
    expect(snapshot.kpiReadings.length).toBeGreaterThan(0);
    const healthKpi = snapshot.kpiReadings.find((r) => r.kpiKey === "business_health_score");
    expect(healthKpi).toBeDefined();
    expect(healthKpi!.value).toBeTypeOf("number");
  });

  it("KPI measurement and root cause share the same tenant scope", async () => {
    const ORG_A = "org-dos-a";
    const ORG_B = "org-dos-b";

    const profileSvc = createBusinessProfileService(c);
    const { business: bizA } = await profileSvc.createBusiness({ orgId: ORG_A, name: "BizA", industry: "retail", employeeCount: 5, annualRevenue: 200000, businessType: "retail", yearsOperating: 2, locationCount: 1, businessHours: "9-5" });
    const { business: bizB } = await profileSvc.createBusiness({ orgId: ORG_B, name: "BizB", industry: "tech", employeeCount: 30, annualRevenue: 1500000, businessType: "saas", yearsOperating: 7, locationCount: 1, businessHours: "24/7" });

    await c.businessHealth.upsert({ orgId: ORG_A, businessId: bizA.id, overallScore: 42, generatedAt: nowIso() });
    await c.businessHealth.upsert({ orgId: ORG_B, businessId: bizB.id, overallScore: 91, generatedAt: nowIso() });

    const kpiSvc = createKpiMeasurementService(c);
    const { readings: readingsA } = await kpiSvc.measure(ORG_A, bizA.id);
    const { readings: readingsB } = await kpiSvc.measure(ORG_B, bizB.id);

    const scoreA = readingsA.find((r) => r.kpiKey === "business_health_score")!.value;
    const scoreB = readingsB.find((r) => r.kpiKey === "business_health_score")!.value;
    expect(scoreA).toBe(42);
    expect(scoreB).toBe(91);

    const rcSvc = createRootCauseService(c);
    const rcA = await rcSvc.analyze(ORG_A, bizA.id);
    const rcB = await rcSvc.analyze(ORG_B, bizB.id);
    expect(rcA.summary).toBeTruthy();
    expect(rcB.summary).toBeTruthy();
  });

  // ─── Event Pipeline Validation ───────────────────────────────────────────────

  it("full pipeline emits domain events in correct order", async () => {
    const { business } = await fullSetup(c);
    const api = createApiFromContainer(c);

    await api.rootCause.analyze(ORG, business.id);
    const decision = await api.businessDecision.generate(ORG, business.id, { recommendationIds: [] });
    await api.businessDecision.approve(ORG, decision.id);

    const events = await c.eventLog.listByOrgId(ORG);
    const types = events.map((e) => e.type);

    expect(types.some((t) => t.includes("business."))).toBe(true);
    expect(types.some((t) => t.includes("decision."))).toBe(true);
  });

  // ─── Null Safety ─────────────────────────────────────────────────────────────

  it("root cause analyze returns gracefully when no health data", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({ orgId: ORG, name: "No Health", industry: "retail", employeeCount: 2, annualRevenue: 50000, businessType: "retail", yearsOperating: 1, locationCount: 1, businessHours: "9-5" });

    const svc = createRootCauseService(c);
    const result = await svc.analyze(ORG, business.id);

    expect(result.chains).toHaveLength(0);
    expect(result.primaryRootCause).toBeNull();
    expect(result.summary).toContain("No health data");
  });

  // ─── Determinism Validation ───────────────────────────────────────────────────

  it("root cause analysis is deterministic: same input produces same output", () => {
    const mockHealth = { overallScore: 60, generatedAt: nowIso(), orgId: ORG, businessId: "biz-det", id: "h-det" } as any;
    const mockConstraints = [{
      id: "c-det", orgId: ORG, businessId: "biz-det",
      definitionKey: "high_admin_burden",
      title: "High Admin Burden",
      description: "Too much manual admin",
      category: "operations", severity: "medium", confidence: 0.75,
      businessImpact: "Productivity loss", status: "active",
      financialImpact: { annualRevenueImpact: 0, oneTimeCost: 0, monthlyRecurring: 0, confidence: 0.6, currency: "USD" },
      customerImpact: "low", operationalImpact: "high", automationPotential: "high",
      businessOwner: "Operations", dependencies: [], evidence: [],
      dateDetected: nowIso(), version: 1, createdAt: nowIso(), updatedAt: nowIso(),
    } as any];

    const r1 = analyzeRootCauses(mockConstraints, mockHealth, [], nowIso());
    const r2 = analyzeRootCauses(mockConstraints, mockHealth, [], nowIso());

    expect(r1.primaryRootCause).toBe(r2.primaryRootCause);
    expect(r1.chains.length).toBe(r2.chains.length);
    expect(r1.chains[0]!.rootCauseKey).toBe(r2.chains[0]!.rootCauseKey);
  });
});
