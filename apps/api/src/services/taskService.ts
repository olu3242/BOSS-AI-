import type { StandaloneTask, StandaloneTaskStatus, StandaloneTaskPriority } from "@boss/types";
import { createBossEvent } from "@boss/events";
import type { RepositoryContainer } from "../container.js";

export interface TaskService {
  create(
    orgId: string,
    businessId: string,
    input: {
      title: string;
      description?: string | null;
      status?: StandaloneTaskStatus;
      priority?: StandaloneTaskPriority;
      assignedTo?: string | null;
      dueAt?: string | null;
      parentTaskId?: string | null;
      tags?: string[];
    },
    actorId: string,
  ): Promise<StandaloneTask>;

  get(orgId: string, id: string): Promise<StandaloneTask>;
  list(orgId: string, businessId: string): Promise<StandaloneTask[]>;
  listChildren(orgId: string, parentTaskId: string): Promise<StandaloneTask[]>;

  update(
    orgId: string,
    id: string,
    patch: Partial<{
      title: string;
      description: string | null;
      status: StandaloneTaskStatus;
      priority: StandaloneTaskPriority;
      assignedTo: string | null;
      dueAt: string | null;
      tags: string[];
    }>,
    actorId: string,
  ): Promise<StandaloneTask>;

  delete(orgId: string, id: string, actorId: string): Promise<void>;
}

export function createTaskService(repos: RepositoryContainer): TaskService {
  return {
    async create(orgId, businessId, input, actorId) {
      const task = await repos.tasks.create({
        orgId,
        businessId,
        title: input.title,
        description: input.description ?? null,
        status: input.status ?? "todo",
        priority: input.priority ?? "normal",
        assignedTo: input.assignedTo ?? null,
        dueAt: input.dueAt ?? null,
        completedAt: null,
        parentTaskId: input.parentTaskId ?? null,
        tags: input.tags ?? [],
      });

      await repos.eventBus.publish(
        createBossEvent(
          "task.created",
          { taskId: task.id, businessId, priority: task.priority },
          { orgId, businessId, actorId, requestId: task.id, correlationId: task.id, traceId: task.id },
        ),
      );

      return task;
    },

    async get(orgId, id) {
      const task = await repos.tasks.findById(orgId, id);
      if (!task) throw Object.assign(new Error(`Task ${id} not found`), { statusCode: 404 });
      return task;
    },

    async list(orgId, businessId) {
      return repos.tasks.listByBusinessId(orgId, businessId);
    },

    async listChildren(orgId, parentTaskId) {
      return repos.tasks.listChildren(orgId, parentTaskId);
    },

    async update(orgId, id, patch, actorId) {
      const existing = await repos.tasks.findById(orgId, id);
      if (!existing) throw Object.assign(new Error(`Task ${id} not found`), { statusCode: 404 });

      const updated = await repos.tasks.update(orgId, id, patch);

      if (patch.status && patch.status !== existing.status) {
        const eventType = patch.status === "done" ? "task.completed" : patch.status === "cancelled" ? "task.cancelled" : "task.updated";
        await repos.eventBus.publish(
          createBossEvent(
            eventType,
            { taskId: id, status: patch.status },
            { orgId, businessId: existing.businessId, actorId, requestId: id, correlationId: id, traceId: id },
          ),
        );
      }

      return updated;
    },

    async delete(orgId, id, actorId) {
      const task = await repos.tasks.findById(orgId, id);
      if (!task) throw Object.assign(new Error(`Task ${id} not found`), { statusCode: 404 });

      await repos.tasks.delete(orgId, id);

      await repos.eventBus.publish(
        createBossEvent(
          "task.deleted",
          { taskId: id },
          { orgId, businessId: task.businessId, actorId, requestId: id, correlationId: id, traceId: id },
        ),
      );
    },
  };
}
