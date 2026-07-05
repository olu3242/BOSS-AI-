import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createConversationService } from "../services/conversationService.js";
import type { BossEvent } from "@boss/events";

const ORG_A = "org-conv-a";
const ORG_B = "org-conv-b";
const BIZ_A = "biz-conv-a";
const BIZ_B = "biz-conv-b";
const CUST = "cust-conv-001";
const ACTOR = "actor-conv-001";

describe("RC3 Batch 1 — Conversation Service", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("creates conversation with defaults", async () => {
    const svc = createConversationService(c);
    const conv = await svc.create(ORG_A, BIZ_A, { channel: "email", direction: "inbound", body: "Hello" }, ACTOR);
    expect(conv.id).toBeDefined();
    expect(conv.channel).toBe("email");
    expect(conv.direction).toBe("inbound");
    expect(conv.status).toBe("open");
    expect(conv.body).toBe("Hello");
  });

  it("emits conversation.created event", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("conversation.created", (e) => seen.push(e as BossEvent));
    const svc = createConversationService(c);
    await svc.create(ORG_A, BIZ_A, { channel: "sms", direction: "outbound", body: "Hi" }, ACTOR);
    expect(seen).toHaveLength(1);
  });

  it("resolve status emits conversation.resolved", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("conversation.resolved", (e) => seen.push(e as BossEvent));
    const svc = createConversationService(c);
    const conv = await svc.create(ORG_A, BIZ_A, { channel: "phone", direction: "inbound", body: "Issue" }, ACTOR);
    await svc.update(ORG_A, conv.id, { status: "resolved" }, ACTOR);
    expect(seen).toHaveLength(1);
  });

  it("listByCustomer returns conversations for customer", async () => {
    const svc = createConversationService(c);
    await svc.create(ORG_A, BIZ_A, { channel: "email", direction: "inbound", body: "M1", customerId: CUST }, ACTOR);
    await svc.create(ORG_A, BIZ_A, { channel: "sms", direction: "outbound", body: "M2", customerId: CUST }, ACTOR);
    await svc.create(ORG_A, BIZ_A, { channel: "chat", direction: "inbound", body: "M3", customerId: "other" }, ACTOR);
    const list = await svc.listByCustomer(ORG_A, CUST);
    expect(list).toHaveLength(2);
    expect(list.every((c) => c.customerId === CUST)).toBe(true);
  });

  it("list with limit returns at most N items", async () => {
    const svc = createConversationService(c);
    for (let i = 0; i < 5; i++) {
      await svc.create(ORG_A, BIZ_A, { channel: "email", direction: "inbound", body: `msg ${i}` }, ACTOR);
    }
    const list = await svc.list(ORG_A, BIZ_A, 3);
    expect(list.length).toBeLessThanOrEqual(3);
  });

  it("delete removes conversation", async () => {
    const svc = createConversationService(c);
    const conv = await svc.create(ORG_A, BIZ_A, { channel: "email", direction: "inbound", body: "Delete" }, ACTOR);
    await svc.delete(ORG_A, conv.id, ACTOR);
    const list = await svc.list(ORG_A, BIZ_A);
    expect(list.find((c) => c.id === conv.id)).toBeUndefined();
  });

  it("cross-tenant isolation", async () => {
    const svc = createConversationService(c);
    await svc.create(ORG_A, BIZ_A, { channel: "email", direction: "inbound", body: "Private" }, ACTOR);
    const listB = await svc.list(ORG_B, BIZ_A);
    expect(listB).toHaveLength(0);
  });

  it("list scoped by business", async () => {
    const svc = createConversationService(c);
    await svc.create(ORG_A, BIZ_A, { channel: "email", direction: "inbound", body: "A" }, ACTOR);
    await svc.create(ORG_A, BIZ_B, { channel: "email", direction: "inbound", body: "B" }, ACTOR);
    const list = await svc.list(ORG_A, BIZ_A);
    expect(list).toHaveLength(1);
  });
});
