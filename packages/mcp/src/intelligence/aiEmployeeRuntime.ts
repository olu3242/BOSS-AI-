import { aiEmployeeRegistry } from "@boss/registries";

export class AiEmployeeNotFoundError extends Error {
  constructor(employeeKey: string) {
    super(`No AI employee is registered with key "${employeeKey}"`);
  }
}

export interface AiEmployeeTaskRequest {
  employeeKey: string;
  capabilityKey: string;
  requestedBy: string;
  input: Record<string, unknown>;
}

export interface AiEmployeeToolRequest {
  capabilityKey: string;
  roleKey: string;
  requestedBy: string;
  input: Record<string, unknown>;
}

export type AiEmployeeDecision =
  | { kind: "execute"; toolRequest: AiEmployeeToolRequest }
  | { kind: "escalate"; reason: string };

/**
 * Decides what an AI employee should do with a task request, purely from
 * the registry's declared capabilities/lifecycle — no execution happens
 * here (Law 1). The Loop Runtime, via the Tool Fabric, performs the actual
 * "execute" decision; an "escalate" decision means the employee cannot
 * safely handle the task and a human/owning workflow must be notified.
 */
export function decideAiEmployeeAction(request: AiEmployeeTaskRequest): AiEmployeeDecision {
  const employee = aiEmployeeRegistry.get(request.employeeKey);
  if (!employee) {
    throw new AiEmployeeNotFoundError(request.employeeKey);
  }

  if (employee.lifecycle !== "available") {
    return {
      kind: "escalate",
      reason: `AI employee "${request.employeeKey}" is not available for execution (lifecycle="${employee.lifecycle}")`,
    };
  }

  if (!employee.capabilities.includes(request.capabilityKey)) {
    return {
      kind: "escalate",
      reason: `AI employee "${request.employeeKey}" does not have capability "${request.capabilityKey}"`,
    };
  }

  return {
    kind: "execute",
    toolRequest: {
      capabilityKey: request.capabilityKey,
      roleKey: request.employeeKey,
      requestedBy: request.requestedBy,
      input: request.input,
    },
  };
}
