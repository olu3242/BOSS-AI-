import type { TaskType } from "@boss/types";

export interface TaskHandlerResult {
  output: Record<string, unknown> | null;
  errorMessage: string | null;
}

export type TaskHandler = (input: Record<string, unknown>) => Promise<TaskHandlerResult>;

export interface TaskHandlerRegistry {
  register(taskType: TaskType, handler: TaskHandler): void;
  resolve(taskType: TaskType): TaskHandler;
}

export class TaskHandlerNotFoundError extends Error {
  constructor(taskType: TaskType) {
    super(`No task handler registered for task type "${taskType}"`);
  }
}

export function createTaskHandlerRegistry(): TaskHandlerRegistry {
  const handlers = new Map<TaskType, TaskHandler>();

  return {
    register(taskType, handler) {
      handlers.set(taskType, handler);
    },
    resolve(taskType) {
      const handler = handlers.get(taskType);
      if (!handler) {
        throw new TaskHandlerNotFoundError(taskType);
      }
      return handler;
    },
  };
}
