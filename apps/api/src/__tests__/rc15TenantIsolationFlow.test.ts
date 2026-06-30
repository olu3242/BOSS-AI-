/**
 * RC1.5 WS6 — Security & Tenant Isolation.
 * Verifies that all repositories enforce org_id scoping at the query level
 * and that cross-tenant data leakage cannot occur through normal API paths.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { nowIso } from "@boss/shared";

describe("RC1.5 WS6 — Tenant Isolation", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("businesses are scoped by orgId", async () => {
    await c.businesses.create({ orgId: "org-1", name: "Biz A", industry: "retail", employeeCount: 5, annualRevenue: 100000 });
    await c.businesses.create({ orgId: "org-2", name: "Biz B", industry: "tech", employeeCount: 20, annualRevenue: 500000 });

    const org1Bizs = await c.businesses.list("org-1");
    const org2Bizs = await c.businesses.list("org-2");

    expect(org1Bizs.every((b) => b.orgId === "org-1")).toBe(true);
    expect(org2Bizs.every((b) => b.orgId === "org-2")).toBe(true);
    expect(org1Bizs.length).toBe(1);
    expect(org2Bizs.length).toBe(1);
  });

  it("health scores are scoped by orgId+businessId", async () => {
    // Write health records directly to keep test fast
    const bizA = await c.businesses.create({ orgId: "org-1", name: "A", industry: "retail", employeeCount: 5, annualRevenue: 100000 });
    const bizB = await c.businesses.create({ orgId: "org-2", name: "B", industry: "tech", employeeCount: 20, annualRevenue: 500000 });

    await c.businessHealth.upsert({ orgId: "org-1", businessId: bizA.id, overallScore: 72, generatedAt: nowIso() });
    await c.businessHealth.upsert({ orgId: "org-2", businessId: bizB.id, overallScore: 55, generatedAt: nowIso() });

    const healthA = await c.businessHealth.findByBusinessId("org-1", bizA.id);
    const healthB = await c.businessHealth.findByBusinessId("org-2", bizB.id);

    expect(healthA?.businessId).toBe(bizA.id);
    expect(healthB?.businessId).toBe(bizB.id);
    // org-1 cannot see org-2's health
    const wrongOrg = await c.businessHealth.findByBusinessId("org-1", bizB.id);
    expect(wrongOrg).toBeNull();
  });

  it("workflow executions are isolated per tenant", async () => {
    await c.workflowExecutions.create({ orgId: "org-A", businessId: "biz-A", workflowKey: "wf-1", state: "completed", currentStepIndex: 0, input: {}, output: null, errorMessage: null, startedAt: nowIso(), completedAt: nowIso() });
    await c.workflowExecutions.create({ orgId: "org-B", businessId: "biz-B", workflowKey: "wf-1", state: "completed", currentStepIndex: 0, input: {}, output: null, errorMessage: null, startedAt: nowIso(), completedAt: nowIso() });

    const wfsA = await c.workflowExecutions.listByBusinessId("org-A", "biz-A");
    const wfsB = await c.workflowExecutions.listByBusinessId("org-B", "biz-B");

    expect(wfsA.every((w) => w.orgId === "org-A")).toBe(true);
    expect(wfsB.every((w) => w.orgId === "org-B")).toBe(true);
    expect(wfsA.length).toBe(1);
    expect(wfsB.length).toBe(1);
  });

  it("scheduler jobs are isolated per tenant", async () => {
    await c.schedulerJobs.create({ orgId: "org-1", businessId: "biz-1", workflowKey: "wf-a", triggerType: "immediate", cronExpression: null, timezone: "UTC", runAt: nowIso(), state: "pending", lastRunAt: null, nextRunAt: null, runCount: 0, maxRuns: 1, payload: {}, errorMessage: null });
    await c.schedulerJobs.create({ orgId: "org-2", businessId: "biz-2", workflowKey: "wf-b", triggerType: "immediate", cronExpression: null, timezone: "UTC", runAt: nowIso(), state: "pending", lastRunAt: null, nextRunAt: null, runCount: 0, maxRuns: 1, payload: {}, errorMessage: null });

    const jobs1 = await c.schedulerJobs.listByBusiness("org-1", "biz-1");
    const jobs2 = await c.schedulerJobs.listByBusiness("org-2", "biz-2");

    expect(jobs1.every((j) => j.orgId === "org-1")).toBe(true);
    expect(jobs2.every((j) => j.orgId === "org-2")).toBe(true);
  });

  it("tool executions are scoped per org", async () => {
    const now = nowIso();
    await c.toolExecutions.create({ orgId: "org-1", businessId: "biz-1", toolKey: "twilio.send_sms", capabilityKey: "send_sms", providerKey: "twilio", requestedBy: "u1", status: "succeeded", input: {}, output: {}, errorMessage: null, startedAt: now, completedAt: now });
    await c.toolExecutions.create({ orgId: "org-2", businessId: "biz-2", toolKey: "gmail.send_email", capabilityKey: "send_email", providerKey: "gmail", requestedBy: "u2", status: "succeeded", input: {}, output: {}, errorMessage: null, startedAt: now, completedAt: now });

    const exec1 = await c.toolExecutions.listByBusinessId("org-1", "biz-1");
    const exec2 = await c.toolExecutions.listByBusinessId("org-2", "biz-2");

    expect(exec1.every((e) => e.orgId === "org-1")).toBe(true);
    expect(exec2.every((e) => e.orgId === "org-2")).toBe(true);
  });

  it("event log is filtered by orgId", async () => {
    await c.eventLog.append({ type: "test.event", payload: {}, occurredAt: nowIso(), orgId: "org-A", correlationId: null, causationId: null });
    await c.eventLog.append({ type: "test.event", payload: {}, occurredAt: nowIso(), orgId: "org-B", correlationId: null, causationId: null });

    const eventsA = await c.eventLog.listByOrgId("org-A");
    const eventsB = await c.eventLog.listByOrgId("org-B");

    expect(eventsA.every((e) => e.orgId === "org-A")).toBe(true);
    expect(eventsB.every((e) => e.orgId === "org-B")).toBe(true);
  });
});
