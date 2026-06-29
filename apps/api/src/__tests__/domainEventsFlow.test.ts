import { describe, expect, it } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createBusinessMriService } from "../services/businessMriService.js";
import { createBusinessHealthService } from "../services/businessHealthService.js";
import { createBusinessConstraintService } from "../services/businessConstraintService.js";
import { createBusinessRecommendationService } from "../services/businessRecommendationService.js";
import { createToolFabricService } from "../services/toolFabricService.js";
import type { BossEvent } from "@boss/events";

const ORG_ID = "11111111-1111-1111-1111-111111111111";

describe("domain event wiring", () => {
  it("publishes canonical domain events through the shared container event bus", async () => {
    const repos = createInMemoryContainer();
    const seen: BossEvent[] = [];
    const eventTypes = [
      "business.mri.started",
      "business.mri.completed",
      "business.health.calculated",
      "business.constraints.analyzed",
      "business.constraint.dismissed",
      "business.recommendations.generated",
      "business.recommendation.approved",
      "tool.execution.requested",
      "tool.execution.succeeded",
      "tool.execution.failed",
    ];
    for (const type of eventTypes) {
      repos.eventBus.subscribe(type, (event) => seen.push(event as BossEvent));
    }

    const profileService = createBusinessProfileService(repos);
    const mriService = createBusinessMriService(repos);
    const healthService = createBusinessHealthService(repos);
    const constraintService = createBusinessConstraintService(repos);
    const recommendationService = createBusinessRecommendationService(repos);
    const toolFabric = createToolFabricService(repos);

    const { business } = await profileService.createBusiness({
      orgId: ORG_ID,
      name: "Sunny Lawn Care",
      industry: "landscaping",
      employeeCount: 4,
      annualRevenue: 320000,
      businessType: "landscaping",
      yearsOperating: 2,
      locationCount: 1,
      businessHours: "Mon-Fri 7am-6pm",
    });

    const mri = await mriService.startMri(ORG_ID, business.id);
    await mriService.completeMri(ORG_ID, mri.id);

    await healthService.generate(ORG_ID, business.id, mri.id);

    const { constraints } = await constraintService.analyze(ORG_ID, business.id, mri.id);
    if (constraints.length > 0) {
      await constraintService.dismiss(ORG_ID, constraints[0].id);
    }

    const { recommendations } = await recommendationService.analyze(ORG_ID, business.id);
    if (recommendations.length > 0) {
      await recommendationService.approve(ORG_ID, recommendations[0].id);
    }

    await toolFabric.connectIntegration(ORG_ID, business.id, "gmail");
    await toolFabric.setPermission(ORG_ID, business.id, {
      toolKey: "tool_send_email",
      roleKey: "ai_follow_up_assistant",
      allowed: true,
      approval: "auto",
      rateLimitPerMinute: null,
    });
    await toolFabric.requestTool(ORG_ID, business.id, {
      capabilityKey: "send_email",
      roleKey: "ai_follow_up_assistant",
      requestedBy: "ai_follow_up_assistant",
      input: { to: "test@example.com", subject: "Hi", body: "Hello" },
    });

    expect(seen).toContainEqual(
      expect.objectContaining({ type: "business.mri.started" })
    );
    expect(seen).toContainEqual(
      expect.objectContaining({ type: "business.mri.completed" })
    );
    expect(seen).toContainEqual(
      expect.objectContaining({ type: "business.health.calculated" })
    );
    expect(seen).toContainEqual(
      expect.objectContaining({ type: "business.constraints.analyzed" })
    );
    expect(seen).toContainEqual(
      expect.objectContaining({ type: "business.recommendations.generated" })
    );
    expect(seen.some((e) => e.type.startsWith("tool.execution."))).toBe(true);
  });
});
