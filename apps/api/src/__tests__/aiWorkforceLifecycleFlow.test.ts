/**
 * TD-023 — AI Employees in Draft Lifecycle
 *
 * Tests that general-smb pack employees ship as "available",
 * and that the promote/deprecate/getEffectiveLifecycle endpoints work.
 */
import { describe, it, expect } from "vitest";
import { aiEmployeeRegistry } from "@boss/registries";
import { createInMemoryContainer } from "../container.js";
import { createAiWorkforceService } from "../services/aiWorkforceService.js";

const ORG = "org-lifecycle-test";

// createInMemoryContainer calls installGeneralSmbPack which seeds employees
createInMemoryContainer();

describe("TD-023 — AI employee lifecycle", () => {
  it("all general-smb employees ship as available (not draft)", () => {
    const draftEmployees = aiEmployeeRegistry.list().filter((e) => e.lifecycle === "draft");
    expect(draftEmployees).toHaveLength(0);
  });

  it("listByLifecycle returns available employees", () => {
    const repos = createInMemoryContainer();
    const svc = createAiWorkforceService(repos);
    const available = svc.listByLifecycle("available");
    expect(available.length).toBeGreaterThan(0);
  });

  it("getEffectiveLifecycle returns registry lifecycle when no events", async () => {
    const repos = createInMemoryContainer();
    const svc = createAiWorkforceService(repos);
    const employee = aiEmployeeRegistry.list().find((e) => e.lifecycle === "available");
    expect(employee).toBeDefined();
    const lifecycle = await svc.getEffectiveLifecycle(ORG, employee!.key);
    expect(lifecycle).toBe("available");
  });

  it("promoteEmployee emits event and returns available", async () => {
    const repos = createInMemoryContainer();
    const svc = createAiWorkforceService(repos);
    const emitted: string[] = [];
    repos.eventBus.subscribe("ai_workforce.employee.promoted", (e) => emitted.push(e.type));

    const employee = aiEmployeeRegistry.list()[0]!;
    const result = await svc.promoteEmployee(ORG, employee.key);

    expect(result.lifecycle).toBe("available");
    expect(result.employeeKey).toBe(employee.key);
    expect(result.promotedAt).toBeTruthy();
    expect(emitted).toContain("ai_workforce.employee.promoted");
  });

  it("deprecateEmployee emits event and returns deprecated", async () => {
    const repos = createInMemoryContainer();
    const svc = createAiWorkforceService(repos);
    const emitted: string[] = [];
    repos.eventBus.subscribe("ai_workforce.employee.deprecated", (e) => emitted.push(e.type));

    const employee = aiEmployeeRegistry.list()[0]!;
    const result = await svc.deprecateEmployee(ORG, employee.key);

    expect(result.lifecycle).toBe("deprecated");
    expect(emitted).toContain("ai_workforce.employee.deprecated");
  });

  it("getEffectiveLifecycle returns deprecated after deprecation event", async () => {
    const repos = createInMemoryContainer();
    const svc = createAiWorkforceService(repos);
    const employee = aiEmployeeRegistry.list()[0]!;

    await svc.deprecateEmployee(ORG, employee.key);
    const lifecycle = await svc.getEffectiveLifecycle(ORG, employee.key);
    expect(lifecycle).toBe("deprecated");
  });

  it("getEffectiveLifecycle returns available after promotion event", async () => {
    const repos = createInMemoryContainer();
    const svc = createAiWorkforceService(repos);
    const employee = aiEmployeeRegistry.list()[0]!;

    await svc.promoteEmployee(ORG, employee.key);
    const lifecycle = await svc.getEffectiveLifecycle(ORG, employee.key);
    expect(lifecycle).toBe("available");
  });

  it("promoteEmployee throws for unknown employee", async () => {
    const repos = createInMemoryContainer();
    const svc = createAiWorkforceService(repos);
    await expect(svc.promoteEmployee(ORG, "no_such_employee")).rejects.toThrow("Unknown");
  });

  it("deprecateEmployee throws for unknown employee", async () => {
    const repos = createInMemoryContainer();
    const svc = createAiWorkforceService(repos);
    await expect(svc.deprecateEmployee(ORG, "no_such_employee")).rejects.toThrow("Unknown");
  });
});
