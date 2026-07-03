/**
 * Phase B — Appointment Service Integration Tests
 * Tests appointment lifecycle, status transitions, and cross-tenant isolation.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createAppointmentService } from "../services/appointmentService.js";
import { createJobService } from "../services/jobService.js";
import type { BossEvent } from "@boss/events";

const ORG_A = "org-appt-a";
const ORG_B = "org-appt-b";
const BIZ_A = "biz-appt-a";
const BIZ_B = "biz-appt-b";

describe("Phase B — Appointment Service Flow", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("creates appointment with correct fields", async () => {
    const svc = createAppointmentService(c);
    const appt = await svc.createAppointment(ORG_A, BIZ_A, {
      title: "Initial consultation",
      startAt: "2026-07-15T10:00:00Z",
      endAt: "2026-07-15T11:00:00Z",
      location: "Office",
      notes: "Bring ID",
    });

    expect(appt.id).toBeDefined();
    expect(appt.orgId).toBe(ORG_A);
    expect(appt.businessId).toBe(BIZ_A);
    expect(appt.title).toBe("Initial consultation");
    expect(appt.startAt).toBe("2026-07-15T10:00:00Z");
    expect(appt.endAt).toBe("2026-07-15T11:00:00Z");
    expect(appt.status).toBe("scheduled");
    expect(appt.location).toBe("Office");
  });

  it("emits appointment.created event", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("appointment.created", (e) => seen.push(e as BossEvent));

    const svc = createAppointmentService(c);
    const appt = await svc.createAppointment(ORG_A, BIZ_A, {
      title: "Checkup",
      startAt: "2026-07-16T09:00:00Z",
      endAt: "2026-07-16T09:30:00Z",
    });

    expect(seen).toHaveLength(1);
    expect((seen[0]!.payload as Record<string, unknown>).appointmentId).toBe(appt.id);
  });

  it("confirms appointment → status becomes confirmed", async () => {
    const svc = createAppointmentService(c);
    const appt = await svc.createAppointment(ORG_A, BIZ_A, {
      title: "Follow-up",
      startAt: "2026-07-20T14:00:00Z",
      endAt: "2026-07-20T15:00:00Z",
    });

    const confirmed = await svc.confirmAppointment(ORG_A, appt.id);
    expect(confirmed.status).toBe("confirmed");
  });

  it("emits appointment.confirmed event", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("appointment.confirmed", (e) => seen.push(e as BossEvent));

    const svc = createAppointmentService(c);
    const appt = await svc.createAppointment(ORG_A, BIZ_A, {
      title: "Meeting",
      startAt: "2026-07-22T10:00:00Z",
      endAt: "2026-07-22T11:00:00Z",
    });
    await svc.confirmAppointment(ORG_A, appt.id);

    expect(seen).toHaveLength(1);
    expect((seen[0]!.payload as Record<string, unknown>).appointmentId).toBe(appt.id);
  });

  it("cancels appointment → status becomes cancelled", async () => {
    const svc = createAppointmentService(c);
    const appt = await svc.createAppointment(ORG_A, BIZ_A, {
      title: "Appointment to cancel",
      startAt: "2026-07-25T10:00:00Z",
      endAt: "2026-07-25T11:00:00Z",
    });

    const cancelled = await svc.cancelAppointment(ORG_A, appt.id);
    expect(cancelled.status).toBe("cancelled");
  });

  it("marks appointment as no_show via updateAppointment", async () => {
    const svc = createAppointmentService(c);
    const appt = await svc.createAppointment(ORG_A, BIZ_A, {
      title: "No-show appointment",
      startAt: "2026-07-18T09:00:00Z",
      endAt: "2026-07-18T10:00:00Z",
    });

    const updated = await svc.updateAppointment(ORG_A, appt.id, { status: "no_show" });
    expect(updated.status).toBe("no_show");
  });

  it("listByBusiness returns only appointments for that business", async () => {
    const svc = createAppointmentService(c);
    await svc.createAppointment(ORG_A, BIZ_A, {
      title: "Appt A1",
      startAt: "2026-08-01T10:00:00Z",
      endAt: "2026-08-01T11:00:00Z",
    });
    await svc.createAppointment(ORG_A, BIZ_A, {
      title: "Appt A2",
      startAt: "2026-08-02T10:00:00Z",
      endAt: "2026-08-02T11:00:00Z",
    });
    await svc.createAppointment(ORG_A, BIZ_B, {
      title: "Appt B1",
      startAt: "2026-08-03T10:00:00Z",
      endAt: "2026-08-03T11:00:00Z",
    });

    const appts = await svc.listByBusiness(ORG_A, BIZ_A);
    expect(appts).toHaveLength(2);
    expect(appts.every((a) => a.businessId === BIZ_A)).toBe(true);
  });

  it("cross-tenant isolation: org-A appointments invisible to org-B", async () => {
    const svc = createAppointmentService(c);
    await svc.createAppointment(ORG_A, BIZ_A, {
      title: "Org A appt",
      startAt: "2026-08-05T10:00:00Z",
      endAt: "2026-08-05T11:00:00Z",
    });

    const appts = await svc.listByBusiness(ORG_B, BIZ_A);
    expect(appts).toHaveLength(0);
  });

  it("links appointment to a job via jobId", async () => {
    const jobSvc = createJobService(c);
    const apptSvc = createAppointmentService(c);

    const job = await jobSvc.createJob(ORG_A, BIZ_A, { title: "Service visit" });
    const appt = await apptSvc.createAppointment(ORG_A, BIZ_A, {
      title: "On-site inspection",
      startAt: "2026-08-10T14:00:00Z",
      endAt: "2026-08-10T15:30:00Z",
      jobId: job.id,
    });

    expect(appt.jobId).toBe(job.id);

    const fetched = await apptSvc.getAppointment(ORG_A, appt.id);
    expect(fetched.jobId).toBe(job.id);
  });

  it("soft deletes appointment — not returned in list", async () => {
    const svc = createAppointmentService(c);
    const appt = await svc.createAppointment(ORG_A, BIZ_A, {
      title: "To be removed",
      startAt: "2026-08-12T09:00:00Z",
      endAt: "2026-08-12T10:00:00Z",
    });
    await svc.deleteAppointment(ORG_A, appt.id);

    const appts = await svc.listByBusiness(ORG_A, BIZ_A);
    expect(appts.find((a) => a.id === appt.id)).toBeUndefined();
  });
});
