/**
 * Goal 19 — Business Intelligence & Decision OS
 * KPI Measurement Service integration tests.
 * Verifies registry-driven KPI derivation from existing platform evidence.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createBusinessMriService } from "../services/businessMriService.js";
import { createBusinessDnaService } from "../services/businessDnaService.js";
import { createBusinessHealthService } from "../services/businessHealthService.js";
import { createKpiMeasurementService } from "../services/kpiMeasurementService.js";
import { nowIso } from "@boss/shared";

const ORG = "org-goal19-kpi";

async function setupWithHealth(c: ReturnType<typeof createInMemoryContainer>) {
  const profileSvc = createBusinessProfileService(c);
  const { business } = await profileSvc.createBusiness({
    orgId: ORG,
    name: "KPI Test Corp",
    industry: "retail",
    employeeCount: 10,
    annualRevenue: 400000,
    businessType: "retail",
    yearsOperating: 4,
    locationCount: 1,
    businessHours: "9-5",
  });

  const mriSvc = createBusinessMriService(c);
  const mri = await mriSvc.startMri(ORG, business.id);
  await mriSvc.answer(ORG, mri.id, { sectionKey: "identity", questionKey: "identity.employees", value: 10 });
  await mriSvc.answer(ORG, mri.id, { sectionKey: "sales", questionKey: "sales.follow_up_process", value: "manual" });
  await mriSvc.answer(ORG, mri.id, { sectionKey: "operations", questionKey: "operations.scheduling", value: "software" });
  await mriSvc.answer(ORG, mri.id, { sectionKey: "technology", questionKey: "technology.crm", value: true });
  await mriSvc.answer(ORG, mri.id, { sectionKey: "goals", questionKey: "goals.priorities", value: ["growth"] });
  await mriSvc.completeSection(ORG, mri.id, "identity");
  const completedMri = await mriSvc.completeMri(ORG, mri.id);

  await createBusinessDnaService(c).generate(ORG, business.id, completedMri.id);
  await createBusinessHealthService(c).generate(ORG, business.id, completedMri.id);

  return { business, mri: completedMri };
}

describe("Goal 19 — KPI Measurement Service", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("measure() returns readings for all registered KPIs", async () => {
    const { business } = await setupWithHealth(c);
    const svc = createKpiMeasurementService(c);

    const { readings, measuredAt } = await svc.measure(ORG, business.id);

    expect(Array.isArray(readings)).toBe(true);
    expect(readings.length).toBeGreaterThan(0);
    expect(measuredAt).toBeTruthy();

    const keys = readings.map((r) => r.kpiKey);
    expect(keys).toContain("business_health_score");
    expect(keys).toContain("ai_adoption_score");
  });

  it("business_health_score reading is derived from existing health repo", async () => {
    const { business } = await setupWithHealth(c);
    const svc = createKpiMeasurementService(c);

    const { readings } = await svc.measure(ORG, business.id);
    const healthReading = readings.find((r) => r.kpiKey === "business_health_score");

    expect(healthReading).toBeDefined();
    expect(healthReading!.value).toBeTypeOf("number");
    expect(healthReading!.value).toBeGreaterThan(0);
    expect(healthReading!.source).toBe("health_score");
  });

  it("measure() emits business.kpi.measured domain event", async () => {
    const { business } = await setupWithHealth(c);
    const svc = createKpiMeasurementService(c);

    await svc.measure(ORG, business.id);

    const events = await c.eventLog.listByOrgId(ORG);
    const kpiEvent = events.find((e) => e.type === "business.kpi.measured");
    expect(kpiEvent).toBeDefined();
    expect((kpiEvent!.payload as { businessId: string }).businessId).toBe(business.id);
  });

  it("measure() is tenant-scoped — org-A readings never include org-B health", async () => {
    const ORG_A = "org-kpi-a";
    const ORG_B = "org-kpi-b";

    const profileSvc = createBusinessProfileService(c);
    const { business: bizA } = await profileSvc.createBusiness({ orgId: ORG_A, name: "BizA", industry: "retail", employeeCount: 5, annualRevenue: 200000, businessType: "retail", yearsOperating: 2, locationCount: 1, businessHours: "9-5" });
    const { business: bizB } = await profileSvc.createBusiness({ orgId: ORG_B, name: "BizB", industry: "tech", employeeCount: 50, annualRevenue: 2000000, businessType: "saas", yearsOperating: 8, locationCount: 3, businessHours: "24/7" });

    await c.businessHealth.upsert({ orgId: ORG_A, businessId: bizA.id, overallScore: 45, generatedAt: nowIso() });
    await c.businessHealth.upsert({ orgId: ORG_B, businessId: bizB.id, overallScore: 88, generatedAt: nowIso() });

    const svc = createKpiMeasurementService(c);

    const { readings: readingsA } = await svc.measure(ORG_A, bizA.id);
    const { readings: readingsB } = await svc.measure(ORG_B, bizB.id);

    const scoreA = readingsA.find((r) => r.kpiKey === "business_health_score")!.value;
    const scoreB = readingsB.find((r) => r.kpiKey === "business_health_score")!.value;

    expect(scoreA).toBe(45);
    expect(scoreB).toBe(88);
    expect(scoreA).not.toBe(scoreB);
  });

  it("measure() without prior health returns null value for health-score KPIs", async () => {
    const profileSvc = createBusinessProfileService(c);
    const { business } = await profileSvc.createBusiness({ orgId: ORG, name: "No Health Corp", industry: "retail", employeeCount: 5, annualRevenue: 100000, businessType: "retail", yearsOperating: 1, locationCount: 1, businessHours: "9-5" });

    const svc = createKpiMeasurementService(c);
    const { readings } = await svc.measure(ORG, business.id);

    const healthReading = readings.find((r) => r.kpiKey === "business_health_score");
    expect(healthReading).toBeDefined();
    expect(healthReading!.value).toBeNull();
  });

  it("all readings have required fields", async () => {
    const { business } = await setupWithHealth(c);
    const { readings } = await createKpiMeasurementService(c).measure(ORG, business.id);

    for (const reading of readings) {
      expect(reading.kpiKey).toBeTruthy();
      expect(reading.label).toBeTruthy();
      expect(reading.unit).toBeTruthy();
      expect(reading.measuredAt).toBeTruthy();
      expect(["event_log", "health_score", "registry_default"]).toContain(reading.source);
      expect(["up", "down", "stable", "unknown"]).toContain(reading.trend);
    }
  });
});
