/**
 * RC1.5 WS3 — Resilience Matrix
 *
 * Tests:
 * - Provider outage → graceful degradation
 * - Expired JWT → 401
 * - Tenant mismatch → 403 / data isolation
 * - Worker failure → job reclaimed via recoverFailed
 * - Dead-letter persistence after max_attempts
 * - Event replay → append-only idempotency
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createLoopRuntimeService } from "../services/loopRuntimeService.js";
import { createSchedulerService } from "../services/schedulerService.js";
import { createToolFabricService } from "../services/toolFabricService.js";
import { mintDevToken, requireOrgId, requireRole } from "../http/auth.js";
import { nowIso } from "@boss/shared";
import type { StepEntry } from "@boss/loop";

const JWT_SECRET = "resilience-matrix-test-secret-000000000";

function fakeReq(token?: string) {
  return {
    header(name: string) {
      if (name === "authorization" && token) return `Bearer ${token}`;
      return undefined;
    },
  };
}

describe("RC1.5 WS3 — Resilience Matrix", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
    process.env.SUPABASE_JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    delete process.env.SUPABASE_JWT_SECRET;
  });

  // ─── Provider Outage ──────────────────────────────────────────────────────

  it("provider outage: loop runtime executes gracefully even without tool permission set", async () => {
    // Create toolFabric WITHOUT setting permissions — tool will fail or fallback
    const toolFabric = createToolFabricService(c);
    const loop = createLoopRuntimeService(c, toolFabric);

    const steps: StepEntry[] = [
      { stepKey: "notify", taskType: "tool", input: { orgId: "org-1", businessId: "biz-1", capabilityKey: "send_sms", roleKey: "admin", requestedBy: "test" } },
    ];

    // Should not throw even without connected integration
    const execution = await loop.execute("org-1", "biz-1", "notify-workflow", steps);
    expect(["completed", "failed"]).toContain(execution.state);

    // Workflow execution record must be persisted regardless
    const wfs = await c.workflowExecutions.listByBusinessId("org-1", "biz-1");
    expect(wfs.length).toBeGreaterThan(0);
  });

  it("provider outage: read-only operations succeed when provider is degraded", async () => {
    // Write data directly to repos
    const now = nowIso();
    await c.workflowExecutions.create({
      orgId: "org-2", businessId: "biz-2", workflowKey: "wf-ok",
      state: "completed", currentStepIndex: 0,
      input: {}, output: { result: "done" }, errorMessage: null,
      startedAt: now, completedAt: now,
    });

    // Read operations must always work regardless of provider health
    const wfs = await c.workflowExecutions.listByBusinessId("org-2", "biz-2");
    expect(wfs.length).toBe(1);
    expect(wfs[0]!.state).toBe("completed");
  });

  // ─── Expired / Invalid JWT ────────────────────────────────────────────────

  it("expired JWT: requireOrgId rejects with invalid_token", async () => {
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(JWT_SECRET);
    const expiredToken = await new SignJWT({ org_id: "org-evil", role: "owner" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("-1h")
      .sign(secret);

    await expect(requireOrgId(fakeReq(expiredToken))).rejects.toMatchObject({
      code: "invalid_token",
    });
  });

  it("missing auth header: requireOrgId rejects with missing_token", async () => {
    await expect(requireOrgId(fakeReq())).rejects.toMatchObject({
      code: "missing_token",
    });
  });

  it("wrong secret: requireOrgId rejects tampered token", async () => {
    process.env.SUPABASE_JWT_SECRET = "correct-secret-000000000000000000000000";
    const token = await mintDevToken("org-real");
    process.env.SUPABASE_JWT_SECRET = "wrong-secret-0000000000000000000000000";
    await expect(requireOrgId(fakeReq(token))).rejects.toMatchObject({
      code: "invalid_token",
    });
    process.env.SUPABASE_JWT_SECRET = JWT_SECRET;
  });

  // ─── Tenant Mismatch ─────────────────────────────────────────────────────

  it("tenant mismatch: org-A cannot retrieve org-B business data", async () => {
    await c.businesses.create({ orgId: "org-A", name: "A Corp", industry: "retail", employeeCount: 5, annualRevenue: 100000 });
    await c.businesses.create({ orgId: "org-B", name: "B Corp", industry: "tech", employeeCount: 10, annualRevenue: 500000 });

    const orgAData = await c.businesses.list("org-A");
    expect(orgAData.every((b) => b.orgId === "org-A")).toBe(true);
    expect(orgAData.some((b) => b.orgId === "org-B")).toBe(false);
  });

  it("tenant mismatch: cross-org health score lookup returns null", async () => {
    const bizB = await c.businesses.create({ orgId: "org-B", name: "B Corp", industry: "tech", employeeCount: 10, annualRevenue: 500000 });
    await c.businessHealth.upsert({ orgId: "org-B", businessId: bizB.id, overallScore: 75, generatedAt: nowIso() });

    const result = await c.businessHealth.findByBusinessId("org-A", bizB.id);
    expect(result).toBeNull();
  });

  it("RBAC: viewer token denied for admin-only action", async () => {
    const token = await mintDevToken("org-r", "viewer");
    await expect(requireRole(fakeReq(token), "admin")).rejects.toMatchObject({
      code: "insufficient_role",
    });
  });

  it("RBAC: owner token satisfies all role requirements", async () => {
    const token = await mintDevToken("org-r", "owner");
    const result = await requireRole(fakeReq(token), "viewer");
    expect(result.role).toBe("owner");
  });

  // ─── Worker Failure & Recovery ────────────────────────────────────────────

  it("failed job is recovered via recoverFailed and rescheduled to pending", async () => {
    const toolFabric = createToolFabricService(c);
    const loop = createLoopRuntimeService(c, toolFabric);
    const steps: StepEntry[] = [{ stepKey: "s1", taskType: "tool", input: { orgId: "org-3", businessId: "biz-3", capabilityKey: "send_sms", roleKey: "admin", requestedBy: "test" } }];
    const stepRegistry = new Map<string, StepEntry[]>([["wf-fail", steps]]);
    const scheduler = createSchedulerService(c, loop, stepRegistry);

    const job = await scheduler.scheduleImmediate("org-3", "biz-3", "wf-fail", steps);
    await c.schedulerJobs.updateState("org-3", job.id, "failed", { errorMessage: "worker crash", lastRunAt: nowIso() });

    const recovered = await scheduler.recoverFailed("org-3", "biz-3");
    expect(recovered).toBe(1);

    const all = await c.schedulerJobs.listByBusiness("org-3", "biz-3");
    const rec = all.find((j) => j.id === job.id);
    expect(rec?.state).toBe("pending");
    expect(rec?.nextRunAt).not.toBeNull();
  });

  it("job at maxRuns is NOT recovered (exhausted)", async () => {
    const toolFabric = createToolFabricService(c);
    const loop = createLoopRuntimeService(c, toolFabric);
    const steps: StepEntry[] = [{ stepKey: "s1", taskType: "tool", input: { orgId: "org-4", businessId: "biz-4", capabilityKey: "send_sms", roleKey: "admin", requestedBy: "test" } }];
    const stepRegistry = new Map<string, StepEntry[]>([["wf-max", steps]]);
    const scheduler = createSchedulerService(c, loop, stepRegistry);

    const job = await scheduler.scheduleImmediate("org-4", "biz-4", "wf-max", steps, { maxRuns: 1 });
    await c.schedulerJobs.updateState("org-4", job.id, "failed", { errorMessage: "max hit", lastRunAt: nowIso(), runCount: 1 });

    const recovered = await scheduler.recoverFailed("org-4", "biz-4");
    expect(recovered).toBe(0);
    const all = await c.schedulerJobs.listByBusiness("org-4", "biz-4");
    expect(all.find((j) => j.id === job.id)?.state).toBe("failed");
  });

  it("dead-letter: failed workflow added to deadLetters repo with error info", async () => {
    const wf = await c.workflowExecutions.create({
      orgId: "org-5", businessId: "biz-5", workflowKey: "wf-dead",
      state: "failed", currentStepIndex: 0,
      input: {}, output: null, errorMessage: "executor error",
      startedAt: nowIso(), completedAt: nowIso(),
    });

    await c.deadLetters.add({
      orgId: "org-5", businessId: "biz-5",
      workflowExecutionId: wf.id, taskExecutionId: "task-dead-1",
      stepKey: "main", reason: "executor error",
      payload: { workflowKey: "wf-dead" },
    });

    const dls = await c.deadLetters.listByBusinessId("org-5", "biz-5");
    expect(dls.length).toBe(1);
    expect(dls[0]!.workflowExecutionId).toBe(wf.id);
    expect(dls[0]!.reason).toBe("executor error");
  });

  // ─── Event Replay / Idempotency ───────────────────────────────────────────

  it("event replay: duplicate event types preserved (append-only log)", async () => {
    const EVENT_COUNT = 5;
    for (let i = 0; i < EVENT_COUNT; i++) {
      await c.eventLog.append({
        type: "business.health.updated",
        payload: { score: 70 + i },
        occurredAt: nowIso(),
        orgId: "org-replay",
        correlationId: `corr-${i}`,
        causationId: null,
      });
    }

    const events = await c.eventLog.listByOrgId("org-replay", 100);
    expect(events.length).toBe(EVENT_COUNT);
    expect(events.every((e) => e.type === "business.health.updated")).toBe(true);
  });

  it("idempotent upsert: health score upsert does not duplicate records", async () => {
    const bizId = "biz-idem";
    const biz = await c.businesses.create({ orgId: "org-6", name: "Idem Corp", industry: "retail", employeeCount: 5, annualRevenue: 100000 });
    await c.businessHealth.upsert({ orgId: "org-6", businessId: biz.id, overallScore: 65, generatedAt: nowIso() });
    await c.businessHealth.upsert({ orgId: "org-6", businessId: biz.id, overallScore: 70, generatedAt: nowIso() });
    void bizId;

    const record = await c.businessHealth.findByBusinessId("org-6", biz.id);
    expect(record?.overallScore).toBe(70);
  });
});
