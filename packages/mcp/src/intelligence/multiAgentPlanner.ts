import { aiEmployeeRegistry } from "@boss/registries";

export interface AgentPlanStep {
  stepKey: string;
  employeeKey: string;
  capabilityKey: string;
  parallel: boolean;
  parallelGroupKey?: string;
  reason: string;
}

export interface AgentPlan {
  planId: string;
  goal: string;
  steps: AgentPlanStep[];
  reflectionRequired: boolean;
  createdAt: string;
}

export interface PlanningContext {
  goal: string;
  requiredCapabilities: string[];
  preferParallel?: boolean;
}

/**
 * Plans which AI employees to engage for a multi-agent goal.
 * Pure intelligence — no execution happens here (Law 1).
 * Employees are matched by capability; if multiple employees share a
 * capability and preferParallel is set, they are grouped for concurrent
 * execution.
 */
export function planMultiAgentTask(
  ctx: PlanningContext,
  employeeKeys: string[]
): AgentPlan {
  const planId = `plan_${Date.now()}`;
  const steps: AgentPlanStep[] = [];

  const employees = employeeKeys
    .map((key) => aiEmployeeRegistry.get(key))
    .filter((e): e is NonNullable<typeof e> => e !== undefined && e.lifecycle === "available");

  const capabilityToEmployees = new Map<string, string[]>();
  for (const emp of employees) {
    for (const cap of emp.capabilities) {
      if (!ctx.requiredCapabilities.length || ctx.requiredCapabilities.includes(cap)) {
        const existing = capabilityToEmployees.get(cap) ?? [];
        existing.push(emp.key);
        capabilityToEmployees.set(cap, existing);
      }
    }
  }

  let stepIndex = 0;
  for (const [capabilityKey, assignedEmployees] of capabilityToEmployees.entries()) {
    const isParallel = ctx.preferParallel === true && assignedEmployees.length > 1;
    const groupKey = isParallel ? `parallel_${capabilityKey}` : undefined;

    for (const employeeKey of assignedEmployees) {
      steps.push({
        stepKey: `agent_step_${stepIndex}`,
        employeeKey,
        capabilityKey,
        parallel: isParallel,
        parallelGroupKey: groupKey,
        reason: `Employee "${employeeKey}" assigned to capability "${capabilityKey}" for goal: ${ctx.goal}`,
      });
      stepIndex += 1;
    }
  }

  return {
    planId,
    goal: ctx.goal,
    steps,
    reflectionRequired: steps.length > 1,
    createdAt: new Date().toISOString(),
  };
}
