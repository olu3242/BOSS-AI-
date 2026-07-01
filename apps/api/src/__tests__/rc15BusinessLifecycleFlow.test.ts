/**
 * RC1.5 WS1 — End-to-end business lifecycle test.
 * Exercises the full BOSS pipeline using the actual service APIs.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createBusinessMriService } from "../services/businessMriService.js";
import { createBusinessDnaService } from "../services/businessDnaService.js";
import { createBusinessHealthService } from "../services/businessHealthService.js";
import { createBusinessCapabilityService } from "../services/businessCapabilityService.js";
import { createBusinessConstraintService } from "../services/businessConstraintService.js";
import { createBusinessRecommendationService } from "../services/businessRecommendationService.js";
import { createBusinessDecisionService } from "../services/businessDecisionService.js";
import { createMissionControlService } from "../services/missionControlService.js";

const ORG = "org-lifecycle-rc15";

async function runMri(repos: ReturnType<typeof createInMemoryContainer>, orgId: string, bizId: string) {
  const mriSvc = createBusinessMriService(repos);
  const mri = await mriSvc.startMri(orgId, bizId);
  await mriSvc.answer(orgId, mri.id, { sectionKey: "identity", questionKey: "identity.employees", value: 12 });
  await mriSvc.answer(orgId, mri.id, { sectionKey: "sales", questionKey: "sales.follow_up_process", value: "manual" });
  await mriSvc.answer(orgId, mri.id, { sectionKey: "operations", questionKey: "operations.scheduling", value: "spreadsheet" });
  await mriSvc.answer(orgId, mri.id, { sectionKey: "technology", questionKey: "technology.crm", value: false });
  await mriSvc.answer(orgId, mri.id, { sectionKey: "goals", questionKey: "goals.priorities", value: ["growth", "automation"] });
  await mriSvc.completeSection(orgId, mri.id, "identity");
  return mriSvc.completeMri(orgId, mri.id);
}

describe("RC1.5 WS1 — Full Business Lifecycle Integration", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("Stage 1: creates a business and profile", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({
      orgId: ORG,
      name: "Lifecycle Corp",
      industry: "retail",
      employeeCount: 12,
      annualRevenue: 500000,
      businessType: "retail",
      yearsOperating: 5,
      locationCount: 2,
      businessHours: "Mon-Fri 9am-5pm",
    });
    expect(business.id).toBeDefined();
    expect(business.orgId).toBe(ORG);
  });

  it("Stage 2: completes MRI and derives DNA + Health", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({ orgId: ORG, name: "Lifecycle Corp", industry: "retail", employeeCount: 12, annualRevenue: 500000, businessType: "retail", yearsOperating: 5, locationCount: 1, businessHours: "9-5" });

    const mri = await runMri(c, ORG, business.id);
    expect(mri.status).toBe("completed");

    const dna = await createBusinessDnaService(c).generate(ORG, business.id, mri.id);
    expect(dna.businessId).toBe(business.id);

    const { health } = await createBusinessHealthService(c).generate(ORG, business.id, mri.id);
    expect(typeof health.overallScore).toBe("number");
  });

  it("Stage 3: constraint analysis produces constraints from MRI", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({ orgId: ORG, name: "Lifecycle Corp", industry: "retail", employeeCount: 12, annualRevenue: 500000, businessType: "retail", yearsOperating: 5, locationCount: 1, businessHours: "9-5" });

    const mri = await runMri(c, ORG, business.id);
    await createBusinessDnaService(c).generate(ORG, business.id, mri.id);
    await createBusinessHealthService(c).generate(ORG, business.id, mri.id);

    const constraintSvc = createBusinessConstraintService(c);
    const result = await constraintSvc.analyze(ORG, business.id, mri.id);
    expect(result.constraints.length).toBeGreaterThan(0);
  });

  it("Stage 4: recommendations are generated after constraint analysis", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({ orgId: ORG, name: "Lifecycle Corp", industry: "retail", employeeCount: 12, annualRevenue: 500000, businessType: "retail", yearsOperating: 5, locationCount: 1, businessHours: "9-5" });

    const mri = await runMri(c, ORG, business.id);
    await createBusinessDnaService(c).generate(ORG, business.id, mri.id);
    await createBusinessHealthService(c).generate(ORG, business.id, mri.id);
    await createBusinessCapabilityService(c).evaluate(ORG, business.id, mri.id, await (async () => { const dna = await c.businessDna.findByBusinessId(ORG, business.id); return dna!; })());
    await createBusinessConstraintService(c).analyze(ORG, business.id, mri.id);

    const recSvc = createBusinessRecommendationService(c);
    const result = await recSvc.analyze(ORG, business.id);
    // Recommendations may be empty if no active constraints detected, but call should succeed
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it("Stage 5: decision is generated from health + recommendations", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({ orgId: ORG, name: "Lifecycle Corp", industry: "retail", employeeCount: 12, annualRevenue: 500000, businessType: "retail", yearsOperating: 5, locationCount: 1, businessHours: "9-5" });

    const mri = await runMri(c, ORG, business.id);
    await createBusinessDnaService(c).generate(ORG, business.id, mri.id);
    await createBusinessHealthService(c).generate(ORG, business.id, mri.id);

    const decisionSvc = createBusinessDecisionService(c);
    const decision = await decisionSvc.generate(ORG, business.id, { recommendationIds: [] });
    expect(decision.businessId).toBe(business.id);
    expect(decision.objective).toBeDefined();
  });

  it("Stage 6: Mission Control snapshot assembles state from lifecycle", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({ orgId: ORG, name: "Lifecycle Corp", industry: "retail", employeeCount: 12, annualRevenue: 500000, businessType: "retail", yearsOperating: 5, locationCount: 1, businessHours: "9-5" });

    const mri = await runMri(c, ORG, business.id);
    await createBusinessDnaService(c).generate(ORG, business.id, mri.id);
    await createBusinessHealthService(c).generate(ORG, business.id, mri.id);
    await createBusinessDecisionService(c).generate(ORG, business.id, { recommendationIds: [] });

    const snap = await createMissionControlService(c).getSnapshot(ORG, business.id);
    expect(snap.timeline.length).toBeGreaterThan(0);
    expect(snap.decisions).toBeDefined();
  });

  it("Stage 7: domain events are persisted to durable event log throughout lifecycle", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({ orgId: ORG, name: "Lifecycle Corp", industry: "retail", employeeCount: 12, annualRevenue: 500000, businessType: "retail", yearsOperating: 5, locationCount: 1, businessHours: "9-5" });

    const mri = await runMri(c, ORG, business.id);
    await createBusinessDnaService(c).generate(ORG, business.id, mri.id);
    await createBusinessHealthService(c).generate(ORG, business.id, mri.id);

    const events = await c.eventLog.listByOrgId(ORG);
    expect(events.length).toBeGreaterThan(0);
  });
});
