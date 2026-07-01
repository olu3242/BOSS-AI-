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
  installRestaurantPack,
  isRestaurantIndustry,
  RESTAURANT_PACK_VERSION,
  RESTAURANT_INDUSTRIES,
} from "../index.js";

describe("Restaurant Industry Pack", () => {
  beforeAll(() => {
    installGeneralSmbPack();
    installRestaurantPack();
  });

  // ─── WS1: Registry ─────────────────────────────────────────────────────────

  describe("WS1 — Industry Registry", () => {
    it("registers 10 restaurant KPIs", () => {
      const restKpis = kpiRegistry.list().filter((k) => k.key.startsWith("rest_"));
      expect(restKpis.length).toBeGreaterThanOrEqual(10);
    });

    it("all KPIs have required fields", () => {
      const restKpis = kpiRegistry.list().filter((k) => k.key.startsWith("rest_"));
      for (const kpi of restKpis) {
        expect(kpi.label).toBeTruthy();
        expect(kpi.description).toBeTruthy();
        expect(kpi.owner).toBeTruthy();
        expect(kpi.measurementFrequency).toBeTruthy();
        expect(kpi.targetRange).toBeTruthy();
      }
    });

    it("registers 7 restaurant constraints", () => {
      const restConstraints = constraintRegistry.list().filter((c) => c.key.startsWith("rest_"));
      expect(restConstraints.length).toBeGreaterThanOrEqual(7);
    });

    it("registers 6 AI employee roles", () => {
      const restEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("rest_"));
      expect(restEmployees.length).toBeGreaterThanOrEqual(6);
    });

    it("all AI employees reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const restEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("rest_"));
      for (const employee of restEmployees) {
        for (const kpiKey of employee.kpis) {
          expect(kpiKeys.has(kpiKey), `AI employee ${employee.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("registers 5 industry MRI questions", () => {
      const restMri = mriQuestionRegistry.list().filter((q) => q.key.startsWith("rest_"));
      expect(restMri.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ─── WS2: Workflows ────────────────────────────────────────────────────────

  describe("WS2 — Industry Workflows", () => {
    it("registers 11 restaurant workflows", () => {
      const restWorkflows = workflowRegistry.list().filter((w) => w.key.startsWith("rest_"));
      expect(restWorkflows.length).toBeGreaterThanOrEqual(11);
    });

    it("full service cycle workflow chain is defined", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      const requiredWorkflows = [
        "rest_reservation_management",
        "rest_reservation_confirmation",
        "rest_table_management",
        "rest_order_taking",
        "rest_kitchen_ticket_management",
        "rest_inventory_receiving",
        "rest_waste_tracking",
        "rest_end_of_day_reconciliation",
        "rest_weekly_prime_cost_review",
        "rest_review_response",
        "rest_staff_scheduling",
      ];
      for (const key of requiredWorkflows) {
        expect(workflowKeys.has(key), `Missing workflow: ${key}`).toBe(true);
      }
    });
  });

  // ─── WS3: Restaurant Workspace ─────────────────────────────────────────────

  describe("WS3 — Restaurant Workspace", () => {
    it("registers restaurant operations workspace", () => {
      const ws = workspaceRegistry.get("rest_operations_workspace");
      expect(ws).toBeDefined();
      expect(ws!.layout).toBe("operational");
    });

    it("workspace has all required modules", () => {
      const ws = workspaceRegistry.get("rest_operations_workspace");
      const moduleKeys = ws!.modules.map((m) => m.moduleKey);
      expect(moduleKeys).toContain("kpi_strip");
      expect(moduleKeys).toContain("decisions_panel");
      expect(moduleKeys).toContain("approval_queue");
      expect(moduleKeys).toContain("health_summary");
    });

    it("workspace primary metric is prime cost", () => {
      const ws = workspaceRegistry.get("rest_operations_workspace");
      expect(ws!.primaryMetricKey).toBe("rest_prime_cost_pct");
      expect(kpiRegistry.get(ws!.primaryMetricKey)).toBeDefined();
    });
  });

  // ─── WS4: KPIs ─────────────────────────────────────────────────────────────

  describe("WS4 — Industry KPIs", () => {
    const expectedKpis = [
      "rest_food_cost_pct",
      "rest_labor_cost_pct",
      "rest_prime_cost_pct",
      "rest_avg_check_size",
      "rest_table_turn_rate",
      "rest_revpash",
      "rest_reservation_fill_rate",
      "rest_no_show_rate",
      "rest_waste_pct",
      "rest_online_review_rating",
    ];

    for (const kpiKey of expectedKpis) {
      it(`registers KPI: ${kpiKey}`, () => {
        expect(kpiRegistry.get(kpiKey)).toBeDefined();
      });
    }
  });

  // ─── WS5: Decision OS ──────────────────────────────────────────────────────

  describe("WS5 — Decision OS Extensions", () => {
    it("registers 8 restaurant decision templates", () => {
      const restDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("rest_"));
      expect(restDecisions.length).toBeGreaterThanOrEqual(8);
    });

    it("all decisions reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const restDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("rest_"));
      for (const decision of restDecisions) {
        for (const kpiKey of decision.relatedKpiKeys) {
          expect(kpiKeys.has(kpiKey), `Decision ${decision.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("all decisions reference valid constraints", () => {
      const constraintKeys = new Set(constraintRegistry.list().map((c) => c.key));
      const restDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("rest_"));
      for (const decision of restDecisions) {
        for (const constraintKey of decision.relatedConstraintDefinitionKeys) {
          expect(
            constraintKeys.has(constraintKey),
            `Decision ${decision.key} references unknown constraint: ${constraintKey}`,
          ).toBe(true);
        }
      }
    });

    it("reduce food cost decision targets prime cost", () => {
      const decision = decisionRegistry.get("rest_reduce_food_cost");
      expect(decision).toBeDefined();
      expect(decision!.relatedKpiKeys).toContain("rest_prime_cost_pct");
    });
  });

  // ─── WS6: AI Workforce ─────────────────────────────────────────────────────

  describe("WS6 — AI Workforce Extensions", () => {
    it("all 6 restaurant AI roles are registered", () => {
      const roles = [
        "rest_general_manager",
        "rest_kitchen_manager",
        "rest_floor_manager",
        "rest_reservations_coordinator",
        "rest_revenue_manager",
        "rest_guest_experience_coordinator",
      ];
      for (const role of roles) {
        expect(aiEmployeeRegistry.get(role), `Missing AI role: ${role}`).toBeDefined();
      }
    });

    it("all roles are available lifecycle", () => {
      const restEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("rest_"));
      for (const employee of restEmployees) {
        expect(employee.lifecycle).toBe("available");
      }
    });
  });

  // ─── WS7: Integrations ─────────────────────────────────────────────────────

  describe("WS7 — Integrations", () => {
    it("registers POS, reservation, and inventory providers", () => {
      const providerKeys = new Set(providerDefinitionRegistry.list().map((p) => p.key));
      expect(providerKeys.has("rest_provider_pos")).toBe(true);
      expect(providerKeys.has("rest_provider_reservation")).toBe(true);
      expect(providerKeys.has("rest_provider_inventory")).toBe(true);
    });

    it("registers reminder, waste, and sales tools", () => {
      const toolKeys = new Set(toolDefinitionRegistry.list().map((t) => t.key));
      expect(toolKeys.has("rest_tool_send_reservation_reminder")).toBe(true);
      expect(toolKeys.has("rest_tool_log_waste")).toBe(true);
      expect(toolKeys.has("rest_tool_get_daily_sales")).toBe(true);
    });
  });

  // ─── WS8: Service Cycle Coverage ───────────────────────────────────────────

  describe("WS8 — Full Service Cycle Coverage", () => {
    it("covers complete reservation-to-close cycle", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      // Pre-service
      expect(workflowKeys.has("rest_reservation_management")).toBe(true);
      expect(workflowKeys.has("rest_staff_scheduling")).toBe(true);
      // During service
      expect(workflowKeys.has("rest_table_management")).toBe(true);
      expect(workflowKeys.has("rest_order_taking")).toBe(true);
      expect(workflowKeys.has("rest_kitchen_ticket_management")).toBe(true);
      // Post-service
      expect(workflowKeys.has("rest_end_of_day_reconciliation")).toBe(true);
      // Cost management
      expect(workflowKeys.has("rest_waste_tracking")).toBe(true);
      expect(workflowKeys.has("rest_weekly_prime_cost_review")).toBe(true);
    });
  });

  // ─── Pack Metadata ──────────────────────────────────────────────────────────

  describe("Pack Metadata", () => {
    it("exposes version", () => {
      expect(RESTAURANT_PACK_VERSION).toBeTruthy();
    });

    it("idempotent — installing twice has no effect", () => {
      const kpisBefore = kpiRegistry.list().length;
      installRestaurantPack();
      expect(kpiRegistry.list().length).toBe(kpisBefore);
    });

    it("isRestaurantIndustry correctly classifies industries", () => {
      expect(isRestaurantIndustry("restaurant")).toBe(true);
      expect(isRestaurantIndustry("casual_dining")).toBe(true);
      expect(isRestaurantIndustry("fine_dining")).toBe(true);
      expect(isRestaurantIndustry("hvac")).toBe(false);
      expect(isRestaurantIndustry("dental")).toBe(false);
    });

    it("RESTAURANT_INDUSTRIES includes all 7 sub-verticals", () => {
      expect(RESTAURANT_INDUSTRIES.length).toBe(7);
    });
  });

  // ─── Multi-tenant Isolation ─────────────────────────────────────────────────

  describe("Multi-tenant Isolation", () => {
    it("pack does not add org_id — all entries are org-agnostic by design", () => {
      const restKpis = kpiRegistry.list().filter((k) => k.key.startsWith("rest_"));
      for (const kpi of restKpis) {
        expect("orgId" in kpi).toBe(false);
      }
    });
  });

  // ─── Playbooks ──────────────────────────────────────────────────────────────

  describe("Playbooks", () => {
    it("registers 4 restaurant playbooks", () => {
      const restPlaybooks = playbookRegistry.list().filter((p) => p.key.startsWith("rest_"));
      expect(restPlaybooks.length).toBeGreaterThanOrEqual(4);
    });

    it("food cost playbook has multiple steps", () => {
      const playbook = playbookRegistry.get("rest_food_cost_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.steps.length).toBeGreaterThanOrEqual(4);
    });

    it("no-show playbook targets reservation constraints", () => {
      const playbook = playbookRegistry.get("rest_no_show_reduction_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.relatedDecisionKeys).toContain("rest_reduce_no_shows");
    });
  });
});
