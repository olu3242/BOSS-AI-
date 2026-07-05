import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createEstimateService } from "../services/estimateService.js";
import type { BossEvent } from "@boss/events";

const ORG_A = "org-est-a";
const ORG_B = "org-est-b";
const BIZ_A = "biz-est-a";
const BIZ_B = "biz-est-b";
const CUST = "cust-est-001";
const ACTOR = "actor-est-001";

const LINE_ITEMS = [
  { description: "Labor", quantity: 2, unitPriceCents: 5000, totalCents: 10000 },
  { description: "Parts", quantity: 3, unitPriceCents: 2000, totalCents: 6000 },
];

describe("RC3 Batch 1 — Estimate Service", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("creates estimate and computes totals correctly", async () => {
    const svc = createEstimateService(c);
    const est = await svc.create(ORG_A, BIZ_A, {
      estimateNumber: "EST-001",
      lineItems: LINE_ITEMS,
      taxCents: 900,
      discountCents: 500,
    }, ACTOR);
    // subtotal = 10000 + 6000 = 16000; total = 16000 + 900 - 500 = 16400
    expect(est.subtotalCents).toBe(16000);
    expect(est.taxCents).toBe(900);
    expect(est.discountCents).toBe(500);
    expect(est.totalCents).toBe(16400);
    expect(est.status).toBe("draft");
  });

  it("emits estimate.created event", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("estimate.created", (e) => seen.push(e as BossEvent));
    const svc = createEstimateService(c);
    await svc.create(ORG_A, BIZ_A, { estimateNumber: "EST-E1", lineItems: LINE_ITEMS }, ACTOR);
    expect(seen).toHaveLength(1);
  });

  it("rejects duplicate estimate numbers", async () => {
    const svc = createEstimateService(c);
    await svc.create(ORG_A, BIZ_A, { estimateNumber: "EST-DUP", lineItems: LINE_ITEMS }, ACTOR);
    await expect(
      svc.create(ORG_A, BIZ_A, { estimateNumber: "EST-DUP", lineItems: LINE_ITEMS }, ACTOR)
    ).rejects.toMatchObject({ status: 409 });
  });

  it("send transitions draft → sent and emits estimate.sent", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("estimate.sent", (e) => seen.push(e as BossEvent));
    const svc = createEstimateService(c);
    const est = await svc.create(ORG_A, BIZ_A, { estimateNumber: "EST-S1", lineItems: LINE_ITEMS, customerId: CUST }, ACTOR);
    const sent = await svc.send(ORG_A, est.id, ACTOR);
    expect(sent.status).toBe("sent");
    expect(seen).toHaveLength(1);
  });

  it("cannot send non-draft estimate", async () => {
    const svc = createEstimateService(c);
    const est = await svc.create(ORG_A, BIZ_A, { estimateNumber: "EST-NS", lineItems: LINE_ITEMS }, ACTOR);
    await svc.send(ORG_A, est.id, ACTOR);
    await expect(svc.send(ORG_A, est.id, ACTOR)).rejects.toMatchObject({ status: 409 });
  });

  it("accept transitions sent → accepted and emits estimate.accepted", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("estimate.accepted", (e) => seen.push(e as BossEvent));
    const svc = createEstimateService(c);
    const est = await svc.create(ORG_A, BIZ_A, { estimateNumber: "EST-A1", lineItems: LINE_ITEMS }, ACTOR);
    await svc.send(ORG_A, est.id, ACTOR);
    const accepted = await svc.accept(ORG_A, est.id, ACTOR);
    expect(accepted.status).toBe("accepted");
    expect(seen).toHaveLength(1);
  });

  it("decline emits estimate.declined", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("estimate.declined", (e) => seen.push(e as BossEvent));
    const svc = createEstimateService(c);
    const est = await svc.create(ORG_A, BIZ_A, { estimateNumber: "EST-D1", lineItems: LINE_ITEMS }, ACTOR);
    await svc.send(ORG_A, est.id, ACTOR);
    await svc.decline(ORG_A, est.id, ACTOR);
    expect(seen).toHaveLength(1);
  });

  it("convert accepted → converted, sets invoiceId, emits estimate.converted", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("estimate.converted", (e) => seen.push(e as BossEvent));
    const svc = createEstimateService(c);
    const est = await svc.create(ORG_A, BIZ_A, { estimateNumber: "EST-C1", lineItems: LINE_ITEMS }, ACTOR);
    await svc.send(ORG_A, est.id, ACTOR);
    await svc.accept(ORG_A, est.id, ACTOR);
    const converted = await svc.convert(ORG_A, est.id, "inv-999", ACTOR);
    expect(converted.status).toBe("converted");
    expect(converted.convertedInvoiceId).toBe("inv-999");
    expect(seen).toHaveLength(1);
  });

  it("only draft estimates can be edited", async () => {
    const svc = createEstimateService(c);
    const est = await svc.create(ORG_A, BIZ_A, { estimateNumber: "EST-NE", lineItems: LINE_ITEMS }, ACTOR);
    await svc.send(ORG_A, est.id, ACTOR);
    await expect(svc.update(ORG_A, est.id, { taxCents: 100 }, ACTOR)).rejects.toMatchObject({ status: 409 });
  });

  it("delete works for draft estimates and emits estimate.deleted", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("estimate.deleted", (e) => seen.push(e as BossEvent));
    const svc = createEstimateService(c);
    const est = await svc.create(ORG_A, BIZ_A, { estimateNumber: "EST-DEL", lineItems: LINE_ITEMS }, ACTOR);
    await svc.delete(ORG_A, est.id, ACTOR);
    const list = await svc.list(ORG_A, BIZ_A);
    expect(list.find((e) => e.id === est.id)).toBeUndefined();
    expect(seen).toHaveLength(1);
  });

  it("cross-tenant isolation", async () => {
    const svc = createEstimateService(c);
    await svc.create(ORG_A, BIZ_A, { estimateNumber: "EST-ISO", lineItems: LINE_ITEMS }, ACTOR);
    const listB = await svc.list(ORG_B, BIZ_A);
    expect(listB).toHaveLength(0);
  });

  it("list scoped by business", async () => {
    const svc = createEstimateService(c);
    await svc.create(ORG_A, BIZ_A, { estimateNumber: "EST-BA1", lineItems: LINE_ITEMS }, ACTOR);
    await svc.create(ORG_A, BIZ_B, { estimateNumber: "EST-BB1", lineItems: LINE_ITEMS }, ACTOR);
    const list = await svc.list(ORG_A, BIZ_A);
    expect(list).toHaveLength(1);
  });
});
