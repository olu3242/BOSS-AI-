import type { ExecutionContext } from "./runtimeTypes.js";

export type WorkflowExecutionState =
  | "pending"
  | "running"
  | "awaiting_approval"
  | "compensating"
  | "completed"
  | "compensated"
  | "failed";

export interface WorkflowExecutionRecord {
  readonly id: string;
  readonly definitionId: string;
  readonly businessId: string;
  readonly context: ExecutionContext;
  readonly state: WorkflowExecutionState;
  readonly currentStepId: string | null;
  readonly completedStepIds: readonly string[];
  readonly outputs: Readonly<Record<string, unknown>>;
  readonly error: string | null;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
}

export interface WorkflowExecutionStore {
  save(record: WorkflowExecutionRecord): Promise<void>;
  get(id: string, orgId: string): Promise<WorkflowExecutionRecord | undefined>;
  list(orgId: string): Promise<readonly WorkflowExecutionRecord[]>;
}

export class InMemoryWorkflowExecutionStore implements WorkflowExecutionStore {
  private readonly records = new Map<string, WorkflowExecutionRecord>();

  async save(record: WorkflowExecutionRecord): Promise<void> {
    this.records.set(record.id, Object.freeze(record));
  }

  async get(
    id: string,
    orgId: string,
  ): Promise<WorkflowExecutionRecord | undefined> {
    const record = this.records.get(id);
    return record?.context.orgId === orgId ? record : undefined;
  }

  async list(orgId: string): Promise<readonly WorkflowExecutionRecord[]> {
    return Object.freeze(
      Array.from(this.records.values()).filter(
        (record) => record.context.orgId === orgId,
      ),
    );
  }
}
