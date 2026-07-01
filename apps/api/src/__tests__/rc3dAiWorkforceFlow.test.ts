import { describe, it, expect, beforeAll } from "vitest";
import { installGeneralSmbPack } from "@boss/industry-pack-general-smb";
import { aiEmployeeRegistry } from "@boss/registries";
import { createAiWorkforceService } from "../services/aiWorkforceService.js";
import { createInMemoryContainer } from "../container.js";

beforeAll(() => {
  installGeneralSmbPack();
});

describe("Platform AI Workforce — registry completeness", () => {
  it("registers 10 platform AI employees", () => {
    expect(aiEmployeeRegistry.list().length).toBeGreaterThanOrEqual(10);
  });

  it("includes all 7 original general-smb employees", () => {
    const keys = aiEmployeeRegistry.list().map((e) => e.key);
    expect(keys).toContain("ceo_advisor");
    expect(keys).toContain("ai_front_desk");
    expect(keys).toContain("ai_follow_up_assistant");
    expect(keys).toContain("ai_operations_coordinator");
    expect(keys).toContain("ai_review_manager");
    expect(keys).toContain("ai_collections_assistant");
    expect(keys).toContain("ai_reporting_analyst");
  });

  it("includes 3 new platform employees", () => {
    const keys = aiEmployeeRegistry.list().map((e) => e.key);
    expect(keys).toContain("bte_orchestrator");
    expect(keys).toContain("marketplace_advisor");
    expect(keys).toContain("onboarding_coach");
  });
});

describe("BTE Orchestrator", () => {
  it("has lifecycle: available", () => {
    const e = aiEmployeeRegistry.get("bte_orchestrator");
    expect(e?.lifecycle).toBe("available");
  });

  it("has required tools for BTE cycle", () => {
    const e = aiEmployeeRegistry.get("bte_orchestrator");
    expect(e?.requiredTools).toContain("business_health_api");
    expect(e?.requiredTools).toContain("recommendation_api");
    expect(e?.requiredTools).toContain("workflow_api");
  });

  it("tracks business_health_score KPI", () => {
    const e = aiEmployeeRegistry.get("bte_orchestrator");
    expect(e?.kpis).toContain("business_health_score");
  });

  it("has write:audit_log permission", () => {
    const e = aiEmployeeRegistry.get("bte_orchestrator");
    expect(e?.permissions).toContain("write:audit_log");
  });
});

describe("Marketplace Advisor", () => {
  it("has lifecycle: available", () => {
    const e = aiEmployeeRegistry.get("marketplace_advisor");
    expect(e?.lifecycle).toBe("available");
  });

  it("reads marketplace data", () => {
    const e = aiEmployeeRegistry.get("marketplace_advisor");
    expect(e?.permissions).toContain("read:marketplace");
  });

  it("writes recommendations", () => {
    const e = aiEmployeeRegistry.get("marketplace_advisor");
    expect(e?.permissions).toContain("write:recommendations");
  });
});

describe("Onboarding Coach", () => {
  it("has lifecycle: available", () => {
    const e = aiEmployeeRegistry.get("onboarding_coach");
    expect(e?.lifecycle).toBe("available");
  });

  it("has communication capability", () => {
    const e = aiEmployeeRegistry.get("onboarding_coach");
    expect(e?.capabilities).toContain("communication");
  });

  it("escalates if MRI incomplete after 72h", () => {
    const e = aiEmployeeRegistry.get("onboarding_coach");
    expect(e?.escalationRules).toContain("escalate_if_mri_incomplete_after_72h");
  });
});

describe("AiWorkforceService", () => {
  const repos = createInMemoryContainer();
  const svc = createAiWorkforceService(repos);

  it("listAll returns all registered employees", () => {
    const all = svc.listAll();
    expect(all.length).toBeGreaterThanOrEqual(10);
  });

  it("getEmployee returns correct entry", () => {
    const e = svc.getEmployee("bte_orchestrator");
    expect(e?.label).toBe("BTE Orchestrator");
  });

  it("getEmployee returns null for unknown key", () => {
    expect(svc.getEmployee("nonexistent_xyz")).toBeNull();
  });

  it("listByLifecycle filters correctly", () => {
    const available = svc.listByLifecycle("available");
    expect(available.every((e) => e.lifecycle === "available")).toBe(true);
    expect(available.map((e) => e.key)).toContain("bte_orchestrator");
    expect(available.map((e) => e.key)).toContain("marketplace_advisor");
    expect(available.map((e) => e.key)).toContain("onboarding_coach");
  });

  it("listByCapability filters correctly", () => {
    const comms = svc.listByCapability("communication");
    expect(comms.length).toBeGreaterThan(0);
    expect(comms.every((e) => e.capabilities.includes("communication"))).toBe(true);
  });

  it("activateEmployee publishes activation event", async () => {
    const result = await svc.activateEmployee("org-1", "bte_orchestrator");
    expect(result.employeeKey).toBe("bte_orchestrator");
    expect(result.orgId).toBe("org-1");
    expect(result.activatedAt).toBeTruthy();
  });

  it("activateEmployee throws for unknown employee", async () => {
    await expect(svc.activateEmployee("org-1", "ghost_employee")).rejects.toThrow("Unknown AI employee");
  });

  it("listActiveForOrg returns employees after activation", async () => {
    await svc.activateEmployee("org-2", "marketplace_advisor");
    const active = await svc.listActiveForOrg("org-2");
    expect(active.map((e) => e.key)).toContain("marketplace_advisor");
  });

  it("deactivateEmployee removes from active list", async () => {
    await svc.activateEmployee("org-3", "onboarding_coach");
    await svc.deactivateEmployee("org-3", "onboarding_coach");
    const active = await svc.listActiveForOrg("org-3");
    expect(active.map((e) => e.key)).not.toContain("onboarding_coach");
  });

  it("listActiveForOrg is tenant-isolated", async () => {
    await svc.activateEmployee("org-4a", "ceo_advisor");
    const orgB = await svc.listActiveForOrg("org-4b");
    expect(orgB.map((e) => e.key)).not.toContain("ceo_advisor");
  });
});
