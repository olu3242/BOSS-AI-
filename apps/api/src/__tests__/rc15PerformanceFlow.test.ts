/**
 * RC1.5 WS4 — Enterprise Load Validation (in-memory benchmarks).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createBusinessMriService } from "../services/businessMriService.js";
import { createBusinessDnaService } from "../services/businessDnaService.js";
import { createBusinessHealthService } from "../services/businessHealthService.js";
import { nowIso } from "@boss/shared";

async function fullAnalysis(repos: ReturnType<typeof createInMemoryContainer>, orgId: string) {
  const profileSvc = createBusinessProfileService(repos);
  const { business } = await profileSvc.createBusiness({
    orgId, name: `PerfBiz-${orgId}`, industry: "retail",
    employeeCount: 10, annualRevenue: 500000, businessType: "retail",
    yearsOperating: 5, locationCount: 1, businessHours: "9-5",
  });

  const mriSvc = createBusinessMriService(repos);
  const mri = await mriSvc.startMri(orgId, business.id);
  await mriSvc.answer(orgId, mri.id, { sectionKey: "identity", questionKey: "identity.employees", value: 10 });
  await mriSvc.answer(orgId, mri.id, { sectionKey: "sales", questionKey: "sales.follow_up_process", value: "manual" });
  await mriSvc.answer(orgId, mri.id, { sectionKey: "operations", questionKey: "operations.scheduling", value: "spreadsheet" });
  await mriSvc.answer(orgId, mri.id, { sectionKey: "technology", questionKey: "technology.crm", value: false });
  await mriSvc.answer(orgId, mri.id, { sectionKey: "goals", questionKey: "goals.priorities", value: ["growth"] });
  await mriSvc.completeSection(orgId, mri.id, "identity");
  const completedMri = await mriSvc.completeMri(orgId, mri.id);

  await createBusinessDnaService(repos).generate(orgId, business.id, completedMri.id);
  await createBusinessHealthService(repos).generate(orgId, business.id, completedMri.id);

  return { business, mri: completedMri };
}

describe("RC1.5 WS4 — Performance / Load Validation", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("full MRI+DNA+Health analysis completes in under 500ms", async () => {
    const start = Date.now();
    await fullAnalysis(c, "org-perf");
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it("event log handles 100 appends without degradation", async () => {
    const count = 100;
    const start = Date.now();
    for (let i = 0; i < count; i++) {
      await c.eventLog.append({
        type: `test.event.${i % 10}`,
        payload: { index: i },
        occurredAt: nowIso(),
        orgId: "org-load",
        correlationId: `corr-${i}`,
        causationId: null,
      });
    }
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);

    const entries = await c.eventLog.listByOrgId("org-load", 200);
    expect(entries.length).toBe(count);
  });

  it("50 workflow execution writes + list under 200ms", async () => {
    const start = Date.now();
    for (let i = 0; i < 50; i++) {
      await c.workflowExecutions.create({
        orgId: "org-q", businessId: "biz-q", workflowKey: `wf-${i}`,
        state: "completed", currentStepIndex: 0,
        input: {}, output: null, errorMessage: null,
        startedAt: nowIso(), completedAt: nowIso(),
      });
    }
    const executions = await c.workflowExecutions.listByBusinessId("org-q", "biz-q");
    const elapsed = Date.now() - start;

    expect(executions.length).toBe(50);
    expect(elapsed).toBeLessThan(200);
  });

  it("5 concurrent full analyses complete under 3 seconds", async () => {
    const start = Date.now();
    await Promise.all(
      Array.from({ length: 5 }, (_, i) => fullAnalysis(c, `org-conc-${i}`))
    );
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);
  });
});
