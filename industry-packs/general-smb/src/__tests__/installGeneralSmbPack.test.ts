import { beforeAll, describe, expect, it } from "vitest";
import {
  capabilityRegistry,
  constraintRegistry,
  kpiRegistry,
  aiEmployeeRegistry,
  workflowRegistry,
  promptRegistry,
} from "@boss/registries";
import { installGeneralSmbPack } from "../index.js";

describe("installGeneralSmbPack", () => {
  beforeAll(() => {
    installGeneralSmbPack();
  });

  it("registers all capabilities", () => {
    expect(capabilityRegistry.list().length).toBeGreaterThanOrEqual(15);
  });

  it("registers all constraints with valid capability references", () => {
    const capabilityKeys = new Set(capabilityRegistry.list().map((c) => c.key));
    for (const constraint of constraintRegistry.list()) {
      for (const capabilityKey of constraint.relatedCapabilities) {
        expect(capabilityKeys.has(capabilityKey)).toBe(true);
      }
    }
  });

  it("registers KPIs", () => {
    expect(kpiRegistry.list().length).toBeGreaterThanOrEqual(10);
  });

  it("registers AI employees with valid KPI references", () => {
    const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
    for (const employee of aiEmployeeRegistry.list()) {
      for (const kpiKey of employee.kpis) {
        expect(kpiKeys.has(kpiKey)).toBe(true);
      }
    }
  });

  it("registers workflows with valid constraint references", () => {
    const constraintKeys = new Set(constraintRegistry.list().map((c) => c.key));
    for (const workflow of workflowRegistry.list()) {
      for (const constraintKey of workflow.relatedConstraints) {
        expect(constraintKeys.has(constraintKey)).toBe(true);
      }
    }
  });

  it("registers a prompt for every AI employee", () => {
    for (const employee of aiEmployeeRegistry.list()) {
      expect(promptRegistry.get(`${employee.key}.system`)).toBeDefined();
    }
  });
});
