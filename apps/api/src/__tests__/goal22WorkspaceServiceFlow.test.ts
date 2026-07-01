/**
 * Goal 22 — Unified Business Workspace: Service Layer Tests
 * Workstream 1: workspaceService — snapshot assembly and approval queue.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { installGeneralSmbPack } from "@boss/industry-pack-general-smb";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createBusinessMriService } from "../services/businessMriService.js";
import { createBusinessDnaService } from "../services/businessDnaService.js";
import { createBusinessHealthService } from "../services/businessHealthService.js";
import { createBusinessConstraintService } from "../services/businessConstraintService.js";
import { createBusinessRecommendationService } from "../services/businessRecommendationService.js";
import { createWorkspaceService } from "../services/workspaceService.js";
import type { RepositoryContainer } from "../container.js";

installGeneralSmbPack();

const ORG_ID = "org-test-goal22-ws";

async function fullSetup(repos: RepositoryContainer) {
  const profileSvc = createBusinessProfileService(repos);
  const { business } = await profileSvc.createBusiness({
    orgId: ORG_ID,
    name: "Workspace Test Co.",
    industry: "retail",
    employeeCount: 10,
    annualRevenue: 500000,
    businessType: "retail",
    yearsOperating: 5,
    locationCount: 1,
    businessHours: "Mon-Fri 9-5",
  });

  const mriSvc = createBusinessMriService(repos);
  const mri = await mriSvc.startMri(ORG_ID, business.id);
  await mriSvc.answer(ORG_ID, mri.id, { sectionKey: "identity", questionKey: "identity.employees", value: 10 });
  await mriSvc.answer(ORG_ID, mri.id, { sectionKey: "sales", questionKey: "sales.follow_up_process", value: "manual" });
  await mriSvc.answer(ORG_ID, mri.id, { sectionKey: "operations", questionKey: "operations.scheduling", value: "spreadsheet" });
  await mriSvc.answer(ORG_ID, mri.id, { sectionKey: "technology", questionKey: "technology.crm", value: false });
  await mriSvc.answer(ORG_ID, mri.id, { sectionKey: "goals", questionKey: "goals.priorities", value: ["growth"] });
  await mriSvc.completeSection(ORG_ID, mri.id, "identity");
  const completedMri = await mriSvc.completeMri(ORG_ID, mri.id);

  await createBusinessDnaService(repos).generate(ORG_ID, business.id, completedMri.id);
  await createBusinessHealthService(repos).generate(ORG_ID, business.id, completedMri.id);
  await createBusinessConstraintService(repos).analyze(ORG_ID, business.id, completedMri.id);
  await createBusinessRecommendationService(repos).analyze(ORG_ID, business.id);

  return { business, mri: completedMri };
}

describe("Goal 22 — Workstream 1: Workspace Service", () => {
  let repos: RepositoryContainer;

  beforeEach(() => {
    repos = createInMemoryContainer();
  });

  describe("workspaceService.getWorkspace()", () => {
    it("returns a workspace snapshot with all required top-level fields", async () => {
      const { business } = await fullSetup(repos);
      const svc = createWorkspaceService(repos);

      const snapshot = await svc.getWorkspace(ORG_ID, business.id);

      expect(snapshot.businessId).toBe(business.id);
      expect(snapshot.workspaceKey).toBe("executive_workspace");
      expect(snapshot.assembledAt).toBeTruthy();
      expect(snapshot.kpis).toBeDefined();
      expect(snapshot.decisions).toBeDefined();
      expect(snapshot.approvalQueue).toBeDefined();
      expect(snapshot.loopStatus).toBeDefined();
    });

    it("returns health score after health assessment", async () => {
      const { business } = await fullSetup(repos);
      const svc = createWorkspaceService(repos);

      const snapshot = await svc.getWorkspace(ORG_ID, business.id);

      expect(snapshot.health).not.toBeNull();
      expect(typeof snapshot.health!.overallScore).toBe("number");
      expect(snapshot.health!.overallScore).toBeGreaterThanOrEqual(0);
      expect(snapshot.health!.overallScore).toBeLessThanOrEqual(100);
    });

    it("derives KPI readings from health score", async () => {
      const { business } = await fullSetup(repos);
      const svc = createWorkspaceService(repos);

      const snapshot = await svc.getWorkspace(ORG_ID, business.id);

      expect(snapshot.kpis.readings.length).toBeGreaterThan(0);
      for (const kpi of snapshot.kpis.readings) {
        expect(kpi.kpiKey).toBeTruthy();
        expect(kpi.label).toBeTruthy();
      }
    });

    it("returns empty decisions panel when no decisions have been generated", async () => {
      const { business } = await fullSetup(repos);
      const svc = createWorkspaceService(repos);

      const snapshot = await svc.getWorkspace(ORG_ID, business.id);

      expect(snapshot.decisions.pending).toHaveLength(0);
      expect(snapshot.decisions.approved).toHaveLength(0);
      expect(snapshot.decisions.recentlyCompleted).toHaveLength(0);
    });

    it("loop status counts active constraints and recommendations", async () => {
      const { business } = await fullSetup(repos);
      const svc = createWorkspaceService(repos);

      const snapshot = await svc.getWorkspace(ORG_ID, business.id);

      expect(snapshot.loopStatus.activeConstraints).toBeGreaterThanOrEqual(0);
      expect(snapshot.loopStatus.activeRecommendations).toBeGreaterThanOrEqual(0);
    });

    it("returns null health when no health assessment has been run", async () => {
      const profileSvc = createBusinessProfileService(repos);
      const { business } = await profileSvc.createBusiness({
        orgId: ORG_ID,
        name: "No Health Yet Co.",
        industry: "retail",
        employeeCount: 5,
        annualRevenue: 100000,
        businessType: "retail",
        yearsOperating: 1,
        locationCount: 1,
        businessHours: "Mon-Fri 9-5",
      });
      const svc = createWorkspaceService(repos);

      const snapshot = await svc.getWorkspace(ORG_ID, business.id);

      expect(snapshot.health).toBeNull();
    });
  });

  describe("workspaceService.getPendingApprovals()", () => {
    it("returns zero pending when no decisions or recommendations exist", async () => {
      const profileSvc = createBusinessProfileService(repos);
      const { business } = await profileSvc.createBusiness({
        orgId: ORG_ID,
        name: "Empty Approvals Co.",
        industry: "retail",
        employeeCount: 5,
        annualRevenue: 100000,
        businessType: "retail",
        yearsOperating: 1,
        locationCount: 1,
        businessHours: "Mon-Fri 9-5",
      });
      const svc = createWorkspaceService(repos);

      const queue = await svc.getPendingApprovals(ORG_ID, business.id);

      expect(queue.pendingDecisions).toHaveLength(0);
      expect(queue.pendingRecommendations).toHaveLength(0);
      expect(queue.totalPending).toBe(0);
    });

    it("totalPending equals sum of pending decisions and recommendations", async () => {
      const { business } = await fullSetup(repos);
      const svc = createWorkspaceService(repos);

      const queue = await svc.getPendingApprovals(ORG_ID, business.id);

      expect(queue.totalPending).toBe(queue.pendingDecisions.length + queue.pendingRecommendations.length);
    });

    it("approvalQueue in workspace snapshot matches getPendingApprovals", async () => {
      const { business } = await fullSetup(repos);
      const svc = createWorkspaceService(repos);

      const [snapshot, queue] = await Promise.all([
        svc.getWorkspace(ORG_ID, business.id),
        svc.getPendingApprovals(ORG_ID, business.id),
      ]);

      expect(snapshot.approvalQueue.totalPending).toBe(queue.totalPending);
    });
  });

  describe("Event emission on workspace.view.loaded", () => {
    it("workspace service emits workspace.view.loaded event on getWorkspace call", async () => {
      const { business } = await fullSetup(repos);
      const svc = createWorkspaceService(repos);

      const received: string[] = [];
      repos.eventBus.subscribe("workspace.view.loaded", (e) => {
        received.push(e.type);
      });

      await svc.getWorkspace(ORG_ID, business.id);
    });
  });
});
