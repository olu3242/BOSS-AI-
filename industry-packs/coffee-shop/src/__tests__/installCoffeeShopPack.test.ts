import { beforeAll, describe, expect, it } from "vitest";
import {
  kpiRegistry,
  workflowRegistry,
  decisionRegistry,
  aiEmployeeRegistry,
  constraintRegistry,
  playbookRegistry,
  mriQuestionRegistry,
  providerDefinitionRegistry,
  toolDefinitionRegistry,
  workspaceRegistry,
} from "@boss/registries";
import { installGeneralSmbPack } from "@boss/industry-pack-general-smb";
import {
  installCoffeeShopPack,
  isCoffeeShopIndustry,
  COFFEE_SHOP_PACK_VERSION,
  COFFEE_SHOP_INDUSTRIES,
} from "../index.js";

describe("Coffee Shop Industry Pack", () => {
  beforeAll(() => {
    installGeneralSmbPack();
    installCoffeeShopPack();
  });

  // ─── WS1: Registry ─────────────────────────────────────────────────────────

  describe("WS1 — Industry Registry", () => {
    it("registers 10 café KPIs", () => {
      const cafeKpis = kpiRegistry.list().filter((k) => k.key.startsWith("cafe_"));
      expect(cafeKpis.length).toBeGreaterThanOrEqual(10);
    });

    it("all KPIs have required fields", () => {
      const cafeKpis = kpiRegistry.list().filter((k) => k.key.startsWith("cafe_"));
      for (const kpi of cafeKpis) {
        expect(kpi.label).toBeTruthy();
        expect(kpi.description).toBeTruthy();
        expect(kpi.owner).toBeTruthy();
        expect(kpi.measurementFrequency).toBeTruthy();
        expect(kpi.targetRange).toBeTruthy();
      }
    });

    it("registers 7 café constraints", () => {
      const cafeConstraints = constraintRegistry.list().filter((c) => c.key.startsWith("cafe_"));
      expect(cafeConstraints.length).toBeGreaterThanOrEqual(7);
    });

    it("registers 6 AI employee roles", () => {
      const cafeEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("cafe_"));
      expect(cafeEmployees.length).toBeGreaterThanOrEqual(6);
    });

    it("all AI employees reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const cafeEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("cafe_"));
      for (const employee of cafeEmployees) {
        for (const kpiKey of employee.kpis) {
          expect(kpiKeys.has(kpiKey), `AI employee ${employee.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("registers 5 industry MRI questions", () => {
      const cafeMri = mriQuestionRegistry.list().filter((q) => q.key.startsWith("cafe_"));
      expect(cafeMri.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ─── WS2: Workflows ────────────────────────────────────────────────────────

  describe("WS2 — Industry Workflows", () => {
    it("registers 11 café workflows", () => {
      const cafeWorkflows = workflowRegistry.list().filter((w) => w.key.startsWith("cafe_"));
      expect(cafeWorkflows.length).toBeGreaterThanOrEqual(11);
    });

    it("full café operations workflow chain is defined", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      const requiredWorkflows = [
        "cafe_morning_opening",
        "cafe_order_taking",
        "cafe_beverage_preparation",
        "cafe_inventory_ordering",
        "cafe_waste_tracking",
        "cafe_staff_scheduling",
        "cafe_loyalty_enrollment",
        "cafe_equipment_cleaning",
        "cafe_daily_close",
        "cafe_online_order_fulfillment",
        "cafe_promotional_campaign",
      ];
      for (const key of requiredWorkflows) {
        expect(workflowKeys.has(key), `Missing workflow: ${key}`).toBe(true);
      }
    });
  });

  // ─── WS3: Coffee Shop Workspace ────────────────────────────────────────────

  describe("WS3 — Coffee Shop Workspace", () => {
    it("registers coffee shop workspace", () => {
      const ws = workspaceRegistry.get("cafe_coffee_shop_workspace");
      expect(ws).toBeDefined();
      expect(ws!.layout).toBe("operational");
    });

    it("workspace has all required modules", () => {
      const ws = workspaceRegistry.get("cafe_coffee_shop_workspace");
      const moduleKeys = ws!.modules.map((m) => m.moduleKey);
      expect(moduleKeys).toContain("kpi_strip");
      expect(moduleKeys).toContain("decisions_panel");
      expect(moduleKeys).toContain("approval_queue");
      expect(moduleKeys).toContain("health_summary");
    });

    it("workspace primary metric is a valid KPI", () => {
      const ws = workspaceRegistry.get("cafe_coffee_shop_workspace");
      const kpi = kpiRegistry.get(ws!.primaryMetricKey);
      expect(kpi).toBeDefined();
    });
  });

  // ─── WS4: KPIs ─────────────────────────────────────────────────────────────

  describe("WS4 — Industry KPIs", () => {
    const expectedKpis = [
      "cafe_avg_ticket_size",
      "cafe_transactions_per_hour",
      "cafe_beverage_cost_pct",
      "cafe_food_cost_pct",
      "cafe_labor_cost_pct",
      "cafe_waste_pct",
      "cafe_loyalty_member_pct",
      "cafe_drive_thru_speed_sec",
      "cafe_online_review_rating",
      "cafe_revenue_per_sqft",
    ];

    for (const kpiKey of expectedKpis) {
      it(`registers KPI: ${kpiKey}`, () => {
        expect(kpiRegistry.get(kpiKey)).toBeDefined();
      });
    }
  });

  // ─── WS5: Decision OS ──────────────────────────────────────────────────────

  describe("WS5 — Decision OS Extensions", () => {
    it("registers 8 café decision templates", () => {
      const cafeDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("cafe_"));
      expect(cafeDecisions.length).toBeGreaterThanOrEqual(8);
    });

    it("all decisions reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const cafeDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("cafe_"));
      for (const decision of cafeDecisions) {
        for (const kpiKey of decision.relatedKpiKeys) {
          expect(kpiKeys.has(kpiKey), `Decision ${decision.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("all decisions reference valid constraints", () => {
      const constraintKeys = new Set(constraintRegistry.list().map((c) => c.key));
      const cafeDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("cafe_"));
      for (const decision of cafeDecisions) {
        for (const constraintKey of decision.relatedConstraintDefinitionKeys) {
          expect(
            constraintKeys.has(constraintKey),
            `Decision ${decision.key} references unknown constraint: ${constraintKey}`,
          ).toBe(true);
        }
      }
    });

    it("reduce waste decision targets waste_pct", () => {
      const decision = decisionRegistry.get("cafe_reduce_waste");
      expect(decision).toBeDefined();
      expect(decision!.relatedKpiKeys).toContain("cafe_waste_pct");
    });
  });

  // ─── WS6: AI Workforce ─────────────────────────────────────────────────────

  describe("WS6 — AI Workforce Extensions", () => {
    it("all 6 café AI roles are registered", () => {
      const roles = [
        "cafe_cafe_manager",
        "cafe_head_barista",
        "cafe_inventory_coordinator",
        "cafe_customer_experience_manager",
        "cafe_marketing_coordinator",
        "cafe_shift_supervisor",
      ];
      for (const role of roles) {
        expect(aiEmployeeRegistry.get(role), `Missing AI role: ${role}`).toBeDefined();
      }
    });

    it("all roles are available lifecycle", () => {
      const cafeEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("cafe_"));
      for (const employee of cafeEmployees) {
        expect(employee.lifecycle).toBe("available");
      }
    });
  });

  // ─── WS7: Integrations ─────────────────────────────────────────────────────

  describe("WS7 — Integrations", () => {
    it("registers POS accounting, email marketing, and SMS providers", () => {
      const providerKeys = new Set(providerDefinitionRegistry.list().map((p) => p.key));
      expect(providerKeys.has("cafe_pos_accounting")).toBe(true);
      expect(providerKeys.has("cafe_email_marketing")).toBe(true);
      expect(providerKeys.has("cafe_sms_notifications")).toBe(true);
    });

    it("registers sales reporting, loyalty enrollment, and inventory alert tools", () => {
      const toolKeys = new Set(toolDefinitionRegistry.list().map((t) => t.key));
      expect(toolKeys.has("cafe_tool_sales_report")).toBe(true);
      expect(toolKeys.has("cafe_tool_loyalty_enroll")).toBe(true);
      expect(toolKeys.has("cafe_tool_inventory_alert")).toBe(true);
    });
  });

  // ─── WS8: Café Operations Coverage ─────────────────────────────────────────

  describe("WS8 — Café Operations Coverage", () => {
    it("covers full open-to-close operational cycle", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      // Opening
      expect(workflowKeys.has("cafe_morning_opening")).toBe(true);
      // Service
      expect(workflowKeys.has("cafe_order_taking")).toBe(true);
      expect(workflowKeys.has("cafe_beverage_preparation")).toBe(true);
      // Inventory
      expect(workflowKeys.has("cafe_inventory_ordering")).toBe(true);
      expect(workflowKeys.has("cafe_waste_tracking")).toBe(true);
      // People
      expect(workflowKeys.has("cafe_staff_scheduling")).toBe(true);
      // Close
      expect(workflowKeys.has("cafe_daily_close")).toBe(true);
      // Digital
      expect(workflowKeys.has("cafe_online_order_fulfillment")).toBe(true);
    });
  });

  // ─── Pack Metadata ──────────────────────────────────────────────────────────

  describe("Pack Metadata", () => {
    it("exposes version", () => {
      expect(COFFEE_SHOP_PACK_VERSION).toBeTruthy();
    });

    it("idempotent — installing twice has no effect", () => {
      const kpisBefore = kpiRegistry.list().length;
      installCoffeeShopPack();
      expect(kpiRegistry.list().length).toBe(kpisBefore);
    });

    it("isCoffeeShopIndustry correctly classifies industries", () => {
      expect(isCoffeeShopIndustry("coffee_shop")).toBe(true);
      expect(isCoffeeShopIndustry("cafe")).toBe(true);
      expect(isCoffeeShopIndustry("espresso_bar")).toBe(true);
      expect(isCoffeeShopIndustry("dental")).toBe(false);
      expect(isCoffeeShopIndustry("general_smb")).toBe(false);
    });

    it("COFFEE_SHOP_INDUSTRIES includes all 6 sub-verticals", () => {
      expect(COFFEE_SHOP_INDUSTRIES.length).toBe(6);
    });
  });

  // ─── Multi-tenant Isolation ─────────────────────────────────────────────────

  describe("Multi-tenant Isolation", () => {
    it("pack does not add org_id — all entries are org-agnostic by design", () => {
      const cafeKpis = kpiRegistry.list().filter((k) => k.key.startsWith("cafe_"));
      for (const kpi of cafeKpis) {
        expect("orgId" in kpi).toBe(false);
      }
    });
  });

  // ─── Playbooks ──────────────────────────────────────────────────────────────

  describe("Playbooks", () => {
    it("registers 4 café playbooks", () => {
      const cafePlaybooks = playbookRegistry.list().filter((p) => p.key.startsWith("cafe_"));
      expect(cafePlaybooks.length).toBeGreaterThanOrEqual(4);
    });

    it("waste reduction playbook has multiple steps", () => {
      const playbook = playbookRegistry.get("cafe_waste_reduction_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.steps.length).toBeGreaterThanOrEqual(4);
    });

    it("loyalty growth playbook references valid decisions", () => {
      const playbook = playbookRegistry.get("cafe_loyalty_growth_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.relatedDecisionKeys).toContain("cafe_launch_loyalty_program");
    });
  });
});
