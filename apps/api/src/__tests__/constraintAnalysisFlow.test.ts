import { describe, expect, it } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createBusinessMriService } from "../services/businessMriService.js";
import { createBusinessDnaService } from "../services/businessDnaService.js";
import { createBusinessHealthService } from "../services/businessHealthService.js";
import { createBusinessCapabilityService } from "../services/businessCapabilityService.js";
import { createBusinessTimelineService } from "../services/businessTimelineService.js";
import { createBusinessConstraintService } from "../services/businessConstraintService.js";

const ORG_ID = "22222222-2222-2222-2222-222222222222";

describe("constraint analysis flow", () => {
  it("detects, scores, and prioritizes constraints from the business's profile/MRI/health/capability data", async () => {
    const repos = createInMemoryContainer();
    const profileService = createBusinessProfileService(repos);
    const mriService = createBusinessMriService(repos);
    const dnaService = createBusinessDnaService(repos);
    const healthService = createBusinessHealthService(repos);
    const capabilityService = createBusinessCapabilityService(repos);
    const timelineService = createBusinessTimelineService(repos);
    const constraintService = createBusinessConstraintService(repos);

    const { business } = await profileService.createBusiness({
      orgId: ORG_ID,
      name: "Riverside Plumbing",
      industry: "plumbing",
      employeeCount: 6,
      annualRevenue: 410000,
      businessType: "plumbing",
      yearsOperating: 3,
      locationCount: 1,
      businessHours: "Mon-Fri 7am-6pm",
    });

    const mri = await mriService.startMri(ORG_ID, business.id);

    await mriService.answer(ORG_ID, mri.id, {
      sectionKey: "sales",
      questionKey: "sales.follow_up_process",
      value: "manual",
    });
    await mriService.answer(ORG_ID, mri.id, {
      sectionKey: "operations",
      questionKey: "operations.team_responsibilities",
      value: "undefined",
    });
    await mriService.answer(ORG_ID, mri.id, {
      sectionKey: "technology",
      questionKey: "technology.crm",
      value: false,
    });
    await mriService.answer(ORG_ID, mri.id, {
      sectionKey: "pain_points",
      questionKey: "pain_points.challenges",
      value: ["missed_leads", "administrative_overload"],
    });

    await mriService.completeSection(ORG_ID, mri.id, "identity");
    const completedMri = await mriService.completeMri(ORG_ID, mri.id);

    await dnaService.generate(ORG_ID, business.id, mri.id);
    await healthService.generate(ORG_ID, business.id, mri.id);
    const dna = await dnaService.generate(ORG_ID, business.id, mri.id);
    await capabilityService.evaluate(ORG_ID, business.id, mri.id, dna);

    const analysis = await constraintService.analyze(ORG_ID, business.id, completedMri.id);

    expect(analysis.constraints.length).toBeGreaterThan(0);
    expect(analysis.scores.length).toBe(analysis.constraints.length);
    expect(analysis.priorities.length).toBe(analysis.constraints.length);

    for (const constraint of analysis.constraints) {
      expect(constraint.evidence.length).toBeGreaterThan(0);
      expect(constraint.financialImpact.confidence).toBeGreaterThan(0);
    }

    const priorities = await constraintService.getPriorities(ORG_ID, business.id);
    expect(priorities.length).toBe(analysis.constraints.length);

    const list = await constraintService.list(ORG_ID, business.id);
    expect(list.length).toBe(analysis.constraints.length);

    const dismissed = await constraintService.dismiss(ORG_ID, list[0].id);
    expect(dismissed.status).toBe("dismissed");

    const timeline = await timelineService.list(ORG_ID, business.id);
    expect(timeline.map((entry) => entry.type)).toContain("constraint_analysis_completed");
  });
});
