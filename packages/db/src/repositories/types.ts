import type {
  Business,
  BusinessProfile,
  BusinessMRI,
  BusinessMriSection,
  BusinessMriResponse,
  BusinessDNA,
  BusinessHealth,
  BusinessHealthDimension,
  BusinessCapabilityAssessment,
  BusinessTimelineEntry,
  BusinessConstraint,
  ConstraintEvidenceItem,
  ConstraintScore,
  ConstraintPriority,
  BusinessRecommendation,
  RecommendationEvidenceItem,
  RecommendationScore,
  RecommendationPriority,
  TransformationRoadmap,
  TransformationRoadmapStageEntry,
  IntegrationAccount,
  CredentialReference,
  PermissionPolicy,
  ToolExecution,
  ProviderHealth,
  ToolAuditRecord,
  WorkflowExecution,
  TaskExecution,
  ExecutionEventRecord,
  DeadLetterEntry,
  ExecutionState,
  MemoryRecord,
  ProviderEvidence,
  SchedulerJob,
  SchedulerJobState,
  BusinessDecision,
  DecisionStatus,
  BusinessScenario,
  ScenarioComparison,
} from "@boss/types";

export interface BusinessRepository {
  create(input: Omit<Business, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<Business>;
  findById(orgId: string, id: string): Promise<Business | null>;
  list(orgId: string): Promise<Business[]>;
}

export interface BusinessProfileRepository {
  upsert(
    input: Omit<BusinessProfile, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<BusinessProfile>;
  findByBusinessId(orgId: string, businessId: string): Promise<BusinessProfile | null>;
}

export interface BusinessMriRepository {
  create(
    input: Omit<BusinessMRI, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<BusinessMRI>;
  update(orgId: string, id: string, patch: Partial<Pick<BusinessMRI, "status" | "startedAt" | "completedAt">>): Promise<BusinessMRI>;
  findByBusinessId(orgId: string, businessId: string): Promise<BusinessMRI | null>;
  upsertSection(
    input: Omit<BusinessMriSection, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<BusinessMriSection>;
  listSections(orgId: string, businessMriId: string): Promise<BusinessMriSection[]>;
  upsertResponse(
    input: Omit<BusinessMriResponse, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<BusinessMriResponse>;
  listResponses(orgId: string, businessMriId: string): Promise<BusinessMriResponse[]>;
}

export interface BusinessDnaRepository {
  upsert(input: Omit<BusinessDNA, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<BusinessDNA>;
  findByBusinessId(orgId: string, businessId: string): Promise<BusinessDNA | null>;
}

export interface BusinessHealthRepository {
  upsert(
    input: Omit<BusinessHealth, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<BusinessHealth>;
  findByBusinessId(orgId: string, businessId: string): Promise<BusinessHealth | null>;
  upsertDimension(
    input: Omit<BusinessHealthDimension, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<BusinessHealthDimension>;
  listDimensions(orgId: string, businessHealthId: string): Promise<BusinessHealthDimension[]>;
}

export interface BusinessCapabilityRepository {
  upsert(
    input: Omit<BusinessCapabilityAssessment, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<BusinessCapabilityAssessment>;
  listByBusinessId(orgId: string, businessId: string): Promise<BusinessCapabilityAssessment[]>;
}

export interface BusinessTimelineRepository {
  append(
    input: Omit<BusinessTimelineEntry, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<BusinessTimelineEntry>;
  listByBusinessId(orgId: string, businessId: string): Promise<BusinessTimelineEntry[]>;
}

export interface StoredConstraintEvidence extends ConstraintEvidenceItem {
  id: string;
  constraintId: string;
  createdAt: string;
}

export interface BusinessConstraintRepository {
  create(
    input: Omit<BusinessConstraint, "id" | "createdAt" | "updatedAt" | "deletedAt" | "evidence">
  ): Promise<BusinessConstraint>;
  listByBusinessId(orgId: string, businessId: string): Promise<BusinessConstraint[]>;
  findById(orgId: string, id: string): Promise<BusinessConstraint | null>;
  updateStatus(orgId: string, id: string, status: BusinessConstraint["status"]): Promise<BusinessConstraint>;
  addEvidence(constraintId: string, evidence: ConstraintEvidenceItem): Promise<StoredConstraintEvidence>;
  listEvidence(constraintId: string): Promise<StoredConstraintEvidence[]>;
  recordHistory(constraintId: string, previousStatus: string | null, newStatus: string, note: string): Promise<void>;
}

export interface ConstraintScoreRepository {
  upsert(input: Omit<ConstraintScore, "id" | "createdAt" | "updatedAt">): Promise<ConstraintScore>;
  findByConstraintId(orgId: string, constraintId: string): Promise<ConstraintScore | null>;
}

export interface ConstraintPriorityRepository {
  upsert(input: Omit<ConstraintPriority, "id" | "createdAt" | "updatedAt">): Promise<ConstraintPriority>;
  listByBusinessId(orgId: string, businessId: string): Promise<ConstraintPriority[]>;
}

export interface StoredRecommendationEvidence extends RecommendationEvidenceItem {
  id: string;
  recommendationId: string;
  createdAt: string;
}

export interface BusinessRecommendationRepository {
  create(
    input: Omit<BusinessRecommendation, "id" | "createdAt" | "updatedAt" | "deletedAt" | "evidence">
  ): Promise<BusinessRecommendation>;
  listByBusinessId(orgId: string, businessId: string): Promise<BusinessRecommendation[]>;
  findById(orgId: string, id: string): Promise<BusinessRecommendation | null>;
  updateStatus(orgId: string, id: string, status: BusinessRecommendation["status"]): Promise<BusinessRecommendation>;
  addEvidence(recommendationId: string, evidence: RecommendationEvidenceItem): Promise<StoredRecommendationEvidence>;
  listEvidence(recommendationId: string): Promise<StoredRecommendationEvidence[]>;
  recordHistory(recommendationId: string, previousStatus: string | null, newStatus: string, note: string): Promise<void>;
}

export interface RecommendationScoreRepository {
  upsert(input: Omit<RecommendationScore, "id" | "createdAt" | "updatedAt">): Promise<RecommendationScore>;
  findByRecommendationId(orgId: string, recommendationId: string): Promise<RecommendationScore | null>;
}

export interface RecommendationPriorityRepository {
  upsert(input: Omit<RecommendationPriority, "id" | "createdAt" | "updatedAt">): Promise<RecommendationPriority>;
  listByBusinessId(orgId: string, businessId: string): Promise<RecommendationPriority[]>;
}

export interface TransformationRoadmapRepository {
  upsert(
    input: Omit<TransformationRoadmap, "id" | "createdAt" | "updatedAt">
  ): Promise<TransformationRoadmap>;
  findByBusinessId(orgId: string, businessId: string): Promise<TransformationRoadmap | null>;
}

export type { TransformationRoadmapStageEntry };

export interface IntegrationAccountRepository {
  upsert(input: Omit<IntegrationAccount, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<IntegrationAccount>;
  listByBusinessId(orgId: string, businessId: string): Promise<IntegrationAccount[]>;
  findByProvider(orgId: string, businessId: string, providerKey: string): Promise<IntegrationAccount | null>;
  addCredentialReference(
    integrationAccountId: string,
    input: Omit<CredentialReference, "id" | "createdAt" | "updatedAt" | "deletedAt" | "integrationAccountId" | "orgId">
  ): Promise<CredentialReference>;
  findCredentialByAccount(integrationAccountId: string): Promise<CredentialReference | null>;
}

export interface PermissionPolicyRepository {
  upsert(input: Omit<PermissionPolicy, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<PermissionPolicy>;
  listByBusinessId(orgId: string, businessId: string): Promise<PermissionPolicy[]>;
}

export interface ToolExecutionRepository {
  create(
    input: Omit<ToolExecution, "id" | "createdAt" | "updatedAt" | "deletedAt" | "attemptCount" | "latencyMs">
  ): Promise<ToolExecution>;
  updateStatus(
    orgId: string,
    id: string,
    status: ToolExecution["status"],
    output: Record<string, unknown> | null,
    errorMessage: string | null,
    meta?: { attemptCount?: number; latencyMs?: number | null }
  ): Promise<ToolExecution>;
  listByBusinessId(orgId: string, businessId: string): Promise<ToolExecution[]>;
  addAuditRecord(input: Omit<ToolAuditRecord, "id" | "createdAt">): Promise<ToolAuditRecord>;
  listAuditRecords(orgId: string, businessId: string): Promise<ToolAuditRecord[]>;
}

export interface ProviderHealthRepository {
  upsert(input: Omit<ProviderHealth, "id" | "createdAt" | "updatedAt">): Promise<ProviderHealth>;
  listByBusinessId(orgId: string, businessId: string): Promise<ProviderHealth[]>;
}

export interface WorkflowExecutionRepository {
  create(input: Omit<WorkflowExecution, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<WorkflowExecution>;
  updateState(
    orgId: string,
    id: string,
    state: ExecutionState,
    currentStepIndex: number,
    output: Record<string, unknown> | null,
    errorMessage: string | null,
    completedAt: string | null
  ): Promise<WorkflowExecution>;
  listByBusinessId(orgId: string, businessId: string): Promise<WorkflowExecution[]>;
}

export interface TaskExecutionRepository {
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
  listByWorkflowExecutionId(orgId: string, workflowExecutionId: string): Promise<TaskExecution[]>;
}

export interface ExecutionEventRepository {
  append(input: Omit<ExecutionEventRecord, "id" | "createdAt">): Promise<ExecutionEventRecord>;
  listByWorkflowExecutionId(orgId: string, workflowExecutionId: string): Promise<ExecutionEventRecord[]>;
}

export interface DeadLetterRepository {
  add(input: Omit<DeadLetterEntry, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<DeadLetterEntry>;
  listByBusinessId(orgId: string, businessId: string): Promise<DeadLetterEntry[]>;
}

export interface MemoryRecordRepository {
  upsert(input: Omit<MemoryRecord, "id" | "createdAt" | "updatedAt">): Promise<MemoryRecord>;
  get(
    orgId: string,
    businessId: string,
    ownerType: MemoryRecord["ownerType"],
    ownerId: string,
    key: string
  ): Promise<MemoryRecord | null>;
  listByOwner(
    orgId: string,
    businessId: string,
    ownerType: MemoryRecord["ownerType"],
    ownerId: string
  ): Promise<MemoryRecord[]>;
}

export interface ProviderEvidenceRepository {
  create(
    input: Omit<ProviderEvidence, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<ProviderEvidence>;
  listByToolExecutionId(orgId: string, toolExecutionId: string): Promise<ProviderEvidence[]>;
  listByBusinessId(orgId: string, businessId: string): Promise<ProviderEvidence[]>;
}

export interface SchedulerJobRepository {
  create(input: Omit<SchedulerJob, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<SchedulerJob>;
  findById(orgId: string, id: string): Promise<SchedulerJob | null>;
  updateState(orgId: string, id: string, state: SchedulerJobState, fields?: Partial<Pick<SchedulerJob, "lastRunAt" | "nextRunAt" | "runCount" | "errorMessage">>): Promise<SchedulerJob>;
  listDuePending(now: string): Promise<SchedulerJob[]>;
  listByBusiness(orgId: string, businessId: string): Promise<SchedulerJob[]>;
  cancel(orgId: string, id: string): Promise<void>;
}

export interface BusinessDecisionRepository {
  create(input: Omit<BusinessDecision, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<BusinessDecision>;
  findById(orgId: string, id: string): Promise<BusinessDecision | null>;
  update(orgId: string, id: string, patch: Partial<Omit<BusinessDecision, "id" | "orgId" | "businessId" | "createdAt" | "updatedAt" | "deletedAt">>): Promise<BusinessDecision>;
  listByBusinessId(orgId: string, businessId: string): Promise<BusinessDecision[]>;
  listByStatus(orgId: string, businessId: string, status: DecisionStatus): Promise<BusinessDecision[]>;
}

export interface BusinessScenarioRepository {
  create(input: Omit<BusinessScenario, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<BusinessScenario>;
  findById(orgId: string, id: string): Promise<BusinessScenario | null>;
  update(orgId: string, id: string, patch: Partial<Omit<BusinessScenario, "id" | "orgId" | "businessId" | "createdAt" | "updatedAt" | "deletedAt">>): Promise<BusinessScenario>;
  listByBusinessId(orgId: string, businessId: string): Promise<BusinessScenario[]>;
  createComparison(input: Omit<ScenarioComparison, "id" | "createdAt">): Promise<ScenarioComparison>;
  listComparisons(orgId: string, businessId: string): Promise<ScenarioComparison[]>;
}
