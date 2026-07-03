/**
 * RC1.5 WS7 — Operational Readiness
 *
 * Verifies:
 * - Health endpoints return structured JSON with component status
 * - Metrics endpoint exposes runtime counters
 * - Scheduler exposes pending jobs with runAt timestamps
 * - Mission Control projections include dead letter + workflow visibility
 * - Tool execution audit log has actor, org, and timestamps
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Server } from "node:http";
import { createInMemoryContainer } from "../container.js";
import { createApiFromContainer } from "../index.js";
import { createHttpServer } from "../http/server.js";
import { createSchedulerService } from "../services/schedulerService.js";
import { createLoopRuntimeService } from "../services/loopRuntimeService.js";
import { createMissionControlService } from "../services/missionControlService.js";
import { createToolFabricService } from "../services/toolFabricService.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { nowIso } from "@boss/shared";
import type { StepEntry } from "@boss/loop";

const JWT_SECRET = "operational-readiness-test-secret-0000";

// ─── HTTP Server Tests ────────────────────────────────────────────────────────

describe("RC1.5 WS7 — Health & Metrics HTTP Endpoints", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.SUPABASE_JWT_SECRET = JWT_SECRET;
    const repos = createInMemoryContainer();
    const api = createApiFromContainer(repos);
    const app = createHttpServer(api);
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const addr = server.address();
    if (addr && typeof addr === "object") {
      baseUrl = `http://127.0.0.1:${addr.port}`;
    }
  });

  afterAll(() => {
    server.close();
    delete process.env.SUPABASE_JWT_SECRET;
  });

  it("GET /health returns 200 with structured JSON including status", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(typeof body.uptimeMs).toBe("number");
    expect(body.memoryMb).toBeDefined();
    expect(body.counters).toBeDefined();
  });

  it("GET /health is unauthenticated (available for load balancers)", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
  });

  it("GET /health response includes x-trace-id for distributed tracing", async () => {
    const res = await fetch(`${baseUrl}/health`);
    const traceId = res.headers.get("x-trace-id");
    expect(traceId).toBeTruthy();
  });

  it("GET /api/v1/metrics returns runtime counters", async () => {
    const res = await fetch(`${baseUrl}/api/v1/metrics`);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.counters).toBeDefined();
    expect(typeof (body.counters as Record<string, unknown>).httpRequests).toBe("number");
  });

  it("GET /health response time is under 200ms", async () => {
    const start = Date.now();
    await fetch(`${baseUrl}/health`);
    expect(Date.now() - start).toBeLessThan(200);
  });

  it("authenticated requests to business endpoint reject missing token with 401", async () => {
    // Business profile endpoint requires org authentication
    const res = await fetch(`${baseUrl}/api/v1/businesses/some-id`);
    expect(res.status).toBe(401);
  });
});

// ─── Scheduler Diagnostics ────────────────────────────────────────────────────

describe("RC1.5 WS7 — Scheduler Operational Diagnostics", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeAll(() => {
    c = createInMemoryContainer();
  });

  it("scheduler exposes pending jobs with runAt timestamps", async () => {
    const toolFabric = createToolFabricService(c);
    const loop = createLoopRuntimeService(c, toolFabric);
    const steps: StepEntry[] = [{ stepKey: "s1", taskType: "tool", input: { orgId: "org-sched-diag", businessId: "biz-1", capabilityKey: "send_sms", roleKey: "admin", requestedBy: "test" } }];
    const stepRegistry = new Map<string, StepEntry[]>([["wf-diag", steps]]);
    const scheduler = createSchedulerService(c, loop, stepRegistry);

    await scheduler.scheduleImmediate("org-sched-diag", "biz-1", "wf-diag", steps);
    await scheduler.scheduleImmediate("org-sched-diag", "biz-1", "wf-diag", steps);

    const jobs = await c.schedulerJobs.listByBusiness("org-sched-diag", "biz-1");
    expect(jobs.length).toBe(2);
    expect(jobs.every((j) => j.runAt !== null)).toBe(true);
    expect(jobs.every((j) => j.state === "pending")).toBe(true);
  });

  it("scheduler cron job is created with cronExpression and triggerType", async () => {
    const toolFabric = createToolFabricService(c);
    const loop = createLoopRuntimeService(c, toolFabric);
    const steps: StepEntry[] = [{ stepKey: "s1", taskType: "tool", input: { orgId: "org-cron-diag", businessId: "biz-cron", capabilityKey: "send_sms", roleKey: "admin", requestedBy: "test" } }];
    const stepRegistry = new Map<string, StepEntry[]>([["wf-cron", steps]]);
    const scheduler = createSchedulerService(c, loop, stepRegistry);

    const job = await scheduler.scheduleCron("org-cron-diag", "biz-cron", "wf-cron", "0 9 * * 1", steps);
    expect(job.cronExpression).toBe("0 9 * * 1");
    expect(job.triggerType).toBe("cron");
    expect(job.state).toBe("pending");
  });

  it("failed job recovery is diagnosable: recoverFailed returns count", async () => {
    const toolFabric = createToolFabricService(c);
    const loop = createLoopRuntimeService(c, toolFabric);
    const steps: StepEntry[] = [{ stepKey: "s1", taskType: "tool", input: { orgId: "org-recover-diag", businessId: "biz-r", capabilityKey: "send_sms", roleKey: "admin", requestedBy: "test" } }];
    const stepRegistry = new Map<string, StepEntry[]>([["wf-r", steps]]);
    const scheduler = createSchedulerService(c, loop, stepRegistry);

    const job = await scheduler.scheduleImmediate("org-recover-diag", "biz-r", "wf-r", steps);
    await c.schedulerJobs.updateState("org-recover-diag", job.id, "failed", { errorMessage: "timeout", lastRunAt: nowIso() });

    const count = await scheduler.recoverFailed("org-recover-diag", "biz-r");
    expect(count).toBe(1);

    const recovered = await c.schedulerJobs.listByBusiness("org-recover-diag", "biz-r");
    expect(recovered.find((j) => j.id === job.id)?.state).toBe("pending");
    expect(recovered.find((j) => j.id === job.id)?.nextRunAt).not.toBeNull();
  });
});

// ─── Mission Control Operational Visibility ───────────────────────────────────

describe("RC1.5 WS7 — Mission Control Operational Visibility", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeAll(() => {
    c = createInMemoryContainer();
  });

  it("mission control snapshot includes dead letter count for recovery visibility", async () => {
    const orgId = "org-mc-ops";
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({
      orgId, name: "Ops Corp", industry: "retail",
      employeeCount: 10, annualRevenue: 500000,
      businessType: "retail", yearsOperating: 5,
      locationCount: 1, businessHours: "9-5",
    });

    await c.deadLetters.add({
      orgId, businessId: business.id,
      jobType: "workflow", jobId: "wf-dead-1",
      errorMessage: "max retries exceeded",
      attemptCount: 3, payload: {}, failedAt: nowIso(),
    });

    const mcSvc = createMissionControlService(c);
    const snapshot = await mcSvc.getSnapshot(orgId, business.id);
    expect(snapshot.deadLetters).toBeDefined();
    expect(Array.isArray(snapshot.deadLetters)).toBe(true);
    expect(snapshot.deadLetters.length).toBeGreaterThan(0);
  });

  it("mission control snapshot includes workflow execution records", async () => {
    const orgId = "org-mc-timeline";
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({
      orgId, name: "Timeline Corp", industry: "retail",
      employeeCount: 10, annualRevenue: 500000,
      businessType: "retail", yearsOperating: 5,
      locationCount: 1, businessHours: "9-5",
    });

    const now = nowIso();
    await c.workflowExecutions.create({
      orgId, businessId: business.id, workflowKey: "wf-monitor",
      state: "completed", currentStepIndex: 0,
      input: {}, output: { result: "ok" }, errorMessage: null,
      startedAt: now, completedAt: now,
    });

    const mcSvc = createMissionControlService(c);
    const snapshot = await mcSvc.getSnapshot(orgId, business.id);
    expect(snapshot.workflows).toBeDefined();
    expect(snapshot.workflows.length).toBeGreaterThan(0);
  });

  it("event log provides chronological audit trail per org", async () => {
    const orgId = "org-audit-ops";
    const events = [
      { type: "business.created", payload: {}, occurredAt: nowIso(), orgId, correlationId: "c1", causationId: null },
      { type: "mri.completed", payload: {}, occurredAt: nowIso(), orgId, correlationId: "c2", causationId: "c1" },
      { type: "health.generated", payload: {}, occurredAt: nowIso(), orgId, correlationId: "c3", causationId: "c2" },
    ];

    for (const e of events) {
      await c.eventLog.append(e);
    }

    const log = await c.eventLog.listByOrgId(orgId, 100);
    expect(log.length).toBe(3);
    expect(log.map((e) => e.type)).toContain("business.created");
    expect(log.map((e) => e.type)).toContain("mri.completed");
    expect(log.map((e) => e.type)).toContain("health.generated");
  });

  it("tool execution audit log contains actor, org, and timestamps", async () => {
    const now = nowIso();
    await c.toolExecutions.create({
      orgId: "org-tool-audit", businessId: "biz-tool-audit",
      toolKey: "smtp.send", capabilityKey: "send_email",
      providerKey: "smtp", requestedBy: "user-admin-001",
      status: "succeeded", input: { to: "a@b.com" }, output: { messageId: "m1" },
      errorMessage: null, startedAt: now, completedAt: now,
    });

    const execs = await c.toolExecutions.listByBusinessId("org-tool-audit", "biz-tool-audit");
    expect(execs.length).toBe(1);
    expect(execs[0].requestedBy).toBe("user-admin-001");
    expect(execs[0].startedAt).toBeTruthy();
    expect(execs[0].completedAt).toBeTruthy();
    expect(execs[0].orgId).toBe("org-tool-audit");
  });

  it("listPending scheduler returns all pending jobs across business for ops dashboard", async () => {
    const toolFabric = createToolFabricService(c);
    const loop = createLoopRuntimeService(c, toolFabric);
    const orgId = "org-pending-list";
    const steps: StepEntry[] = [{ stepKey: "s1", taskType: "tool", input: { orgId, businessId: "biz-pd", capabilityKey: "send_sms", roleKey: "admin", requestedBy: "test" } }];
    const stepRegistry = new Map<string, StepEntry[]>([["wf-pd", steps]]);
    const scheduler = createSchedulerService(c, loop, stepRegistry);

    await scheduler.scheduleImmediate(orgId, "biz-pd", "wf-pd", steps);
    await scheduler.scheduleImmediate(orgId, "biz-pd", "wf-pd", steps);
    await scheduler.scheduleImmediate(orgId, "biz-pd", "wf-pd", steps);

    const pending = await scheduler.listPending(orgId, "biz-pd");
    expect(pending.length).toBe(3);
    expect(pending.every((j) => j.state === "pending")).toBe(true);
    expect(pending.every((j) => j.orgId === orgId)).toBe(true);
  });
});
