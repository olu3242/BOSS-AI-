import { describe, expect, it } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createBusinessMriService } from "../services/businessMriService.js";
import { createBusinessConstraintService } from "../services/businessConstraintService.js";
import { createBusinessRecommendationService } from "../services/businessRecommendationService.js";
import { createToolFabricService } from "../services/toolFabricService.js";
import { createLoopRuntimeService } from "../services/loopRuntimeService.js";
import { createWorkflowGenerationService } from "../services/workflowGenerationService.js";
import { createMissionControlService } from "../services/missionControlService.js";

const ORG_ID = "55555555-5555-5555-5555-555555555555";

describe("mission control projection", () => {
  it("assembles workflow, task, event, dead letter, and timeline evidence into a single snapshot", async () => {
    const repos = createInMemoryContainer();
    const profileService = createBusinessProfileService(repos);
    const mriService = createBusinessMriService(repos);
    const constraintService = createBusinessConstraintService(repos);
    const recommendationService = createBusinessRecommendationService(repos);
    const toolFabric = createToolFabricService(repos);
    const loopRuntime = createLoopRuntimeService(repos, toolFabric);
    const workflowGeneration = createWorkflowGenerationService(repos, loopRuntime);
    const missionControl = createMissionControlService(repos);

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

    const snapshot = await missionControl.getSnapshot(ORG_ID, business.id);

    expect(snapshot.workflows.map((w) => w.id)).toContain(execution.id);
    const summary = snapshot.workflows.find((w) => w.id === execution.id);
    expect(summary).toBeDefined();
    expect(summary?.tasks.length).toBeGreaterThan(0);
    expect(summary?.events.length).toBeGreaterThan(0);
    expect(snapshot.timeline.map((t) => t.type)).toContain("workflow_generated");
    expect(Array.isArray(snapshot.deadLetters)).toBe(true);
  });
});
