import { nowIso } from "@boss/shared";
import type { BusinessGoal, GoalStatus, GoalCategory } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface CreateGoalInput {
  category: GoalCategory;
  title: string;
  description?: string;
  kpiKey?: string | null;
  targetValue?: number | null;
  unit?: string | null;
  dueDate?: string | null;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  targetValue?: number | null;
  currentValue?: number | null;
  dueDate?: string | null;
}

export interface BusinessGoalService {
  create(orgId: string, businessId: string, input: CreateGoalInput): Promise<BusinessGoal>;
  get(orgId: string, id: string): Promise<BusinessGoal | null>;
  update(orgId: string, id: string, input: UpdateGoalInput): Promise<BusinessGoal>;
  updateStatus(orgId: string, id: string, status: GoalStatus): Promise<BusinessGoal>;
  list(orgId: string, businessId: string, status?: GoalStatus): Promise<BusinessGoal[]>;
}

export function createBusinessGoalService(repos: RepositoryContainer): BusinessGoalService {
  return {
    async create(orgId, businessId, input) {
      const goal = await repos.businessGoals.create({
        orgId,
        businessId,
        category: input.category,
        title: input.title,
        description: input.description ?? "",
        kpiKey: input.kpiKey ?? null,
        targetValue: input.targetValue ?? null,
        currentValue: null,
        unit: input.unit ?? null,
        dueDate: input.dueDate ?? null,
        startedAt: nowIso(),
        completedAt: null,
        milestones: [],
        status: "active",
      });

      await repos.eventBus.publish({
        type: "business.goal.created",
        payload: { orgId, businessId, goalId: goal.id, category: goal.category },
        occurredAt: nowIso(),
      });

      return goal;
    },

    async get(orgId, id) {
      return repos.businessGoals.findById(orgId, id);
    },

    async update(orgId, id, input) {
      return repos.businessGoals.update(orgId, id, {
        title: input.title,
        description: input.description,
        targetValue: input.targetValue ?? undefined,
        currentValue: input.currentValue ?? undefined,
        dueDate: input.dueDate ?? undefined,
      });
    },

    async updateStatus(orgId, id, status) {
      const goal = await repos.businessGoals.updateStatus(orgId, id, status);

      await repos.eventBus.publish({
        type: "business.goal.status_updated",
        payload: { orgId, businessId: goal.businessId, goalId: id, status },
        occurredAt: nowIso(),
      });

      return goal;
    },

    async list(orgId, businessId, status) {
      if (status) {
        return repos.businessGoals.listByStatus(orgId, businessId, status);
      }
      return repos.businessGoals.listByBusinessId(orgId, businessId);
    },
  };
}
