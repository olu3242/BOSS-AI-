import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createTaskService } from "../services/taskService.js";
import type { BossEvent } from "@boss/events";

const ORG_A = "org-task-a";
const ORG_B = "org-task-b";
const BIZ_A = "biz-task-a";
const BIZ_B = "biz-task-b";
const ACTOR = "actor-task-001";

describe("RC3 Batch 1 — Task Service", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("creates task with defaults", async () => {
    const svc = createTaskService(c);
    const task = await svc.create(ORG_A, BIZ_A, { title: "Fix the bug" }, ACTOR);
    expect(task.id).toBeDefined();
    expect(task.title).toBe("Fix the bug");
    expect(task.status).toBe("todo");
    expect(task.priority).toBe("normal");
    expect(task.parentTaskId).toBeNull();
  });

  it("emits task.created event", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("task.created", (e) => seen.push(e as BossEvent));
    const svc = createTaskService(c);
    await svc.create(ORG_A, BIZ_A, { title: "Task" }, ACTOR);
    expect(seen).toHaveLength(1);
  });

  it("status change to done emits task.completed", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("task.completed", (e) => seen.push(e as BossEvent));
    const svc = createTaskService(c);
    const task = await svc.create(ORG_A, BIZ_A, { title: "Finish me" }, ACTOR);
    await svc.update(ORG_A, task.id, { status: "done" }, ACTOR);
    expect(seen).toHaveLength(1);
  });

  it("status change to cancelled emits task.cancelled", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("task.cancelled", (e) => seen.push(e as BossEvent));
    const svc = createTaskService(c);
    const task = await svc.create(ORG_A, BIZ_A, { title: "Cancel me" }, ACTOR);
    await svc.update(ORG_A, task.id, { status: "cancelled" }, ACTOR);
    expect(seen).toHaveLength(1);
  });

  it("creates child task with parentTaskId", async () => {
    const svc = createTaskService(c);
    const parent = await svc.create(ORG_A, BIZ_A, { title: "Parent" }, ACTOR);
    const child = await svc.create(ORG_A, BIZ_A, { title: "Child", parentTaskId: parent.id }, ACTOR);
    expect(child.parentTaskId).toBe(parent.id);
    const children = await svc.listChildren(ORG_A, parent.id);
    expect(children).toHaveLength(1);
    expect(children[0]!.id).toBe(child.id);
  });

  it("delete removes task from list", async () => {
    const svc = createTaskService(c);
    const task = await svc.create(ORG_A, BIZ_A, { title: "Delete me" }, ACTOR);
    await svc.delete(ORG_A, task.id, ACTOR);
    const list = await svc.list(ORG_A, BIZ_A);
    expect(list.find((t) => t.id === task.id)).toBeUndefined();
  });

  it("list scoped by business", async () => {
    const svc = createTaskService(c);
    await svc.create(ORG_A, BIZ_A, { title: "A" }, ACTOR);
    await svc.create(ORG_A, BIZ_B, { title: "B" }, ACTOR);
    const list = await svc.list(ORG_A, BIZ_A);
    expect(list).toHaveLength(1);
  });

  it("cross-tenant isolation", async () => {
    const svc = createTaskService(c);
    await svc.create(ORG_A, BIZ_A, { title: "Private" }, ACTOR);
    const listB = await svc.list(ORG_B, BIZ_A);
    expect(listB).toHaveLength(0);
  });
});
