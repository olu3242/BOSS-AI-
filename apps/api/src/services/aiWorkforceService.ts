import { aiEmployeeRegistry } from "@boss/registries";
import type { AiEmployeeEntry } from "@boss/registries";
import type { RepositoryContainer } from "../container.js";

export interface AiWorkforceService {
  listAll(): AiEmployeeEntry[];
  getEmployee(key: string): AiEmployeeEntry | null;
  listByLifecycle(lifecycle: AiEmployeeEntry["lifecycle"]): AiEmployeeEntry[];
  listByCapability(capability: string): AiEmployeeEntry[];
  activateEmployee(orgId: string, employeeKey: string): Promise<{ employeeKey: string; orgId: string; activatedAt: string }>;
  deactivateEmployee(orgId: string, employeeKey: string): Promise<void>;
  listActiveForOrg(orgId: string): Promise<AiEmployeeEntry[]>;
}

export function createAiWorkforceService(repos: RepositoryContainer): AiWorkforceService {
  return {
    listAll() {
      return aiEmployeeRegistry.list();
    },

    getEmployee(key: string) {
      return aiEmployeeRegistry.get(key) ?? null;
    },

    listByLifecycle(lifecycle) {
      return aiEmployeeRegistry.list().filter((e) => e.lifecycle === lifecycle);
    },

    listByCapability(capability: string) {
      return aiEmployeeRegistry.list().filter((e) => e.capabilities.includes(capability));
    },

    async activateEmployee(orgId: string, employeeKey: string) {
      const employee = aiEmployeeRegistry.get(employeeKey);
      if (!employee) {
        throw new Error(`Unknown AI employee: ${employeeKey}`);
      }
      if (employee.lifecycle === "deprecated") {
        throw new Error(`AI employee '${employeeKey}' is deprecated and cannot be activated`);
      }
      const activatedAt = new Date().toISOString();
      await repos.eventBus.publish({
        type: "ai_workforce.employee.activated",
        payload: { orgId, employeeKey, lifecycle: employee.lifecycle },
        occurredAt: activatedAt,
      });
      return { employeeKey, orgId, activatedAt };
    },

    async deactivateEmployee(orgId: string, employeeKey: string) {
      await repos.eventBus.publish({
        type: "ai_workforce.employee.deactivated",
        payload: { orgId, employeeKey },
        occurredAt: new Date().toISOString(),
      });
    },

    async listActiveForOrg(orgId: string) {
      const activatedEvents = await repos.eventLog.listByType("ai_workforce.employee.activated", 500);
      const deactivatedEvents = await repos.eventLog.listByType("ai_workforce.employee.deactivated", 500);

      const activated = new Set(
        activatedEvents
          .filter((e) => (e.payload as { orgId?: string }).orgId === orgId)
          .map((e) => (e.payload as { employeeKey: string }).employeeKey)
      );

      const deactivated = new Set(
        deactivatedEvents
          .filter((e) => (e.payload as { orgId?: string }).orgId === orgId)
          .map((e) => (e.payload as { employeeKey: string }).employeeKey)
      );

      for (const key of deactivated) {
        activated.delete(key);
      }

      return Array.from(activated)
        .map((key) => aiEmployeeRegistry.get(key))
        .filter((e): e is AiEmployeeEntry => e != null);
    },
  };
}
