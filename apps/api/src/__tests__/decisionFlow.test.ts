import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createApiFromContainer } from "../index.js";
import { nowIso } from "@boss/shared";

const ORG_ID = "dec00000-0000-0000-0000-000000000001";
const BIZ_ID = "dec00000-0000-0000-0000-000000000002";

async function setupBusiness(repos: ReturnType<typeof createInMemoryContainer>) {
  const business = await repos.businesses.create({ orgId: ORG_ID, name: "Test Biz", industry: "retail", employeeCount: 10, annualRevenue: 500000 });
  await repos.businessHealth.upsert({
    orgId: ORG_ID,
    businessId: BIZ_ID === business.id ? business.id : business.id,
    overallScore: 62,
    generatedAt: nowIso(),
  });
  return business;
}

describe("Decision Intelligence (Goal 21)", () => {
  let api: ReturnType<typeof createApiFromContainer>;
  let repos: ReturnType<typeof createInMemoryContainer>;
  let businessId: string;

  beforeEach(async () => {
    repos = createInMemoryContainer();
    api = createApiFromContainer(repos);
    const business = await setupBusiness(repos);
    businessId = business.id;
  });

  it("generates a decision when health data exists", async () => {
    const decision = await api.businessDecision.generate(ORG_ID, businessId, { recommendationIds: [] });
    expect(decision.id).toBeDefined();
    expect(decision.status).toBe("generated");
    expect(decision.objective).toBeTruthy();
    expect(decision.confidenceScore).toBeGreaterThanOrEqual(0);
  });

  it("throws when no health data exists", async () => {
    const repos2 = createInMemoryContainer();
    const api2 = createApiFromContainer(repos2);
    const biz2 = await repos2.businesses.create({ orgId: ORG_ID, name: "No Health", industry: "retail", employeeCount: 5, annualRevenue: 100000 });
    await expect(api2.businessDecision.generate(ORG_ID, biz2.id, { recommendationIds: [] })).rejects.toThrow("health data");
  });

  it("lists decisions for a business", async () => {
    await api.businessDecision.generate(ORG_ID, businessId, { recommendationIds: [] });
    await api.businessDecision.generate(ORG_ID, businessId, { recommendationIds: [] });
    const list = await api.businessDecision.list(ORG_ID, businessId);
    expect(list.length).toBe(2);
  });

  it("evaluates decision health", async () => {
    const decision = await api.businessDecision.generate(ORG_ID, businessId, { recommendationIds: [] });
    const { health } = await api.businessDecision.evaluate(ORG_ID, decision.id);
    expect(typeof health.score).toBe("number");
    expect(Array.isArray(health.issues)).toBe(true);
    expect(Array.isArray(health.recommendations)).toBe(true);
  });

  it("approves a decision and emits event", async () => {
    const events: string[] = [];
    repos.eventBus.subscribe("decision.approved", () => events.push("approved"));

    const decision = await api.businessDecision.generate(ORG_ID, businessId, { recommendationIds: [] });
    const approved = await api.businessDecision.approve(ORG_ID, decision.id);
    expect(approved.status).toBe("approved");
    expect(approved.approvedAt).toBeTruthy();
    expect(events).toContain("approved");
  });

  it("rejects a decision", async () => {
    const decision = await api.businessDecision.generate(ORG_ID, businessId, { recommendationIds: [] });
    const rejected = await api.businessDecision.reject(ORG_ID, decision.id);
    expect(rejected.status).toBe("rejected");
    expect(rejected.rejectedAt).toBeTruthy();
  });

  it("schedules an approved decision", async () => {
    const decision = await api.businessDecision.generate(ORG_ID, businessId, { recommendationIds: [] });
    await api.businessDecision.approve(ORG_ID, decision.id);
    const scheduled = await api.businessDecision.schedule(ORG_ID, decision.id);
    expect(scheduled.status).toBe("scheduled");
  });

  it("measures outcome and persists to business memory", async () => {
    const decision = await api.businessDecision.generate(ORG_ID, businessId, { recommendationIds: [] });
    const measured = await api.businessDecision.measure(ORG_ID, decision.id, {
      actualRoi: 50000,
      lessonsLearned: "Execution took longer than expected but ROI was positive",
    });
    expect(measured.status).toBe("measured");
    expect(measured.actualRoi).toBe(50000);

    // Learning loop: outcome stored in memory
    const memory = await repos.memoryRecords.get(
      ORG_ID, businessId, "business", businessId,
      `decision:${decision.id}:outcome`
    );
    expect(memory).toBeTruthy();
    expect((memory!.value as { actualRoi: number }).actualRoi).toBe(50000);
  });

  it("produces priority ranking for pending decisions", async () => {
    await api.businessDecision.generate(ORG_ID, businessId, { recommendationIds: [] });
    await api.businessDecision.generate(ORG_ID, businessId, { recommendationIds: [] });
    const ranking = await api.businessDecision.getPriorityRanking(ORG_ID, businessId);
    expect(Array.isArray(ranking)).toBe(true);
    if (ranking.length >= 2) {
      expect(ranking[0]!.score).toBeGreaterThanOrEqual(ranking[1]!.score);
    }
  });
});
