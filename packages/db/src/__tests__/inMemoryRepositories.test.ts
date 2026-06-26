import { describe, expect, it } from "vitest";
import {
  createInMemoryBusinessRepository,
  createInMemoryBusinessProfileRepository,
  createInMemoryBusinessMriRepository,
  createInMemoryBusinessDnaRepository,
  createInMemoryBusinessHealthRepository,
  createInMemoryBusinessCapabilityRepository,
  createInMemoryBusinessTimelineRepository,
} from "../repositories/memory/inMemoryRepositories.js";

const ORG_ID = "11111111-1111-1111-1111-111111111111";

describe("in-memory business intelligence repositories", () => {
  it("supports the full business intelligence lifecycle", async () => {
    const businesses = createInMemoryBusinessRepository();
    const profiles = createInMemoryBusinessProfileRepository();
    const mris = createInMemoryBusinessMriRepository();
    const dnas = createInMemoryBusinessDnaRepository();
    const healths = createInMemoryBusinessHealthRepository();
    const capabilities = createInMemoryBusinessCapabilityRepository();
    const timeline = createInMemoryBusinessTimelineRepository();

    const business = await businesses.create({
      orgId: ORG_ID,
      name: "Sunny Lawn Care",
      industry: "landscaping",
      employeeCount: 4,
      annualRevenue: 320000,
    });
    expect(business.id).toBeTruthy();

    await timeline.append({
      orgId: ORG_ID,
      businessId: business.id,
      type: "business_created",
      description: "Business created: Sunny Lawn Care",
      metadata: {},
      occurredAt: new Date().toISOString(),
    });

    const profile = await profiles.upsert({
      orgId: ORG_ID,
      businessId: business.id,
      businessName: business.name,
      businessType: "landscaping",
      yearsOperating: 2,
      employeeCount: 4,
      locationCount: 1,
      businessHours: "Mon-Fri 7am-6pm",
    });
    expect(profile.businessId).toBe(business.id);

    const mri = await mris.create({
      orgId: ORG_ID,
      businessId: business.id,
      version: "1.0.0",
      status: "in_progress",
      startedAt: new Date().toISOString(),
      completedAt: null,
    });

    await mris.upsertSection({
      orgId: ORG_ID,
      businessMriId: mri.id,
      sectionKey: "identity",
      startedAt: new Date().toISOString(),
      completedAt: null,
    });

    await mris.upsertResponse({
      orgId: ORG_ID,
      businessMriId: mri.id,
      sectionKey: "identity",
      questionKey: "identity.business_name",
      value: "Sunny Lawn Care",
      answeredAt: new Date().toISOString(),
    });

    const completedMri = await mris.update(ORG_ID, mri.id, {
      status: "completed",
      completedAt: new Date().toISOString(),
    });
    expect(completedMri.status).toBe("completed");

    const sections = await mris.listSections(ORG_ID, mri.id);
    expect(sections).toHaveLength(1);

    const responses = await mris.listResponses(ORG_ID, mri.id);
    expect(responses).toHaveLength(1);

    const dna = await dnas.upsert({
      orgId: ORG_ID,
      businessId: business.id,
      archetype: "owner_operator",
      growthStage: "early_growth",
      operationalComplexity: "moderate",
      technologyMaturity: "basic_tools",
      automationReadiness: "moderate",
      customerEngagementStyle: "relationship_driven",
      revenueModel: "service_based",
      communicationStyle: "high_touch",
      decisionStyle: "owner_led",
      riskProfile: "balanced",
      generatedAt: new Date().toISOString(),
    });
    expect(dna.businessId).toBe(business.id);

    const health = await healths.upsert({
      orgId: ORG_ID,
      businessId: business.id,
      overallScore: 54,
      generatedAt: new Date().toISOString(),
    });

    await healths.upsertDimension({
      orgId: ORG_ID,
      businessHealthId: health.id,
      dimensionKey: "sales",
      score: 40,
      confidence: 0.7,
      trend: "unknown",
      evidence: ["Follow-up process: manual"],
      status: "at_risk",
    });

    const dimensions = await healths.listDimensions(ORG_ID, health.id);
    expect(dimensions).toHaveLength(1);
    expect(dimensions[0]?.dimensionKey).toBe("sales");

    await capabilities.upsert({
      orgId: ORG_ID,
      businessId: business.id,
      capabilityKey: "lead_management",
      currentMaturity: "ad_hoc",
      businessImportance: "high",
      automationPotential: "medium",
      dependencies: ["communication"],
      owner: "unassigned",
    });

    const businessCapabilities = await capabilities.listByBusinessId(ORG_ID, business.id);
    expect(businessCapabilities).toHaveLength(1);

    await timeline.append({
      orgId: ORG_ID,
      businessId: business.id,
      type: "business_health_updated",
      description: "Business Health Graph generated",
      metadata: {},
      occurredAt: new Date().toISOString(),
    });

    const timelineEntries = await timeline.listByBusinessId(ORG_ID, business.id);
    expect(timelineEntries).toHaveLength(2);
    expect(timelineEntries[0]?.type).toBe("business_created");
  });

  it("isolates data between organizations", async () => {
    const businesses = createInMemoryBusinessRepository();
    const otherOrgId = "22222222-2222-2222-2222-222222222222";

    const business = await businesses.create({
      orgId: ORG_ID,
      name: "Org A Business",
      industry: "retail",
      employeeCount: 1,
      annualRevenue: 1000,
    });

    expect(await businesses.findById(otherOrgId, business.id)).toBeNull();
    expect(await businesses.list(otherOrgId)).toHaveLength(0);
    expect(await businesses.list(ORG_ID)).toHaveLength(1);
  });
});
