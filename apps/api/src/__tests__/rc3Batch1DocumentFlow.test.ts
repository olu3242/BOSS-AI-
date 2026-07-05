import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createDocumentService } from "../services/documentService.js";
import type { BossEvent } from "@boss/events";

const ORG_A = "org-doc-a";
const ORG_B = "org-doc-b";
const BIZ_A = "biz-doc-a";
const BIZ_B = "biz-doc-b";
const ACTOR = "actor-doc-001";

describe("RC3 Batch 1 — Document Service", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("creates document with defaults", async () => {
    const svc = createDocumentService(c);
    const doc = await svc.create(ORG_A, BIZ_A, { title: "Contract 1", documentType: "contract" }, ACTOR);
    expect(doc.id).toBeDefined();
    expect(doc.title).toBe("Contract 1");
    expect(doc.documentType).toBe("contract");
    expect(doc.status).toBe("draft");
    expect(doc.version).toBe(1);
    expect(doc.tags).toEqual([]);
  });

  it("emits document.created event", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("document.created", (e) => seen.push(e as BossEvent));
    const svc = createDocumentService(c);
    await svc.create(ORG_A, BIZ_A, { title: "Proposal", documentType: "proposal" }, ACTOR);
    expect(seen).toHaveLength(1);
  });

  it("status change to signed emits document.signed", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("document.signed", (e) => seen.push(e as BossEvent));
    const svc = createDocumentService(c);
    const doc = await svc.create(ORG_A, BIZ_A, { title: "Sign me", documentType: "contract" }, ACTOR);
    await svc.update(ORG_A, doc.id, { status: "signed" }, ACTOR);
    expect(seen).toHaveLength(1);
  });

  it("status change to approved emits document.approved", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("document.approved", (e) => seen.push(e as BossEvent));
    const svc = createDocumentService(c);
    const doc = await svc.create(ORG_A, BIZ_A, { title: "Approve me", documentType: "report" }, ACTOR);
    await svc.update(ORG_A, doc.id, { status: "approved" }, ACTOR);
    expect(seen).toHaveLength(1);
  });

  it("get throws 404 for unknown id", async () => {
    const svc = createDocumentService(c);
    await expect(svc.get(ORG_A, "nonexistent")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("delete removes document", async () => {
    const svc = createDocumentService(c);
    const doc = await svc.create(ORG_A, BIZ_A, { title: "Delete me", documentType: "other" }, ACTOR);
    await svc.delete(ORG_A, doc.id, ACTOR);
    const list = await svc.list(ORG_A, BIZ_A);
    expect(list.find((d) => d.id === doc.id)).toBeUndefined();
  });

  it("list scoped by business", async () => {
    const svc = createDocumentService(c);
    await svc.create(ORG_A, BIZ_A, { title: "Doc A", documentType: "contract" }, ACTOR);
    await svc.create(ORG_A, BIZ_B, { title: "Doc B", documentType: "contract" }, ACTOR);
    const list = await svc.list(ORG_A, BIZ_A);
    expect(list).toHaveLength(1);
  });

  it("cross-tenant isolation", async () => {
    const svc = createDocumentService(c);
    await svc.create(ORG_A, BIZ_A, { title: "Private", documentType: "contract" }, ACTOR);
    const listB = await svc.list(ORG_B, BIZ_A);
    expect(listB).toHaveLength(0);
  });
});
