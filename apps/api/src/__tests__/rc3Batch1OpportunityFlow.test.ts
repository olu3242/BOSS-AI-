import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createOpportunityService } from "../services/opportunityService.js";
import type { BossEvent } from "@boss/events";

const ORG_A = "org-opp-a";
const ORG_B = "org-opp-b";
const BIZ_A = "biz-opp-a";
const BIZ_B = "biz-opp-b";
const ACTOR = "actor-opp-001";

describe("RC3 Batch 1 — Opportunity Service", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("creates opportunity with defaults", async () => {
    const svc = createOpportunityService(c);
    const opp = await svc.create(ORG_A, BIZ_A, { title: "New Deal" }, ACTOR);
    expect(opp.id).toBeDefined();
    expect(opp.title).toBe("New Deal");
    expect(opp.stage).toBe("prospecting");
    expect(opp.valueCents).toBe(0);
    expect(opp.currency).toBe("USD");
  });

  it("emits opportunity.created event", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("opportunity.created", (e) => seen.push(e as BossEvent));
    const svc = createOpportunityService(c);
    await svc.create(ORG_A, BIZ_A, { title: "Event Deal" }, ACTOR);
    expect(seen).toHaveLength(1);
  });

  it("stage change to closed_won emits opportunity.won", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("opportunity.won", (e) => seen.push(e as BossEvent));
    const svc = createOpportunityService(c);
    const opp = await svc.create(ORG_A, BIZ_A, { title: "Win Deal" }, ACTOR);
    await svc.update(ORG_A, opp.id, { stage: "closed_won" }, ACTOR);
    expect(seen).toHaveLength(1);
  });

  it("stage change to closed_lost emits opportunity.lost", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("opportunity.lost", (e) => seen.push(e as BossEvent));
    const svc = createOpportunityService(c);
    const opp = await svc.create(ORG_A, BIZ_A, { title: "Lost Deal" }, ACTOR);
    await svc.update(ORG_A, opp.id, { stage: "closed_lost" }, ACTOR);
    expect(seen).toHaveLength(1);
  });

  it("listByStage filters correctly", async () => {
    const svc = createOpportunityService(c);
    await svc.create(ORG_A, BIZ_A, { title: "A", stage: "prospecting" }, ACTOR);
    await svc.create(ORG_A, BIZ_A, { title: "B", stage: "proposal" }, ACTOR);
    await svc.create(ORG_A, BIZ_A, { title: "C", stage: "prospecting" }, ACTOR);
    const prospects = await svc.listByStage(ORG_A, BIZ_A, "prospecting");
    expect(prospects).toHaveLength(2);
  });

  it("delete removes opportunity and emits event", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("opportunity.deleted", (e) => seen.push(e as BossEvent));
    const svc = createOpportunityService(c);
    const opp = await svc.create(ORG_A, BIZ_A, { title: "Delete Me" }, ACTOR);
    await svc.delete(ORG_A, opp.id, ACTOR);
    const list = await svc.list(ORG_A, BIZ_A);
    expect(list.find((o) => o.id === opp.id)).toBeUndefined();
    expect(seen).toHaveLength(1);
  });

  it("cross-tenant isolation", async () => {
    const svc = createOpportunityService(c);
    await svc.create(ORG_A, BIZ_A, { title: "Private" }, ACTOR);
    const listB = await svc.list(ORG_B, BIZ_A);
    expect(listB).toHaveLength(0);
  });

  it("list returns only for given business", async () => {
    const svc = createOpportunityService(c);
    await svc.create(ORG_A, BIZ_A, { title: "Biz A" }, ACTOR);
    await svc.create(ORG_A, BIZ_B, { title: "Biz B" }, ACTOR);
    const list = await svc.list(ORG_A, BIZ_A);
    expect(list).toHaveLength(1);
  });
});
