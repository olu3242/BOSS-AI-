import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createStaffService } from "../services/staffService.js";
import type { BossEvent } from "@boss/events";

const ORG_A = "org-staff-a";
const ORG_B = "org-staff-b";
const BIZ_A = "biz-staff-a";
const BIZ_B = "biz-staff-b";
const ACTOR = "actor-staff-001";

describe("RC3 Batch 1 — Staff Service", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("creates a staff member with defaults", async () => {
    const svc = createStaffService(c);
    const staff = await svc.create(ORG_A, BIZ_A, { userId: "user-001", firstName: "Alice", lastName: "Smith", role: "technician" }, ACTOR);
    expect(staff.id).toBeDefined();
    expect(staff.firstName).toBe("Alice");
    expect(staff.lastName).toBe("Smith");
    expect(staff.status).toBe("active");
    expect(staff.orgId).toBe(ORG_A);
    expect(staff.businessId).toBe(BIZ_A);
  });

  it("emits staff.created event", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("staff.created", (e) => seen.push(e as BossEvent));
    const svc = createStaffService(c);
    await svc.create(ORG_A, BIZ_A, { userId: "user-002", firstName: "Bob", lastName: "Jones", role: "manager" }, ACTOR);
    expect(seen).toHaveLength(1);
  });

  it("get returns staff by id", async () => {
    const svc = createStaffService(c);
    const created = await svc.create(ORG_A, BIZ_A, { userId: "user-003", firstName: "Carol", lastName: "White", role: "admin" }, ACTOR);
    const fetched = await svc.get(ORG_A, created.id);
    expect(fetched.id).toBe(created.id);
  });

  it("get throws 404 for unknown id", async () => {
    const svc = createStaffService(c);
    await expect(svc.get(ORG_A, "nonexistent")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("update changes fields and emits staff.updated", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("staff.updated", (e) => seen.push(e as BossEvent));
    const svc = createStaffService(c);
    const s = await svc.create(ORG_A, BIZ_A, { userId: "user-004", firstName: "Dan", lastName: "Brown", role: "driver" }, ACTOR);
    const updated = await svc.update(ORG_A, s.id, { role: "supervisor" }, ACTOR);
    expect(updated.role).toBe("supervisor");
    expect(seen).toHaveLength(1);
  });

  it("delete removes staff from list", async () => {
    const svc = createStaffService(c);
    const s = await svc.create(ORG_A, BIZ_A, { userId: "user-005", firstName: "Eve", lastName: "Lee", role: "cleaner" }, ACTOR);
    await svc.delete(ORG_A, s.id, ACTOR);
    const list = await svc.list(ORG_A, BIZ_A);
    expect(list.find((m) => m.id === s.id)).toBeUndefined();
  });

  it("list returns only staff for the given business", async () => {
    const svc = createStaffService(c);
    await svc.create(ORG_A, BIZ_A, { userId: "u-f", firstName: "F", lastName: "A", role: "r" }, ACTOR);
    await svc.create(ORG_A, BIZ_A, { userId: "u-g", firstName: "G", lastName: "B", role: "r" }, ACTOR);
    await svc.create(ORG_A, BIZ_B, { userId: "u-h", firstName: "H", lastName: "C", role: "r" }, ACTOR);
    const list = await svc.list(ORG_A, BIZ_A);
    expect(list).toHaveLength(2);
  });

  it("cross-tenant isolation", async () => {
    const svc = createStaffService(c);
    await svc.create(ORG_A, BIZ_A, { userId: "u-x", firstName: "X", lastName: "Y", role: "r" }, ACTOR);
    const listB = await svc.list(ORG_B, BIZ_A);
    expect(listB).toHaveLength(0);
  });
});
