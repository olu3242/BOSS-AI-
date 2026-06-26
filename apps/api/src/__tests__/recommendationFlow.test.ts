import { describe, expect, it } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createBusinessMriService } from "../services/businessMriService.js";
import { createBusinessDnaService } from "../services/businessDnaService.js";
import { createBusinessHealthService } from "../services/businessHealthService.js";
import { createBusinessCapabilityService } from "../services/businessCapabilityService.js";
import { createBusinessTimelineService } from "../services/businessTimelineService.js";
import { createBusinessConstraintService } from "../services/businessConstraintService.js";
import { createBusinessRecommendationService } from "../services/businessRecommendationService.js";

const ORG_ID = "33333333-3333-3333-3333-333333333333";

describe("recommendation generation flow", () => {
  it("derives, scores, and roadmaps recommendations from the business's active constraints", async () => {
    const repos = createInMemoryContainer();
    const profileService = createBusinessProfileService(repos);
    const mriService = createBusinessMriService(repos);
    const dnaService = createBusinessDnaService(repos);
    const healthService = createBusinessHealthService(repos);
    const capabilityService = createBusinessCapabilityService(repos);
    const timelineService = createBusinessTimelineService(repos);
    const constraintService = createBusinessConstraintService(repos);
    const recommendationService = createBusinessRecommendationService(repos);

    const { business } = await profileService.createBusiness({
      orgId: ORG_ID,
      name: "Lakeside HVAC",
      industry: "hvac",
      employeeCount: 8,
      annualRevenue: 520000,
      businessType: "hvac",
      yearsOperating: 4,
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

    const constraintAnalysis = await constraintService.analyze(ORG_ID, business.id, completedMri.id);
    expect(constraintAnalysis.constraints.length).toBeGreaterThan(0);

    const recommendationAnalysis = await recommendationService.analyze(ORG_ID, business.id);

    expect(recommendationAnalysis.recommendations.length).toBeGreaterThan(0);
    expect(recommendationAnalysis.scores.length).toBe(recommendationAnalysis.recommendations.length);
    expect(recommendationAnalysis.priorities.length).toBe(recommendationAnalysis.recommendations.length);

    for (const recommendation of recommendationAnalysis.recommendations) {
      expect(recommendation.evidence.length).toBeGreaterThan(0);
      expect(recommendation.relatedConstraintIds.length).toBeGreaterThan(0);
      expect(recommendation.confidence).toBeGreaterThan(0);
    }

    expect(recommendationAnalysis.roadmap.stages.length).toBe(5);
    const totalRoadmapEntries = recommendationAnalysis.roadmap.stages.reduce(
      (sum, stage) => sum + stage.recommendationIds.length,
      0
    );
    expect(totalRoadmapEntries).toBe(recommendationAnalysis.recommendations.length);

    const priorities = await recommendationService.getPriorities(ORG_ID, business.id);
    expect(priorities.length).toBe(recommendationAnalysis.recommendations.length);

    const roadmap = await recommendationService.getRoadmap(ORG_ID, business.id);
    expect(roadmap).not.toBeNull();

    const list = await recommendationService.list(ORG_ID, business.id);
    expect(list.length).toBe(recommendationAnalysis.recommendations.length);
    const firstRecommendation = list[0];
    if (!firstRecommendation) {
      throw new Error("Expected at least one generated recommendation");
    }

    const approved = await recommendationService.approve(ORG_ID, firstRecommendation.id);
    expect(approved.status).toBe("approved");

    const timeline = await timelineService.list(ORG_ID, business.id);
    expect(timeline.map((entry) => entry.type)).toContain("recommendations_generated");
  });
});
