/**
 * Phase B — Job Service Integration Tests
 * Tests the complete job lifecycle including status transitions, events, and cross-tenant isolation.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createJobService } from "../services/jobService.js";
import type { BossEvent } from "@boss/events";

const ORG_A = "org-jobs-a";
const ORG_B = "org-jobs-b";
const BIZ_A = "biz-jobs-a";
const BIZ_B = "biz-jobs-b";

describe("Phase B — Job Service Flow", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("creates a job and persists correct fields", async () => {
    const svc = createJobService(c);
    const job = await svc.createJob(ORG_A, BIZ_A, {
      title: "Fix HVAC unit",
      description: "Annual maintenance",
      priority: "high",
      scheduledAt: "2026-07-10T09:00:00Z",
      estimatedDurationMinutes: 90,
      location: "123 Main St",
    });

    expect(job.id).toBeDefined();
    expect(job.orgId).toBe(ORG_A);
    expect(job.businessId).toBe(BIZ_A);
    expect(job.title).toBe("Fix HVAC unit");
    expect(job.description).toBe("Annual maintenance");
    expect(job.priority).toBe("high");
    expect(job.estimatedDurationMinutes).toBe(90);
    expect(job.location).toBe("123 Main St");
    expect(job.status).toBe("scheduled");
  });

  it("emits job.created event on create", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("job.created", (e) => seen.push(e as BossEvent));

    const svc = createJobService(c);
    const job = await svc.createJob(ORG_A, BIZ_A, { title: "Paint fence" });

    expect(seen).toHaveLength(1);
    expect(seen[0]!.type).toBe("job.created");
    expect((seen[0]!.payload as Record<string, unknown>).jobId).toBe(job.id);
  });

  it("transitions status: scheduled → in_progress → completed", async () => {
    const svc = createJobService(c);
    const job = await svc.createJob(ORG_A, BIZ_A, { title: "Plumbing repair" });

    const started = await svc.startJob(ORG_A, job.id);
    expect(started.status).toBe("in_progress");
    expect(started.startedAt).toBeDefined();

    const completed = await svc.completeJob(ORG_A, job.id, 120);
    expect(completed.status).toBe("completed");
    expect(completed.completedAt).toBeDefined();
    expect(completed.actualDurationMinutes).toBe(120);
  });

  it("emits job.status_changed when status changes via updateJob", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("job.status_changed", (e) => seen.push(e as BossEvent));

    const svc = createJobService(c);
    const job = await svc.createJob(ORG_A, BIZ_A, { title: "Electrical work" });
    await svc.updateJob(ORG_A, job.id, { status: "in_progress" });

    expect(seen.length).toBeGreaterThanOrEqual(1);
    const ev = seen[0]!;
    expect((ev.payload as Record<string, unknown>).newStatus).toBe("in_progress");
  });

  it("emits job.completed event on completeJob", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("job.completed", (e) => seen.push(e as BossEvent));

    const svc = createJobService(c);
    const job = await svc.createJob(ORG_A, BIZ_A, { title: "Roof repair" });
    await svc.completeJob(ORG_A, job.id);

    expect(seen).toHaveLength(1);
    expect((seen[0]!.payload as Record<string, unknown>).jobId).toBe(job.id);
  });

  it("listJobsByBusiness returns only jobs for that business", async () => {
    const svc = createJobService(c);
    await svc.createJob(ORG_A, BIZ_A, { title: "Job for A" });
    await svc.createJob(ORG_A, BIZ_A, { title: "Job for A 2" });
    await svc.createJob(ORG_A, BIZ_B, { title: "Job for B" });

    const jobsA = await svc.listJobsByBusiness(ORG_A, BIZ_A);
    expect(jobsA).toHaveLength(2);
    expect(jobsA.every((j) => j.businessId === BIZ_A)).toBe(true);
  });

  it("cross-tenant isolation: org-A jobs invisible to org-B", async () => {
    const svc = createJobService(c);
    await svc.createJob(ORG_A, BIZ_A, { title: "Org A job" });

    const jobsB = await svc.listJobsByBusiness(ORG_B, BIZ_A);
    expect(jobsB).toHaveLength(0);
  });

  it("soft deletes a job — not returned in list", async () => {
    const svc = createJobService(c);
    const job = await svc.createJob(ORG_A, BIZ_A, { title: "To be deleted" });
    await svc.deleteJob(ORG_A, job.id);

    const jobs = await svc.listJobsByBusiness(ORG_A, BIZ_A);
    expect(jobs.find((j) => j.id === job.id)).toBeUndefined();
  });

  it("creates jobs with all priority levels", async () => {
    const svc = createJobService(c);
    const priorities = ["low", "normal", "high", "urgent"] as const;
    for (const priority of priorities) {
      const job = await svc.createJob(ORG_A, BIZ_A, { title: `${priority} job`, priority });
      expect(job.priority).toBe(priority);
    }

    const jobs = await svc.listJobsByBusiness(ORG_A, BIZ_A);
    expect(jobs).toHaveLength(4);
  });

  it("getJob throws when job does not exist", async () => {
    const svc = createJobService(c);
    await expect(svc.getJob(ORG_A, "nonexistent-id")).rejects.toThrow();
  });
});
