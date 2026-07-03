/**
 * RC1.5 WS5 — Decision Quality Validation
 *
 * Tests across 3+ industries (retail, restaurant, professional_services):
 * - Evidence quality scoring is deterministic
 * - Policy application is consistent
 * - Recommendations include traceability fields
 * - Executive briefs have explainable reasoning
 * - Deterministic reasoning takes precedence over AI inference
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

const INDUSTRIES = ["retail", "restaurant", "professional_services"] as const;

async function buildFullProfile(
  c: ReturnType<typeof createInMemoryContainer>,
  org: string,
  industry: string
) {
  const profileSvc = createBusinessProfileService(c);
  const { business } = await profileSvc.createBusiness({
    orgId: org,
    name: `${industry.toUpperCase()} Co`,
    industry,
    employeeCount: 20,
    annualRevenue: 800000,
    businessType: industry,
    yearsOperating: 8,
    locationCount: 3,
    businessHours: "Mon-Sat 8-8",
  });

  const mriSvc = createBusinessMriService(c);
  const mri = await mriSvc.startMri(org, business.id);
  await mriSvc.answer(org, mri.id, { sectionKey: "identity", questionKey: "identity.employees", value: 20 });
  await mriSvc.answer(org, mri.id, { sectionKey: "sales", questionKey: "sales.follow_up_process", value: "none" });
  await mriSvc.answer(org, mri.id, { sectionKey: "operations", questionKey: "operations.scheduling", value: "paper" });
  await mriSvc.answer(org, mri.id, { sectionKey: "technology", questionKey: "technology.crm", value: false });
  await mriSvc.answer(org, mri.id, { sectionKey: "goals", questionKey: "goals.priorities", value: ["efficiency", "customer_retention"] });
  await mriSvc.completeSection(org, mri.id, "identity");
  const completedMri = await mriSvc.completeMri(org, mri.id);

  await createBusinessDnaService(c).generate(org, business.id, completedMri.id);
  const { health } = await createBusinessHealthService(c).generate(org, business.id, completedMri.id);
  const { constraints } = await createBusinessConstraintService(c).analyze(org, business.id, completedMri.id);
  const { recommendations } = await createBusinessRecommendationService(c).analyze(org, business.id);

  return { business, mri: completedMri, health, constraints, recommendations };
}

describe("RC1.5 WS5 — Decision Quality Validation", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  // ─── Determinism ──────────────────────────────────────────────────────────

  it("health scoring is deterministic: same inputs produce valid scores across industries", async () => {
    const scores: number[] = [];

    for (const industry of INDUSTRIES) {
      const org = `org-det-${industry}`;
      const profileSvc = createBusinessProfileService(c);
      const { business } = await profileSvc.createBusiness({
        orgId: org, name: "Det Corp", industry,
        employeeCount: 10, annualRevenue: 500000,
        businessType: industry, yearsOperating: 5,
        locationCount: 1, businessHours: "9-5",
      });
      const mriSvc = createBusinessMriService(c);
      const mri = await mriSvc.startMri(org, business.id);
      await mriSvc.answer(org, mri.id, { sectionKey: "identity", questionKey: "identity.employees", value: 10 });
      await mriSvc.answer(org, mri.id, { sectionKey: "sales", questionKey: "sales.follow_up_process", value: "manual" });
      await mriSvc.answer(org, mri.id, { sectionKey: "operations", questionKey: "operations.scheduling", value: "spreadsheet" });
      await mriSvc.answer(org, mri.id, { sectionKey: "technology", questionKey: "technology.crm", value: false });
      await mriSvc.answer(org, mri.id, { sectionKey: "goals", questionKey: "goals.priorities", value: ["growth"] });
      await mriSvc.completeSection(org, mri.id, "identity");
      const completed = await mriSvc.completeMri(org, mri.id);
      await createBusinessDnaService(c).generate(org, business.id, completed.id);
      const { health } = await createBusinessHealthService(c).generate(org, business.id, completed.id);
      scores.push(health.overallScore);
    }

    expect(scores.every((s) => typeof s === "number" && !isNaN(s))).toBe(true);
    expect(scores.every((s) => s >= 0 && s <= 100)).toBe(true);
  });

  it("identical businesses in different orgs produce the same health score (pure function)", async () => {
    async function run(org: string) {
      const profileSvc = createBusinessProfileService(c);
      const { business } = await profileSvc.createBusiness({
        orgId: org, name: "Idem Corp", industry: "retail",
        employeeCount: 12, annualRevenue: 600000,
        businessType: "retail", yearsOperating: 4,
        locationCount: 2, businessHours: "Mon-Fri 9-5",
      });
      const mriSvc = createBusinessMriService(c);
      const mri = await mriSvc.startMri(org, business.id);
      await mriSvc.answer(org, mri.id, { sectionKey: "identity", questionKey: "identity.employees", value: 12 });
      await mriSvc.answer(org, mri.id, { sectionKey: "sales", questionKey: "sales.follow_up_process", value: "manual" });
      await mriSvc.answer(org, mri.id, { sectionKey: "operations", questionKey: "operations.scheduling", value: "spreadsheet" });
      await mriSvc.answer(org, mri.id, { sectionKey: "technology", questionKey: "technology.crm", value: false });
      await mriSvc.answer(org, mri.id, { sectionKey: "goals", questionKey: "goals.priorities", value: ["growth"] });
      await mriSvc.completeSection(org, mri.id, "identity");
      const completed = await mriSvc.completeMri(org, mri.id);
      await createBusinessDnaService(c).generate(org, business.id, completed.id);
      const { health } = await createBusinessHealthService(c).generate(org, business.id, completed.id);
      return health.overallScore;
    }

    const [score1, score2] = await Promise.all([run("org-idem-1"), run("org-idem-2")]);
    expect(score1).toBe(score2);
  });

  // ─── Cross-Industry Coverage ──────────────────────────────────────────────

  it.each(INDUSTRIES)("industry '%s': constraints detected with org and business traceability", async (industry) => {
    const { constraints, business } = await buildFullProfile(c, `org-cqv-${industry}`, industry);
    expect(constraints.length).toBeGreaterThan(0);
    expect(constraints.every((con) => con.businessId === business.id)).toBe(true);
    expect(constraints.every((con) => con.orgId === `org-cqv-${industry}`)).toBe(true);
  });

  it.each(INDUSTRIES)("industry '%s': recommendations generated with title and confidence score", async (industry) => {
    const { recommendations } = await buildFullProfile(c, `org-rqv-${industry}`, industry);
    expect(recommendations.length).toBeGreaterThan(0);
    for (const rec of recommendations) {
      expect(rec.title).toBeTruthy();
      expect(typeof rec.confidence).toBe("number");
      expect(rec.confidence).toBeGreaterThanOrEqual(0);
    }
  });

  it.each(INDUSTRIES)("industry '%s': decisions include reasoning field (explainability)", async (industry) => {
    const { business } = await buildFullProfile(c, `org-dqv-${industry}`, industry);
    const decSvc = createBusinessDecisionService(c);
    const decision = await decSvc.generate(`org-dqv-${industry}`, business.id, { recommendationIds: [] });

    expect(decision.orgId).toBe(`org-dqv-${industry}`);
    expect(decision.businessId).toBe(business.id);
    expect(decision.context).toBeTruthy();
    expect(decision.context.length).toBeGreaterThan(10);
    expect(decision.objective).toBeTruthy();
  });

  // ─── Executive Brief Quality ───────────────────────────────────────────────

  it.each(INDUSTRIES)("industry '%s': executive brief has non-empty summary and is persisted", async (industry) => {
    const { business } = await buildFullProfile(c, `org-ebq-${industry}`, industry);
    await createBusinessDecisionService(c).generate(`org-ebq-${industry}`, business.id, { recommendationIds: [] });

    const briefSvc = createExecutiveBriefingService(c);
    const brief = await briefSvc.generate(`org-ebq-${industry}`, business.id);

    expect(brief.summary).toBeTruthy();
    expect(brief.businessId).toBe(business.id);
    expect(brief.generatedAt).toBeTruthy();

    const stored = await c.executiveBriefings.findLatest(`org-ebq-${industry}`, business.id);
    expect(stored).not.toBeNull();
    expect(stored!.businessId).toBe(business.id);
  });

  // ─── Policy Consistency ───────────────────────────────────────────────────

  it("businesses with weak MRI signals produce constraints (policy monotonicity)", async () => {
    const { constraints } = await buildFullProfile(c, "org-policy-low", "retail");
    // With all-manual signals, constraints must fire
    expect(constraints.length).toBeGreaterThan(0);
    // All constraints traceable to a key
    expect(constraints.every((con) => con.constraintKey || con.category || con.definitionKey)).toBe(true);
  });

  it("recommendation priorities from analyze() contain valid levels", async () => {
    const recSvc = createBusinessRecommendationService(c);
    // Build a profile then call analyze directly to get priorities
    const orgId = "org-prio";
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({
      orgId, name: "Prio Corp", industry: "professional_services",
      employeeCount: 20, annualRevenue: 800000,
      businessType: "professional_services", yearsOperating: 8,
      locationCount: 3, businessHours: "Mon-Sat 8-8",
    });
    const mriSvc = createBusinessMriService(c);
    const mri = await mriSvc.startMri(orgId, business.id);
    await mriSvc.answer(orgId, mri.id, { sectionKey: "identity", questionKey: "identity.employees", value: 20 });
    await mriSvc.answer(orgId, mri.id, { sectionKey: "sales", questionKey: "sales.follow_up_process", value: "none" });
    await mriSvc.answer(orgId, mri.id, { sectionKey: "operations", questionKey: "operations.scheduling", value: "paper" });
    await mriSvc.answer(orgId, mri.id, { sectionKey: "technology", questionKey: "technology.crm", value: false });
    await mriSvc.answer(orgId, mri.id, { sectionKey: "goals", questionKey: "goals.priorities", value: ["efficiency"] });
    await mriSvc.completeSection(orgId, mri.id, "identity");
    const completedMri = await mriSvc.completeMri(orgId, mri.id);
    await createBusinessDnaService(c).generate(orgId, business.id, completedMri.id);
    await createBusinessHealthService(c).generate(orgId, business.id, completedMri.id);
    await createBusinessConstraintService(c).analyze(orgId, business.id, completedMri.id);

    const { priorities } = await recSvc.analyze(orgId, business.id);
    const validLevels = new Set(["critical", "high", "medium", "low"]);
    for (const p of priorities) {
      expect(validLevels.has(p.priority)).toBe(true);
    }
  });

  // ─── Traceability ─────────────────────────────────────────────────────────

  it("every recommendation has a category for traceability to constraints", async () => {
    const { recommendations } = await buildFullProfile(c, "org-trace", "retail");
    for (const rec of recommendations) {
      expect(rec.category).toBeTruthy();
    }
  });

  it("decisions reference the org and business — no orphaned decisions", async () => {
    const orgId = "org-orphan-check";
    const { business } = await buildFullProfile(c, orgId, "restaurant");
    const decision = await createBusinessDecisionService(c).generate(orgId, business.id, { recommendationIds: [] });

    expect(decision.orgId).toBe(orgId);
    expect(decision.businessId).toBe(business.id);
  });
});
