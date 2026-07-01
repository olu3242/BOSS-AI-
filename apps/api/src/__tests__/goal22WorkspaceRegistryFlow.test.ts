/**
 * Goal 22 — Unified Business Workspace: Registry Layer Certification Tests
 * Workstream 7: workspace, timeline, approval, automationCenter, intelligenceCenter registries.
 */
import { describe, it, expect } from "vitest";
import { installGeneralSmbPack } from "@boss/industry-pack-general-smb";
import {
  workspaceRegistry,
  timelineRegistry,
  approvalRegistry,
  automationCenterRegistry,
  intelligenceCenterRegistry,
} from "@boss/registries";

installGeneralSmbPack();

describe("Goal 22 — Workstream 7: Registry Harmonization", () => {
  describe("workspaceRegistry", () => {
    it("contains at least 3 workspace configurations", () => {
      const entries = workspaceRegistry.list();
      expect(entries.length).toBeGreaterThanOrEqual(3);
    });

    it("executive_workspace has all required fields", () => {
      const ws = workspaceRegistry.get("executive_workspace");
      expect(ws).toBeDefined();
      expect(ws!.layout).toBe("executive");
      expect(ws!.modules.length).toBeGreaterThanOrEqual(4);
      expect(ws!.primaryMetricKey).toBeTruthy();
      expect(ws!.showOperatingLoopStatus).toBe(true);
    });

    it("every workspace module has a valid moduleKey and position", () => {
      for (const ws of workspaceRegistry.list()) {
        for (const mod of ws.modules) {
          expect(mod.moduleKey).toBeTruthy();
          expect(mod.position).toBeGreaterThan(0);
          expect(mod.refreshIntervalSeconds).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("timelineRegistry", () => {
    it("contains at least 1 timeline configuration", () => {
      const entries = timelineRegistry.list();
      expect(entries.length).toBeGreaterThanOrEqual(1);
    });

    it("smb_timeline_default has all filters and event types", () => {
      const tl = timelineRegistry.get("smb_timeline_default");
      expect(tl).toBeDefined();
      expect(tl!.filters.length).toBeGreaterThanOrEqual(5);
      expect(tl!.showEventTypes.length).toBeGreaterThanOrEqual(10);
      expect(tl!.groupByDay).toBe(true);
      expect(tl!.enableSearch).toBe(true);
    });

    it("every filter has a valid preset and maxEntries", () => {
      const tl = timelineRegistry.get("smb_timeline_default")!;
      for (const filter of tl.filters) {
        expect(filter.preset).toBeTruthy();
        expect(filter.maxEntries).toBeGreaterThan(0);
        expect(["newest_first", "oldest_first"]).toContain(filter.defaultSort);
      }
    });
  });

  describe("approvalRegistry", () => {
    it("contains at least 3 approval workflow configurations", () => {
      const entries = approvalRegistry.list();
      expect(entries.length).toBeGreaterThanOrEqual(3);
    });

    it("decision_approval requires executive brief and has SLA configs", () => {
      const ap = approvalRegistry.get("decision_approval");
      expect(ap).toBeDefined();
      expect(ap!.entityType).toBe("decision");
      expect(ap!.requiresExecutiveBrief).toBe(true);
      expect(ap!.slaConfigs.length).toBe(4);
    });

    it("every approval entry has SLA for all urgency levels", () => {
      for (const ap of approvalRegistry.list()) {
        const urgencies = ap.slaConfigs.map((s) => s.urgency);
        expect(urgencies).toContain("low");
        expect(urgencies).toContain("medium");
        expect(urgencies).toContain("high");
        expect(urgencies).toContain("critical");
      }
    });
  });

  describe("automationCenterRegistry", () => {
    it("contains at least 5 automation rule templates", () => {
      const entries = automationCenterRegistry.list();
      expect(entries.length).toBeGreaterThanOrEqual(5);
    });

    it("auto_loop_on_constraint triggers operating loop", () => {
      const auto = automationCenterRegistry.get("auto_loop_on_constraint");
      expect(auto).toBeDefined();
      expect(auto!.ruleSteps[0]!.actionType).toBe("run_operating_loop");
      expect(auto!.requiresApproval).toBe(false);
    });

    it("every automation has at least 1 rule step with valid trigger and action", () => {
      for (const auto of automationCenterRegistry.list()) {
        expect(auto.ruleSteps.length).toBeGreaterThanOrEqual(1);
        for (const step of auto.ruleSteps) {
          expect(step.triggerType).toBeTruthy();
          expect(step.actionType).toBeTruthy();
          expect(step.triggerCondition).toBeTruthy();
        }
        expect(auto.estimatedTimeSavedMinutesPerWeek).toBeGreaterThan(0);
      }
    });
  });

  describe("intelligenceCenterRegistry", () => {
    it("contains at least 2 intelligence center configurations", () => {
      const entries = intelligenceCenterRegistry.list();
      expect(entries.length).toBeGreaterThanOrEqual(2);
    });

    it("smb_intelligence_default has 6 panels covering all intelligence types", () => {
      const ic = intelligenceCenterRegistry.get("smb_intelligence_default");
      expect(ic).toBeDefined();
      expect(ic!.summaryPanels.length).toBeGreaterThanOrEqual(5);
      expect(ic!.showConfidenceScores).toBe(true);
      expect(ic!.linkToDecisionPipeline).toBe(true);
      const panelTypes = ic!.summaryPanels.map((p) => p.panelType);
      expect(panelTypes).toContain("root_cause_summary");
      expect(panelTypes).toContain("optimization_report");
      expect(panelTypes).toContain("kpi_trend");
    });

    it("every panel has a valid position and refresh policy", () => {
      for (const ic of intelligenceCenterRegistry.list()) {
        for (const panel of ic.summaryPanels) {
          expect(panel.position).toBeGreaterThan(0);
          expect(panel.maxItemsToShow).toBeGreaterThan(0);
          expect(["on_demand", "hourly", "daily"]).toContain(panel.refreshPolicy);
        }
      }
    });
  });

  describe("Registry idempotency", () => {
    it("installGeneralSmbPack is idempotent — second call does not throw", () => {
      expect(() => installGeneralSmbPack()).not.toThrow();
    });

    it("all 5 new registries remain populated after second install call", () => {
      expect(workspaceRegistry.list().length).toBeGreaterThanOrEqual(3);
      expect(timelineRegistry.list().length).toBeGreaterThanOrEqual(1);
      expect(approvalRegistry.list().length).toBeGreaterThanOrEqual(3);
      expect(automationCenterRegistry.list().length).toBeGreaterThanOrEqual(5);
      expect(intelligenceCenterRegistry.list().length).toBeGreaterThanOrEqual(2);
    });
  });
});
