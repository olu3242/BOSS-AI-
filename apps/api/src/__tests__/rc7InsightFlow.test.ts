import { describe, it, expect, beforeAll } from "vitest";
import { installGeneralSmbPack } from "@boss/industry-pack-general-smb";
import { createInMemoryContainer } from "../container.js";
import { createInsightService } from "../services/insightService.js";

beforeAll(() => {
  installGeneralSmbPack();
});

function buildServices() {
  const repos = createInMemoryContainer();
  const insight = createInsightService(repos);
  return { repos, insight };
}

async function createBusiness(repos: ReturnType<typeof createInMemoryContainer>, orgId: string, name: string) {
  return repos.businesses.create({ orgId, name, industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
}

async function addConstraint(
  repos: ReturnType<typeof createInMemoryContainer>,
  orgId: string,
  bizId: string,
  definitionKey: string
) {
  return repos.businessConstraints.create({
    orgId,
    businessId: bizId,
    definitionKey,
    title: definitionKey,
    description: "",
    category: "operations",
    severity: "high",
    confidence: 0.9,
    businessImpact: "Impact",
    financialImpact: { revenueLossAnnual: 0, timeLostHoursWeekly: 0, customerImpact: "low", operationalFriction: "low", growthLimitation: "low", ownerStress: "low", confidence: 0.5 },
    customerImpact: "low",
    operationalImpact: "low",
    automationPotential: "high",
    businessOwner: "owner",
    dependencies: [],
    status: "active",
    dateDetected: new Date().toISOString(),
    version: 1,
  });
}

describe("InsightService.getRecommendationTemplates", () => {
  it("returns templates from the registry", () => {
    const { insight } = buildServices();
    const templates = insight.getRecommendationTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toHaveProperty("key");
    expect(templates[0]).toHaveProperty("title");
    expect(templates[0]).toHaveProperty("category");
    expect(templates[0]).toHaveProperty("difficulty");
    expect(templates[0]).toHaveProperty("automationPotential");
  });

  it("includes lead_follow_up_recovery template", () => {
    const { insight } = buildServices();
    const templates = insight.getRecommendationTemplates();
    expect(templates.some((t) => t.key === "lead_follow_up_recovery")).toBe(true);
  });
});

describe("InsightService.getConstraintFrequencies — empty org", () => {
  it("returns empty array for org with no businesses", async () => {
    const { insight } = buildServices();
    const freqs = await insight.getConstraintFrequencies("org-empty");
    expect(freqs).toHaveLength(0);
  });

  it("returns empty array for org with businesses but no constraints", async () => {
    const { repos, insight } = buildServices();
    await createBusiness(repos, "org-1", "Biz A");
    const freqs = await insight.getConstraintFrequencies("org-1");
    expect(freqs).toHaveLength(0);
  });
});

describe("InsightService.getConstraintFrequencies — with constraints", () => {
  it("counts constraint frequency across businesses", async () => {
    const { repos, insight } = buildServices();
    const bizA = await createBusiness(repos, "org-2", "Biz A");
    const bizB = await createBusiness(repos, "org-2", "Biz B");

    await addConstraint(repos, "org-2", bizA.id, "missed_leads");
    await addConstraint(repos, "org-2", bizB.id, "missed_leads");

    const freqs = await insight.getConstraintFrequencies("org-2");
    const missedLeads = freqs.find((f) => f.constraintKey === "missed_leads");
    expect(missedLeads?.businessCount).toBe(2);
    expect(missedLeads?.businessIds).toContain(bizA.id);
    expect(missedLeads?.businessIds).toContain(bizB.id);
  });

  it("sorts by frequency descending", async () => {
    const { repos, insight } = buildServices();
    const biz1 = await createBusiness(repos, "org-3", "Biz 1");
    const biz2 = await createBusiness(repos, "org-3", "Biz 2");
    const biz3 = await createBusiness(repos, "org-3", "Biz 3");

    await addConstraint(repos, "org-3", biz1.id, "missed_leads");
    await addConstraint(repos, "org-3", biz2.id, "missed_leads");
    await addConstraint(repos, "org-3", biz3.id, "missed_leads");
    await addConstraint(repos, "org-3", biz1.id, "slow_lead_response");

    const freqs = await insight.getConstraintFrequencies("org-3");
    expect(freqs[0]?.constraintKey).toBe("missed_leads");
    expect(freqs[0]?.businessCount).toBe(3);
  });

  it("links to recommended action when available", async () => {
    const { repos, insight } = buildServices();
    const biz = await createBusiness(repos, "org-4", "Biz");
    await addConstraint(repos, "org-4", biz.id, "missed_leads");

    const freqs = await insight.getConstraintFrequencies("org-4");
    const missed = freqs.find((f) => f.constraintKey === "missed_leads");
    expect(missed?.recommendedActionKey).toBe("lead_follow_up_recovery");
  });
});

describe("InsightService.getOrgInsights", () => {
  it("returns empty insights for org with no cross-business patterns", async () => {
    const { repos, insight } = buildServices();
    await createBusiness(repos, "org-5", "Solo Biz");
    const summary = await insight.getOrgInsights("org-5");
    expect(summary.totalInsights).toBe(0);
    expect(summary.orgId).toBe("org-5");
  });

  it("surfaces insight when 2+ businesses share a constraint", async () => {
    const { repos, insight } = buildServices();
    const biz1 = await createBusiness(repos, "org-6", "Biz 1");
    const biz2 = await createBusiness(repos, "org-6", "Biz 2");
    await addConstraint(repos, "org-6", biz1.id, "weak_customer_follow_up");
    await addConstraint(repos, "org-6", biz2.id, "weak_customer_follow_up");

    const summary = await insight.getOrgInsights("org-6");
    expect(summary.totalInsights).toBeGreaterThan(0);
    expect(summary.insights[0]?.affectedBusinessCount).toBe(2);
  });

  it("assigns critical severity when 70%+ of businesses are affected", async () => {
    const { repos, insight } = buildServices();
    const businesses = await Promise.all([
      createBusiness(repos, "org-7", "Biz 1"),
      createBusiness(repos, "org-7", "Biz 2"),
      createBusiness(repos, "org-7", "Biz 3"),
    ]);
    for (const biz of businesses) {
      await addConstraint(repos, "org-7", biz.id, "missed_leads");
    }

    const summary = await insight.getOrgInsights("org-7");
    const critical = summary.insights.find((i) => i.severity === "critical");
    expect(critical).toBeDefined();
    expect(summary.criticalInsights).toBeGreaterThan(0);
  });

  it("is tenant-isolated", async () => {
    const { repos, insight } = buildServices();
    const biz1 = await createBusiness(repos, "org-8", "Biz 1");
    const biz2 = await createBusiness(repos, "org-8", "Biz 2");
    await addConstraint(repos, "org-8", biz1.id, "missed_leads");
    await addConstraint(repos, "org-8", biz2.id, "missed_leads");

    const summary = await insight.getOrgInsights("org-9");
    expect(summary.totalInsights).toBe(0);
  });
});
