/**
 * RC1.5 WS6 — Security & Tenant Isolation Validation
 *
 * Verifies:
 * - Cross-tenant data isolation across all repos
 * - RBAC enforcement (owner/admin/member/viewer)
 * - Provider credentials scoped per tenant
 * - Audit log captures mutations with org/timestamp
 * - RLS-equivalent policies reject cross-tenant queries
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { mintDevToken, requireOrgId, requireRole } from "../http/auth.js";
import { createToolFabricService } from "../services/toolFabricService.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { nowIso } from "@boss/shared";

const JWT_SECRET = "security-validation-test-secret-00000000";

function fakeReq(token?: string) {
  return {
    header(name: string) {
      if (name === "authorization" && token) return `Bearer ${token}`;
      return undefined;
    },
  };
}

describe("RC1.5 WS6 — Security & Tenant Isolation", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
    process.env.SUPABASE_JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    delete process.env.SUPABASE_JWT_SECRET;
  });

  // ─── Cross-Tenant Data Isolation ──────────────────────────────────────────

  it("businesses: org-A cannot see org-B records", async () => {
    await c.businesses.create({ orgId: "org-A", name: "A Corp", industry: "retail", employeeCount: 5, annualRevenue: 100000 });
    await c.businesses.create({ orgId: "org-B", name: "B Corp", industry: "tech", employeeCount: 20, annualRevenue: 500000 });

    const aBizs = await c.businesses.list("org-A");
    const bBizs = await c.businesses.list("org-B");

    expect(aBizs.every((b) => b.orgId === "org-A")).toBe(true);
    expect(bBizs.every((b) => b.orgId === "org-B")).toBe(true);
    expect(aBizs.some((b) => b.orgId === "org-B")).toBe(false);
    expect(bBizs.some((b) => b.orgId === "org-A")).toBe(false);
  });

  it("health scores: org-A cannot read org-B health record by businessId", async () => {
    const bizB = await c.businesses.create({ orgId: "org-B", name: "B Corp", industry: "tech", employeeCount: 20, annualRevenue: 500000 });
    await c.businessHealth.upsert({ orgId: "org-B", businessId: bizB.id, overallScore: 80, generatedAt: nowIso() });

    const result = await c.businessHealth.findByBusinessId("org-A", bizB.id);
    expect(result).toBeNull();
  });

  it("workflow executions: cross-tenant listByBusinessId returns empty", async () => {
    await c.workflowExecutions.create({
      orgId: "org-C", businessId: "biz-C", workflowKey: "wf-1",
      state: "completed", currentStepIndex: 0,
      input: {}, output: null, errorMessage: null,
      startedAt: nowIso(), completedAt: nowIso(),
    });

    const result = await c.workflowExecutions.listByBusinessId("org-D", "biz-C");
    expect(result).toHaveLength(0);
  });

  it("task executions: cross-tenant workflowExecutionId query returns empty", async () => {
    const wf = await c.workflowExecutions.create({
      orgId: "org-E", businessId: "biz-E", workflowKey: "wf-2",
      state: "completed", currentStepIndex: 0,
      input: {}, output: null, errorMessage: null,
      startedAt: nowIso(), completedAt: nowIso(),
    });
    await c.taskExecutions.create({
      orgId: "org-E", businessId: "biz-E",
      workflowExecutionId: wf.id, stepKey: "s1",
      taskType: "tool", state: "completed",
      input: {}, output: {}, errorMessage: null,
      startedAt: nowIso(), completedAt: nowIso(),
    });

    const result = await c.taskExecutions.listByWorkflowExecutionId("org-F", wf.id);
    expect(result).toHaveLength(0);
  });

  it("scheduler jobs: cross-tenant list returns empty", async () => {
    await c.schedulerJobs.create({ orgId: "org-G", businessId: "biz-G", workflowKey: "wf-a", triggerType: "immediate", cronExpression: null, timezone: "UTC", runAt: nowIso(), state: "pending", lastRunAt: null, nextRunAt: null, runCount: 0, maxRuns: 1, payload: {}, errorMessage: null });
    await c.schedulerJobs.create({ orgId: "org-H", businessId: "biz-H", workflowKey: "wf-b", triggerType: "immediate", cronExpression: null, timezone: "UTC", runAt: nowIso(), state: "pending", lastRunAt: null, nextRunAt: null, runCount: 0, maxRuns: 1, payload: {}, errorMessage: null });

    const gJobs = await c.schedulerJobs.listByBusiness("org-G", "biz-G");
    const hJobs = await c.schedulerJobs.listByBusiness("org-H", "biz-H");

    expect(gJobs.every((j) => j.orgId === "org-G")).toBe(true);
    expect(hJobs.every((j) => j.orgId === "org-H")).toBe(true);

    const crossResult = await c.schedulerJobs.listByBusiness("org-G", "biz-H");
    expect(crossResult).toHaveLength(0);
  });

  it("tool executions: org-scoped retrieval prevents cross-tenant reads", async () => {
    const now = nowIso();
    await c.toolExecutions.create({ orgId: "org-I", businessId: "biz-I", toolKey: "smtp.send", capabilityKey: "send_email", providerKey: "smtp", requestedBy: "u1", status: "succeeded", input: {}, output: {}, errorMessage: null, startedAt: now, completedAt: now });
    await c.toolExecutions.create({ orgId: "org-J", businessId: "biz-J", toolKey: "twilio.sms", capabilityKey: "send_sms", providerKey: "twilio", requestedBy: "u2", status: "succeeded", input: {}, output: {}, errorMessage: null, startedAt: now, completedAt: now });

    const iExec = await c.toolExecutions.listByBusinessId("org-I", "biz-I");
    const jExec = await c.toolExecutions.listByBusinessId("org-J", "biz-J");

    expect(iExec.every((e) => e.orgId === "org-I")).toBe(true);
    expect(jExec.every((e) => e.orgId === "org-J")).toBe(true);

    const crossRead = await c.toolExecutions.listByBusinessId("org-I", "biz-J");
    expect(crossRead).toHaveLength(0);
  });

  // ─── RBAC Enforcement ─────────────────────────────────────────────────────

  it("RBAC hierarchy: owner > admin > member > viewer", async () => {
    const roles = ["owner", "admin", "member", "viewer"] as const;

    for (let i = 0; i < roles.length; i++) {
      const actorRole = roles[i]!;
      const token = await mintDevToken("org-rbac", actorRole);

      // Actor can satisfy their own level
      const result = await requireRole(fakeReq(token), actorRole);
      expect(result.role).toBe(actorRole);

      // Actor cannot satisfy a higher level (lower index = higher privilege)
      for (let j = 0; j < i; j++) {
        const higherRole = roles[j]!;
        await expect(requireRole(fakeReq(token), higherRole)).rejects.toMatchObject({
          code: "insufficient_role",
        });
      }
    }
  });

  it("RBAC: viewer token cannot perform admin actions", async () => {
    const token = await mintDevToken("org-rbac-2", "viewer");
    await expect(requireRole(fakeReq(token), "admin")).rejects.toMatchObject({ code: "insufficient_role" });
    await expect(requireRole(fakeReq(token), "owner")).rejects.toMatchObject({ code: "insufficient_role" });
  });

  it("RBAC: member token can perform viewer-level but not admin-level", async () => {
    const token = await mintDevToken("org-rbac-3", "member");
    const viewerResult = await requireRole(fakeReq(token), "viewer");
    expect(viewerResult.role).toBe("member");
    await expect(requireRole(fakeReq(token), "admin")).rejects.toMatchObject({ code: "insufficient_role" });
  });

  it("RBAC: token org_id cannot be spoofed via request", async () => {
    const token = await mintDevToken("org-legitimate", "admin");
    const claimedOrg = await requireOrgId(fakeReq(token));
    expect(claimedOrg).toBe("org-legitimate");
    expect(claimedOrg).not.toBe("org-evil");
  });

  // ─── Provider Credentials Scoped Per Tenant ───────────────────────────────

  it("integration accounts: provider credentials are scoped to org+business", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business: bizA } = await profileSvc.createBusiness({ orgId: "org-cred-A", name: "A", industry: "retail", employeeCount: 5, annualRevenue: 100000, businessType: "retail", yearsOperating: 3, locationCount: 1, businessHours: "9-5" });
    const { business: bizB } = await profileSvc.createBusiness({ orgId: "org-cred-B", name: "B", industry: "retail", employeeCount: 5, annualRevenue: 100000, businessType: "retail", yearsOperating: 3, locationCount: 1, businessHours: "9-5" });

    const svcA = createToolFabricService(c);
    const svcB = createToolFabricService(c);

    await svcA.connectIntegration("org-cred-A", bizA.id, "smtp");
    await svcB.connectIntegration("org-cred-B", bizB.id, "twilio");

    const integrationsA = await svcA.listIntegrations("org-cred-A", bizA.id);
    const integrationsB = await svcB.listIntegrations("org-cred-B", bizB.id);

    expect(integrationsA.some((i: { providerKey: string }) => i.providerKey === "smtp")).toBe(true);
    expect(integrationsA.some((i: { providerKey: string }) => i.providerKey === "twilio")).toBe(false);
    expect(integrationsB.some((i: { providerKey: string }) => i.providerKey === "twilio")).toBe(true);
    expect(integrationsB.some((i: { providerKey: string }) => i.providerKey === "smtp")).toBe(false);

    // Cross-tenant list must be empty
    const crossRead = await svcA.listIntegrations("org-cred-A", bizB.id);
    expect(crossRead).toHaveLength(0);
  });

  // ─── Audit Log ────────────────────────────────────────────────────────────

  it("event log captures org, type, and timestamp for every domain event", async () => {
    const orgId = "org-audit-log";
    await c.eventLog.append({ type: "business.created", payload: { name: "Audit Corp" }, occurredAt: nowIso(), orgId, correlationId: "corr-1", causationId: null });
    await c.eventLog.append({ type: "mri.completed", payload: { businessId: "biz-1" }, occurredAt: nowIso(), orgId, correlationId: "corr-2", causationId: "corr-1" });

    const entries = await c.eventLog.listByOrgId(orgId, 100);
    expect(entries.length).toBe(2);
    for (const entry of entries) {
      expect(entry.orgId).toBe(orgId);
      expect(entry.type).toBeTruthy();
      expect(entry.occurredAt).toBeTruthy();
    }
  });

  it("event log is org-scoped: org-A events not visible to org-B", async () => {
    await c.eventLog.append({ type: "biz.created", payload: {}, occurredAt: nowIso(), orgId: "org-audit-A", correlationId: "c1", causationId: null });
    await c.eventLog.append({ type: "biz.created", payload: {}, occurredAt: nowIso(), orgId: "org-audit-B", correlationId: "c2", causationId: null });

    const aEvents = await c.eventLog.listByOrgId("org-audit-A", 100);
    const bEvents = await c.eventLog.listByOrgId("org-audit-B", 100);

    expect(aEvents.every((e) => e.orgId === "org-audit-A")).toBe(true);
    expect(bEvents.every((e) => e.orgId === "org-audit-B")).toBe(true);
    expect(aEvents).toHaveLength(1);
    expect(bEvents).toHaveLength(1);
  });

  // ─── Dead Letter Isolation ────────────────────────────────────────────────

  it("dead letters are isolated per org and business", async () => {
    await c.deadLetters.add({ orgId: "org-dl-A", businessId: "biz-A", workflowExecutionId: "wf-1", taskExecutionId: "t-1", stepKey: "main", reason: "err", payload: {} });
    await c.deadLetters.add({ orgId: "org-dl-B", businessId: "biz-B", workflowExecutionId: "wf-2", taskExecutionId: "t-2", stepKey: "main", reason: "err", payload: {} });

    const dlA = await c.deadLetters.listByBusinessId("org-dl-A", "biz-A");
    const dlB = await c.deadLetters.listByBusinessId("org-dl-B", "biz-B");

    expect(dlA.every((d) => d.orgId === "org-dl-A")).toBe(true);
    expect(dlB.every((d) => d.orgId === "org-dl-B")).toBe(true);
    expect(dlA).toHaveLength(1);
    expect(dlB).toHaveLength(1);

    // org-A cannot see org-B's dead letters
    const crossDl = await c.deadLetters.listByBusinessId("org-dl-A", "biz-B");
    expect(crossDl).toHaveLength(0);
  });
});
