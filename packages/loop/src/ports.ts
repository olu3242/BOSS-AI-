import type { DeadLetterEntry, ExecutionEventRecord, ExecutionState, TaskExecution, TaskType, WorkflowExecution } from "@boss/types";

export interface WorkflowExecutionPort {
  create(input: Omit<WorkflowExecution, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<WorkflowExecution>;
  findById(orgId: string, id: string): Promise<WorkflowExecution | null>;
  updateState(
    orgId: string,
    id: string,
    state: ExecutionState,
    currentStepIndex: number,
    output: Record<string, unknown> | null,
    errorMessage: string | null,
    completedAt: string | null
  ): Promise<WorkflowExecution>;
}

export interface TaskExecutionPort {
  create(input: Omit<TaskExecution, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<TaskExecution>;
  updateState(
    orgId: string,
    id: string,
    state: ExecutionState,
    attempt: number,
    output: Record<string, unknown> | null,
    errorMessage: string | null,
    completedAt: string | null
  ): Promise<TaskExecution>;
}

export interface ExecutionEventPort {
  append(input: Omit<ExecutionEventRecord, "id" | "createdAt">): Promise<ExecutionEventRecord>;
}

export interface DeadLetterPort {
  add(input: Omit<DeadLetterEntry, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<DeadLetterEntry>;
}

export interface LoopRuntimePorts {
  workflowExecutions: WorkflowExecutionPort;
  taskExecutions: TaskExecutionPort;
  executionEvents: ExecutionEventPort;
  deadLetters: DeadLetterPort;
}

export interface StepSpec {
  stepKey: string;
  taskType: TaskType;
  input: Record<string, unknown>;
  maxRetries?: number;
  timeoutMs?: number;
  compensationTaskType?: TaskType;
}

export interface ParallelStepGroup {
  groupKey: string;
  parallel: true;
  steps: StepSpec[];
}

export type StepEntry = StepSpec | ParallelStepGroup;

export function isParallelGroup(entry: StepEntry): entry is ParallelStepGroup {
  return (entry as ParallelStepGroup).parallel === true;
}
