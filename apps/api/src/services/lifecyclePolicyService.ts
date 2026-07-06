import type { LifecyclePolicy } from "@boss/types";
import type { LifecyclePolicyRepository } from "@boss/db";
import { ApiError } from "../http/apiError.js";

export interface LifecyclePolicyService {
  create(orgId: string, businessId: string, input: {
    name: string;
    fromEvent: string;
    mode: LifecyclePolicy["mode"];
    action: LifecyclePolicy["action"];
    conditions?: Record<string, unknown>;
    approvalRoles?: string[];
    priority?: number;
    isActive?: boolean;
  }): Promise<LifecyclePolicy>;
  getById(orgId: string, id: string): Promise<LifecyclePolicy>;
  list(orgId: string, businessId: string): Promise<LifecyclePolicy[]>;
  listByEvent(orgId: string, businessId: string, fromEvent: string): Promise<LifecyclePolicy[]>;
  update(orgId: string, id: string, patch: Partial<Pick<LifecyclePolicy, "name" | "fromEvent" | "mode" | "action" | "conditions" | "approvalRoles" | "priority" | "isActive">>): Promise<LifecyclePolicy>;
  delete(orgId: string, id: string): Promise<void>;
}

export function createLifecyclePolicyService(repo: LifecyclePolicyRepository): LifecyclePolicyService {
  return {
    async create(orgId, businessId, input) {
      return repo.create({
        orgId,
        businessId,
        name: input.name,
        fromEvent: input.fromEvent,
        mode: input.mode,
        action: input.action,
        conditions: input.conditions ?? {},
        approvalRoles: input.approvalRoles ?? [],
        priority: input.priority ?? 0,
        isActive: input.isActive ?? true,
      });
    },

    async getById(orgId, id) {
      const policy = await repo.findById(orgId, id);
      if (!policy) throw new ApiError(404, "LIFECYCLE_POLICY_NOT_FOUND", `LifecyclePolicy ${id} not found`);
      return policy;
    },

    async list(orgId, businessId) {
      return repo.listByBusinessId(orgId, businessId);
    },

    async listByEvent(orgId, businessId, fromEvent) {
      return repo.listByEvent(orgId, businessId, fromEvent);
    },

    async update(orgId, id, patch) {
      const policy = await repo.findById(orgId, id);
      if (!policy) throw new ApiError(404, "LIFECYCLE_POLICY_NOT_FOUND", `LifecyclePolicy ${id} not found`);
      return repo.update(orgId, id, patch);
    },

    async delete(orgId, id) {
      const policy = await repo.findById(orgId, id);
      if (!policy) throw new ApiError(404, "LIFECYCLE_POLICY_NOT_FOUND", `LifecyclePolicy ${id} not found`);
      await repo.delete(orgId, id);
    },
  };
}
