/**
 * RC1.4 — Beta Simulation Tests
 *
 * Validates product analytics, customer health scoring, beta invite management,
 * and the end-to-end activation funnel using in-memory repositories.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createApiFromContainer, createInMemoryContainer } from "../index.js";

describe("RC1.4 Beta Simulation", () => {
  let api: ReturnType<typeof createApiFromContainer>;
  const ORG_ID = "org-beta-sim";

  beforeEach(() => {
    api = createApiFromContainer(createInMemoryContainer());
  });

  // ─── Scenario 1: Product Analytics Tracking ─────────────────────────────────

  describe("Scenario 1 — Product analytics tracking", () => {
    it("tracks analytics events via domain event bridge", async () => {
      const { business } = await api.business.create({
        orgId: ORG_ID,
        name: "Test Analytics Co",
        industry: "general_smb",
        businessType: "LLC",
        employeeCount: 5,
        annualRevenue: 100000,
        yearsOperating: 2,
        locationCount: 1,
        businessHours: "Mon-Fri 9am-5pm",
      });

      // Direct tracking
      await api.productAnalytics.track({
        type: "analytics.workspace.viewed",
        orgId: ORG_ID,
        businessId: business.id,
        properties: { section: "overview" },
      });

      const funnel = await api.productAnalytics.queryFunnel(ORG_ID, business.id);
      expect(funnel.length).toBeGreaterThan(0);
      expect(funnel.some((e) => e.type === "analytics.workspace.viewed")).toBe(true);
    });

    it("computes WAB and MAB", async () => {
      const { business } = await api.business.create({
        orgId: ORG_ID,
        name: "Active Business",
        industry: "hvac",
        businessType: "LLC",
        employeeCount: 3,
        annualRevenue: 80000,
        yearsOperating: 1,
        locationCount: 1,
        businessHours: "Mon-Fri 8am-5pm",
      });

      await api.productAnalytics.track({
        type: "analytics.workspace.viewed",
        orgId: ORG_ID,
        businessId: business.id,
        properties: {},
      });

      const wab = await api.productAnalytics.getWab(7);
      const mab = await api.productAnalytics.getMab(30);
      expect(wab).toBeGreaterThanOrEqual(1);
      expect(mab).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Scenario 2: Customer Health Score ──────────────────────────────────────

  describe("Scenario 2 — Customer health scoring", () => {
    it("scores at 0 for a brand-new business with no activity", async () => {
      const { business } = await api.business.create({
        orgId: ORG_ID,
        name: "New Business",
        industry: "cleaning",
        businessType: "Sole Proprietor",
        employeeCount: 1,
        annualRevenue: 40000,
        yearsOperating: 0,
        locationCount: 1,
        businessHours: "Mon-Sat 8am-6pm",
      });

      const health = await api.customerHealth.computeScore(ORG_ID, business.id);
      expect(health.score).toBe(0);
      expect(health.tier).toBe("critical");
      expect(health.signals.mriCompleted).toBe(false);
    });

    it("scores higher after MRI completion and decision approval", async () => {
      const { business } = await api.business.create({
        orgId: ORG_ID,
        name: "Active Customer",
        industry: "dental",
        businessType: "LLC",
        employeeCount: 10,
        annualRevenue: 600000,
        yearsOperating: 5,
        locationCount: 1,
        businessHours: "Mon-Fri 8am-6pm",
      });

      // Simulate MRI completion event
      await api.productAnalytics.track({
        type: "analytics.mri.completed",
        orgId: ORG_ID,
        businessId: business.id,
        properties: {},
      });

      // Simulate decision approval event
      await api.productAnalytics.track({
        type: "analytics.recommendation.accepted",
        orgId: ORG_ID,
        businessId: business.id,
        properties: { decisionId: "dec-001" },
      });

      // Simulate workspace view
      await api.productAnalytics.track({
        type: "analytics.workspace.viewed",
        orgId: ORG_ID,
        businessId: business.id,
        properties: {},
      });

      const health = await api.customerHealth.computeScore(ORG_ID, business.id);
      expect(health.score).toBeGreaterThanOrEqual(60);
      expect(["champion", "healthy"]).toContain(health.tier);
      expect(health.signals.mriCompleted).toBe(true);
      expect(health.signals.decisionApproved).toBe(true);
      expect(health.signals.workspaceViewedRecently).toBe(true);
    });
  });

  // ─── Scenario 3: Activation Rate ─────────────────────────────────────────────

  describe("Scenario 3 — Activation rate", () => {
    it("returns 0 rate with no businesses", async () => {
      const result = await api.productAnalytics.getActivationRate();
      expect(result.total).toBe(0);
      expect(result.rate).toBe(0);
    });

    it("tracks activation correctly when funnel is complete", async () => {
      await api.productAnalytics.track({
        type: "analytics.business.created",
        orgId: ORG_ID,
        businessId: "biz-001",
        properties: {},
      });
      await api.productAnalytics.track({
        type: "analytics.mri.completed",
        orgId: ORG_ID,
        businessId: "biz-001",
        properties: {},
      });
      await api.productAnalytics.track({
        type: "analytics.recommendation.accepted",
        orgId: ORG_ID,
        businessId: "biz-001",
        properties: {},
      });

      const result = await api.productAnalytics.getActivationRate();
      expect(result.total).toBe(1);
      expect(result.activated).toBe(1);
      expect(result.rate).toBe(1);
    });
  });

  // ─── Scenario 4: Beta Invite Management ──────────────────────────────────────

  describe("Scenario 4 — Beta invite management", () => {
    it("generates and validates invite codes", async () => {
      const invite = await api.betaInvite.generate(ORG_ID);
      expect(invite.code).toMatch(/^BOSS-[A-Z0-9]{8}$/);
      expect(invite.usedAt).toBeNull();

      const validated = await api.betaInvite.validate(invite.code);
      expect(validated).not.toBeNull();
      expect(validated!.code).toBe(invite.code);
    });

    it("redeems invite code and marks it used", async () => {
      const invite = await api.betaInvite.generate(ORG_ID);
      const redeemed = await api.betaInvite.redeem(invite.code, "biz-xyz");
      expect(redeemed.usedAt).not.toBeNull();
      expect(redeemed.usedByBusinessId).toBe("biz-xyz");

      // Used code should no longer validate
      const invalid = await api.betaInvite.validate(invite.code);
      expect(invalid).toBeNull();
    });

    it("lists invites and returns stats", async () => {
      await api.betaInvite.generate(ORG_ID);
      await api.betaInvite.generate(ORG_ID);
      const inv = await api.betaInvite.generate(ORG_ID);
      await api.betaInvite.redeem(inv.code, "biz-abc");

      const stats = await api.betaInvite.getStats();
      expect(stats.total).toBe(3);
      expect(stats.used).toBe(1);
      expect(stats.available).toBe(2);
    });

    it("throws on redeeming non-existent code", async () => {
      await expect(api.betaInvite.redeem("BOSS-INVALID1", "biz-yyy")).rejects.toThrow();
    });
  });

  // ─── Scenario 5: NPS Submission (via productAnalytics.track) ─────────────────

  describe("Scenario 5 — NPS collection", () => {
    it("records NPS submission event", async () => {
      const { business } = await api.business.create({
        orgId: ORG_ID,
        name: "NPS Test Co",
        industry: "coffee",
        businessType: "LLC",
        employeeCount: 4,
        annualRevenue: 200000,
        yearsOperating: 3,
        locationCount: 1,
        businessHours: "Mon-Sun 6am-8pm",
      });

      await api.productAnalytics.track({
        type: "analytics.nps.submitted",
        orgId: ORG_ID,
        businessId: business.id,
        properties: { score: 9, comment: "Really useful for managing my business" },
      });

      const funnel = await api.productAnalytics.queryFunnel(ORG_ID, business.id);
      expect(funnel.some((e) => e.type === "analytics.nps.submitted")).toBe(true);
    });
  });
});
