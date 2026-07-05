/**
 * RC1.3 — Launch Simulation Tests
 *
 * Deterministic end-to-end scenarios covering the full customer journey
 * using in-memory repositories and the real service layer.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createApiFromContainer, createInMemoryContainer } from "../index.js";

describe("RC1.3 Launch Simulation", () => {
  let api: ReturnType<typeof createApiFromContainer>;
  const ORG_ID = "org-launch-sim";

  beforeEach(() => {
    api = createApiFromContainer(createInMemoryContainer());
  });

  // ─── Scenario 1: New Customer Onboarding ────────────────────────────────────

  describe("Scenario 1 — New customer onboarding", () => {
    it("creates business, starts MRI, and completes onboarding", async () => {
      const { business } = await api.business.create({
        orgId: ORG_ID,
        name: "Sunrise Plumbing",
        industry: "hvac",
        businessType: "LLC",
        employeeCount: 6,
        annualRevenue: 420000,
        yearsOperating: 4,
        locationCount: 1,
        businessHours: "Mon-Fri 7am-5pm",
      });
      expect(business.id).toBeTruthy();

      const mri = await api.businessMri.start(ORG_ID, business.id);
      expect(mri.status).toBe("in_progress");

      await api.businessMri.answer(ORG_ID, mri.id, {
        sectionKey: "identity",
        questionKey: "primary_challenge",
        value: "Inconsistent cash flow and seasonal revenue swings",
      });
      await api.businessMri.answer(ORG_ID, mri.id, {
        sectionKey: "finance",
        questionKey: "monthly_revenue",
        value: 35000,
      });
      await api.businessMri.completeSection(ORG_ID, mri.id, "identity");
      await api.businessMri.completeSection(ORG_ID, mri.id, "finance");

      const completed = await api.businessMri.complete(ORG_ID, mri.id);
      expect(completed.status).toBe("completed");
    });
  });

  // ─── Scenario 2: KPI Refresh ────────────────────────────────────────────────

  describe("Scenario 2 — KPI refresh", () => {
    it("generates health score and measures KPIs after MRI", async () => {
      const { business } = await api.business.create({
        orgId: ORG_ID,
        name: "Bright Dental",
        industry: "dental",
        businessType: "LLC",
        employeeCount: 12,
        annualRevenue: 800000,
        yearsOperating: 8,
        locationCount: 1,
        businessHours: "Mon-Fri 8am-6pm",
      });

      const mri = await api.businessMri.start(ORG_ID, business.id);
      await api.businessMri.answer(ORG_ID, mri.id, {
        sectionKey: "customers",
        questionKey: "monthly_new_customers",
        value: 18,
      });
      await api.businessMri.completeSection(ORG_ID, mri.id, "customers");
      await api.businessMri.complete(ORG_ID, mri.id);

      const { health } = await api.businessHealth.generate(ORG_ID, business.id, mri.id);
      expect(health.overallScore).toBeGreaterThanOrEqual(0);
      expect(health.overallScore).toBeLessThanOrEqual(100);

      const { readings } = await api.kpiMeasurement.measure(ORG_ID, business.id);
      expect(readings.length).toBeGreaterThan(0);
      expect(readings[0]).toHaveProperty("kpiKey");
      expect(readings[0]).toHaveProperty("value");
    });
  });

  // ─── Scenario 3: Decision Approval Workflow ─────────────────────────────────

  describe("Scenario 3 — Decision approval", () => {
    it("generates a decision and approves it", async () => {
      const { business } = await api.business.create({
        orgId: ORG_ID,
        name: "Metro Coffee",
        industry: "coffee",
        businessType: "LLC",
        employeeCount: 5,
        annualRevenue: 180000,
        yearsOperating: 2,
        locationCount: 1,
        businessHours: "Mon-Sun 6am-8pm",
      });

      const mri = await api.businessMri.start(ORG_ID, business.id);
      await api.businessMri.complete(ORG_ID, mri.id);
      await api.businessHealth.generate(ORG_ID, business.id, mri.id);

      const decision = await api.businessDecision.generate(ORG_ID, business.id, {
        recommendationIds: [],
        decisionType: "strategic",
      });
      expect(decision.status).toBe("generated");

      const approved = await api.businessDecision.approve(ORG_ID, decision.id);
      expect(approved.status).toBe("approved");
    });
  });

  // ─── Scenario 4: Workspace Snapshot ─────────────────────────────────────────

  describe("Scenario 4 — Executive workspace", () => {
    it("returns workspace snapshot with all required sections", async () => {
      const { business } = await api.business.create({
        orgId: ORG_ID,
        name: "Fast Clean",
        industry: "cleaning",
        businessType: "Sole Proprietor",
        employeeCount: 3,
        annualRevenue: 90000,
        yearsOperating: 1,
        locationCount: 1,
        businessHours: "Mon-Sat 8am-6pm",
      });

      const snapshot = await api.workspace.getWorkspace(ORG_ID, business.id);
      expect(snapshot).toHaveProperty("businessId", business.id);
      expect(snapshot).toHaveProperty("health");
      expect(snapshot).toHaveProperty("kpis");
      expect(snapshot).toHaveProperty("decisions");
      expect(snapshot).toHaveProperty("loopStatus");
      expect(snapshot).toHaveProperty("assembledAt");
    });
  });

  // ─── Scenario 5: Feature Flags ───────────────────────────────────────────────

  describe("Scenario 5 — Feature flags", () => {
    it("returns all flags with correct types", () => {
      const flags = api.featureFlags.getAll();
      expect(typeof flags.ai_workforce).toBe("boolean");
      expect(typeof flags.marketplace).toBe("boolean");
      expect(typeof flags.operating_loop).toBe("boolean");
      expect(typeof flags.beta_onboarding).toBe("boolean");
      // Defaults: ai_workforce and marketplace off in RC1
      expect(flags.ai_workforce).toBe(false);
      expect(flags.marketplace).toBe(false);
    });

    it("respects BOSS_FLAG_* env vars", async () => {
      process.env.BOSS_FLAG_AI_WORKFORCE = "true";
      try {
        const { createFeatureFlagService } = await import("../services/featureFlagService.js");
        const svc = createFeatureFlagService();
        expect(svc.isEnabledSync("ai_workforce")).toBe(true);
      } finally {
        delete process.env.BOSS_FLAG_AI_WORKFORCE;
      }
    });
  });

  // ─── Scenario 6: Support Feedback ───────────────────────────────────────────

  describe("Scenario 6 — Support feedback", () => {
    it("submits feedback and returns a feedbackId", async () => {
      const result = await api.support.submitFeedback({
        orgId: ORG_ID,
        message: "The MRI flow was confusing on step 3",
        category: "bug",
        pageUrl: "/business/abc/mri",
      });
      expect(result.feedbackId).toBeTruthy();
      expect(result.status).toBe("received");
    });
  });

  // ─── Scenario 7: Integration Outage Recovery ────────────────────────────────

  describe("Scenario 7 — Graceful degradation", () => {
    it("workspace returns partial data when health score is missing", async () => {
      const { business } = await api.business.create({
        orgId: ORG_ID,
        name: "Resilient Co",
        industry: "general_smb",
        businessType: "LLC",
        employeeCount: 2,
        annualRevenue: 60000,
        yearsOperating: 1,
        locationCount: 1,
        businessHours: "Mon-Fri 9am-5pm",
      });

      // Do NOT generate health score — workspace should still load
      const snapshot = await api.workspace.getWorkspace(ORG_ID, business.id);
      expect(snapshot.health).toBeNull();
      expect(snapshot.kpis.readings).toBeDefined();
      expect(snapshot.decisions.pending).toBeDefined();
    });
  });
});
