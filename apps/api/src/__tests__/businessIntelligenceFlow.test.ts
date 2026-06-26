import { describe, expect, it } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createBusinessMriService } from "../services/businessMriService.js";
import { createBusinessDnaService } from "../services/businessDnaService.js";
import { createBusinessHealthService } from "../services/businessHealthService.js";
import { createBusinessCapabilityService } from "../services/businessCapabilityService.js";
import { createBusinessTimelineService } from "../services/businessTimelineService.js";

const ORG_ID = "11111111-1111-1111-1111-111111111111";

describe("business intelligence flow", () => {
  it("creates a business, completes the MRI, and derives DNA/Health/Capabilities", async () => {
    const repos = createInMemoryContainer();
    const profileService = createBusinessProfileService(repos);
    const mriService = createBusinessMriService(repos);
    const dnaService = createBusinessDnaService(repos);
    const healthService = createBusinessHealthService(repos);
    const capabilityService = createBusinessCapabilityService(repos);
    const timelineService = createBusinessTimelineService(repos);

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

    await mriService.answer(ORG_ID, mri.id, {
      sectionKey: "identity",
      questionKey: "identity.employees",
      value: 4,
    });
    await mriService.answer(ORG_ID, mri.id, {
      sectionKey: "sales",
      questionKey: "sales.follow_up_process",
      value: "manual",
    });
    await mriService.answer(ORG_ID, mri.id, {
      sectionKey: "operations",
      questionKey: "operations.scheduling",
      value: "spreadsheet",
    });
    await mriService.answer(ORG_ID, mri.id, {
      sectionKey: "technology",
      questionKey: "technology.crm",
      value: false,
    });
    await mriService.answer(ORG_ID, mri.id, {
      sectionKey: "goals",
      questionKey: "goals.priorities",
      value: ["growth", "automation"],
    });

    await mriService.completeSection(ORG_ID, mri.id, "identity");
    const completedMri = await mriService.completeMri(ORG_ID, mri.id);
    expect(completedMri.status).toBe("completed");

    const dna = await dnaService.generate(ORG_ID, business.id, mri.id);
    expect(dna.businessId).toBe(business.id);

    const { health, dimensions } = await healthService.generate(ORG_ID, business.id, mri.id);
    expect(health.businessId).toBe(business.id);
    expect(dimensions.length).toBeGreaterThan(0);

    const capabilities = await capabilityService.evaluate(ORG_ID, business.id, mri.id, dna);
    expect(capabilities.length).toBeGreaterThan(0);

    const timeline = await timelineService.list(ORG_ID, business.id);
    const types = timeline.map((entry) => entry.type);
    expect(types).toEqual([
      "business_created",
      "business_mri_started",
      "business_mri_completed",
      "business_dna_generated",
      "business_health_updated",
      "capability_updated",
    ]);
  });
});
