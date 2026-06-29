import { describe, expect, it } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createBusinessMriService } from "../services/businessMriService.js";
import { createBusinessConstraintService } from "../services/businessConstraintService.js";
import { createBusinessRecommendationService } from "../services/businessRecommendationService.js";
import { createToolFabricService } from "../services/toolFabricService.js";
import { createLoopRuntimeService } from "../services/loopRuntimeService.js";
import { createWorkflowGenerationService } from "../services/workflowGenerationService.js";

const ORG_ID = "55555555-5555-5555-5555-555555555555";

describe("autonomous workflow generation", () => {
  it("transforms an approved recommendation into an executable Loop Runtime workflow", async () => {
    const repos = createInMemoryContainer();
    const profileService = createBusinessProfileService(repos);
    const mriService = createBusinessMriService(repos);
    const constraintService = createBusinessConstraintService(repos);
    const recommendationService = createBusinessRecommendationService(repos);
    const toolFabric = createToolFabricService(repos);
    const loopRuntime = createLoopRuntimeService(repos, toolFabric);
    const workflowGeneration = createWorkflowGenerationService(repos, loopRuntime);

    const { business } = await profileService.createBusiness({
      orgId: ORG_ID,
      name: "Acme Pest Control",
      industry: "pest_control",
      employeeCount: 8,
      annualRevenue: 500000,
      businessType: "pest_control",
      yearsOperating: 4,
      locationCount: 1,
      businessHours: "Mon-Fri 8am-5pm",
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
    await mriService.completeMri(ORG_ID, mri.id);

    await constraintService.analyze(ORG_ID, business.id, mri.id);
    const { recommendations } = await recommendationService.analyze(ORG_ID, business.id);
    const recommendation = recommendations[0];
    expect(recommendation).toBeDefined();
    if (!recommendation) return;

    await recommendationService.approve(ORG_ID, recommendation.id);

    const execution = await workflowGeneration.generateAndExecute(ORG_ID, business.id, recommendation.id);

    expect(execution.workflowKey).toBe(`recommendation_${recommendation.definitionKey}`);
    expect(["completed", "failed"]).toContain(execution.state);

    const timeline = await repos.businessTimeline.listByBusinessId(ORG_ID, business.id);
    expect(timeline.map((t) => t.type)).toContain("workflow_generated");
  });

  it("auto-generates and executes a workflow when business.recommendation.approved fires", async () => {
    const repos = createInMemoryContainer();
    const profileService = createBusinessProfileService(repos);
    const mriService = createBusinessMriService(repos);
    const constraintService = createBusinessConstraintService(repos);
    const recommendationService = createBusinessRecommendationService(repos);
    const toolFabric = createToolFabricService(repos);
    const loopRuntime = createLoopRuntimeService(repos, toolFabric);
    const workflowGeneration = createWorkflowGenerationService(repos, loopRuntime);

    let generatedWorkflowKey: string | undefined;
    repos.eventBus.subscribe<{ orgId: string; businessId: string; recommendationId: string }>(
      "business.recommendation.approved",
      (event) => {
        void workflowGeneration
          .generateAndExecute(event.payload.orgId, event.payload.businessId, event.payload.recommendationId)
          .then((execution) => {
            generatedWorkflowKey = execution.workflowKey;
          });
      }
    );

    const { business } = await profileService.createBusiness({
      orgId: ORG_ID,
      name: "Acme Pest Control",
      industry: "pest_control",
      employeeCount: 8,
      annualRevenue: 500000,
      businessType: "pest_control",
      yearsOperating: 4,
      locationCount: 1,
      businessHours: "Mon-Fri 8am-5pm",
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
    await mriService.completeMri(ORG_ID, mri.id);
    await constraintService.analyze(ORG_ID, business.id, mri.id);
    const { recommendations } = await recommendationService.analyze(ORG_ID, business.id);
    const recommendation = recommendations[0];
    expect(recommendation).toBeDefined();
    if (!recommendation) return;

    await recommendationService.approve(ORG_ID, recommendation.id);
    await new Promise((resolve) => setImmediate(resolve));

    expect(generatedWorkflowKey).toBe(`recommendation_${recommendation.definitionKey}`);
  });
});
