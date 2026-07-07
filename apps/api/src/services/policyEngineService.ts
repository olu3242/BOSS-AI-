import type { LifecyclePolicy, WorkflowRun } from "@boss/types";
import type { LifecyclePolicyRepository, WorkflowRepository, WorkflowRunRepository } from "@boss/db";
import { createBossEvent, type EventBus } from "@boss/events";
import { randomUUID } from "node:crypto";

export type PolicyDecision =
  | { mode: "automatic"; policy: LifecyclePolicy; run: WorkflowRun | null }
  | { mode: "approval_required"; policy: LifecyclePolicy }
  | { mode: "manual"; policy: LifecyclePolicy }
  | { mode: "no_policy" };

export interface PolicyEngineService {
  evaluate(orgId: string, businessId: string, event: string, context: Record<string, unknown>): Promise<PolicyDecision[]>;
}

export function createPolicyEngineService(
  policyRepo: LifecyclePolicyRepository,
  workflowRepo: WorkflowRepository,
  workflowRunRepo: WorkflowRunRepository,
  eventBus: EventBus,
): PolicyEngineService {
  const ctx = (orgId: string, businessId: string) => ({
    orgId,
    businessId,
    actorId: "policy-engine",
    requestId: randomUUID(),
    correlationId: randomUUID(),
    traceId: randomUUID(),
  });

  return {
    async evaluate(orgId, businessId, event, context) {
      const policies = await policyRepo.listByEvent(orgId, businessId, event);

      if (policies.length === 0) {
        return [{ mode: "no_policy" }];
      }

      const decisions: PolicyDecision[] = [];

      for (const policy of policies) {
        if (policy.mode === "automatic") {
          const action = policy.action;

          if (action.type === "trigger_workflow" && action.workflowKey) {
            const workflows = await workflowRepo.listByTriggerEvent(orgId, action.workflowKey);
            const wf = workflows[0];

            if (wf) {
              const run = await workflowRunRepo.create({
                orgId,
                businessId,
                workflowId: wf.id,
                status: "running",
                triggeredBy: `policy:${policy.id}`,
                businessObjectType: (context["objectType"] as string) ?? null,
                businessObjectId: (context["objectId"] as string) ?? null,
                runtimeExecutionId: null,
                result: null,
                errorMessage: null,
                durationMs: null,
                startedAt: new Date().toISOString(),
                completedAt: null,
              });

              await eventBus.publish(
                createBossEvent(
                  "loop.step.completed",
                  { policyId: policy.id, workflowId: wf.id, workflowRunId: run.id, fromEvent: event, businessId },
                  ctx(orgId, businessId),
                ),
              );

              decisions.push({ mode: "automatic", policy, run });
            }
          } else if (action.type === "create_entity") {
            await eventBus.publish(
              createBossEvent(
                "loop.step.completed",
                { policyId: policy.id, fromEvent: event, businessId, entityType: action.entity, defaults: action.defaults ?? {}, context },
                ctx(orgId, businessId),
              ),
            );
            decisions.push({ mode: "automatic", policy, run: null });
          }
        } else if (policy.mode === "approval_required") {
          await eventBus.publish(
            createBossEvent(
              "loop.step.pending_approval",
              { policyId: policy.id, fromEvent: event, businessId, approvalRoles: policy.approvalRoles, context },
              ctx(orgId, businessId),
            ),
          );
          decisions.push({ mode: "approval_required", policy });
        } else if (policy.mode === "manual") {
          await eventBus.publish(
            createBossEvent(
              "loop.step.manual_required",
              { policyId: policy.id, fromEvent: event, businessId, context },
              ctx(orgId, businessId),
            ),
          );
          decisions.push({ mode: "manual", policy });
        }
      }

      return decisions;
    },
  };
}
