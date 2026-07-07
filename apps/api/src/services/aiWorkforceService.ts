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
  promoteEmployee(orgId: string, employeeKey: string): Promise<{ employeeKey: string; lifecycle: "available"; promotedAt: string }>;
  deprecateEmployee(orgId: string, employeeKey: string): Promise<{ employeeKey: string; lifecycle: "deprecated"; deprecatedAt: string }>;
  getEffectiveLifecycle(orgId: string, employeeKey: string): Promise<AiEmployeeEntry["lifecycle"]>;
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

    async promoteEmployee(orgId: string, employeeKey: string) {
      const employee = aiEmployeeRegistry.get(employeeKey);
      if (!employee) throw new Error(`Unknown AI employee: ${employeeKey}`);
      if (employee.lifecycle === "deprecated") throw new Error(`AI employee '${employeeKey}' is deprecated and cannot be promoted`);
      const promotedAt = new Date().toISOString();
      await repos.eventBus.publish({
        type: "ai_workforce.employee.promoted",
        payload: { orgId, employeeKey, lifecycle: "available" },
        occurredAt: promotedAt,
      });
      return { employeeKey, lifecycle: "available" as const, promotedAt };
    },

    async deprecateEmployee(orgId: string, employeeKey: string) {
      const employee = aiEmployeeRegistry.get(employeeKey);
      if (!employee) throw new Error(`Unknown AI employee: ${employeeKey}`);
      const deprecatedAt = new Date().toISOString();
      await repos.eventBus.publish({
        type: "ai_workforce.employee.deprecated",
        payload: { orgId, employeeKey, lifecycle: "deprecated" },
        occurredAt: deprecatedAt,
      });
      return { employeeKey, lifecycle: "deprecated" as const, deprecatedAt };
    },

    async getEffectiveLifecycle(orgId: string, employeeKey: string) {
      const employee = aiEmployeeRegistry.get(employeeKey);
      if (!employee) throw new Error(`Unknown AI employee: ${employeeKey}`);

      const [promoted, deprecated] = await Promise.all([
        repos.eventLog.listByType("ai_workforce.employee.promoted", 500),
        repos.eventLog.listByType("ai_workforce.employee.deprecated", 500),
      ]);

      const forEmployee = (events: typeof promoted) =>
        events.filter(
          (e) =>
            (e.payload as { orgId?: string; employeeKey?: string }).orgId === orgId &&
            (e.payload as { employeeKey?: string }).employeeKey === employeeKey,
        );

      const wasPromoted = forEmployee(promoted).length > 0;
      const wasDeprecated = forEmployee(deprecated).length > 0;

      if (wasDeprecated) return "deprecated";
      if (wasPromoted) return "available";
      return employee.lifecycle;
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
