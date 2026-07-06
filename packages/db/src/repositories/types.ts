import type {
  Business,
  BusinessProfile,
  BusinessMRI,
  BusinessMriSection,
  KpiReadingRecord,
  Customer,
  CustomerInteraction,
  CustomerStatus,
  CustomerInteractionType,
  BusinessGoal,
  GoalStatus,
  ExecutiveBriefingRecord,
  BriefingPeriod,
  Job,
  JobStatus,
  Appointment,
  AppointmentStatus,
  Invoice,
  InvoiceStatus,
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
  BusinessDiagnosticReport,
  Organization,
  OrganizationMembershipRecord,
  OrganizationWithMembership,
  BusinessContextSnapshot,
  BusinessDiscoveryHistoryEntry,
  BusinessDiscoveryStatus,
  CanonicalBusinessContextData,
  BusinessEdge,
  BusinessGraphHistoryEntry,
  BusinessGraphStatus,
  BusinessNode,
  GraphMetadata,
  GraphSnapshot,
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

export interface BusinessDiagnosticRepository {
  save(report: BusinessDiagnosticReport): Promise<void>;
  findLatest(
    orgId: string,
    businessId: string,
  ): Promise<BusinessDiagnosticReport | null>;
  listVersions(
    orgId: string,
    businessId: string,
  ): Promise<readonly BusinessDiagnosticReport[]>;
}

export interface OrganizationRepository {
  create(
    userId: string,
    input: { readonly name: string; readonly slug: string },
  ): Promise<OrganizationWithMembership>;
  getMembership(
    userId: string,
    orgId: string,
  ): Promise<OrganizationMembershipRecord | undefined>;
  listForUser(userId: string): Promise<readonly OrganizationWithMembership[]>;
  getActive(userId: string): Promise<Organization | null>;
  setActive(userId: string, orgId: string): Promise<Organization>;
}

export interface BusinessDiscoveryMutationContext {
  readonly actorId: string;
  readonly correlationId: string;
  readonly traceId: string;
  readonly reason: string;
}

export class BusinessDiscoveryConcurrencyError extends Error {
  constructor() {
    super("Business Discovery was modified by another request.");
    this.name = "BusinessDiscoveryConcurrencyError";
  }
}

export interface BusinessDiscoveryRepository {
  create(input: {
    readonly orgId: string;
    readonly businessId: string;
    readonly context: CanonicalBusinessContextData;
    readonly schemaVersion: string;
    readonly mutation: BusinessDiscoveryMutationContext;
  }): Promise<BusinessContextSnapshot>;
  getCurrent(
    orgId: string,
    businessId: string,
  ): Promise<BusinessContextSnapshot | null>;
  saveContext(input: {
    readonly orgId: string;
    readonly businessId: string;
    readonly expectedLockVersion: number;
    readonly context: CanonicalBusinessContextData;
    readonly mutation: BusinessDiscoveryMutationContext;
  }): Promise<BusinessContextSnapshot>;
  transition(input: {
    readonly orgId: string;
    readonly businessId: string;
    readonly expectedLockVersion: number;
    readonly status: BusinessDiscoveryStatus;
    readonly mutation: BusinessDiscoveryMutationContext;
  }): Promise<BusinessContextSnapshot>;
  listVersions(
    orgId: string,
    businessId: string,
  ): Promise<readonly BusinessContextSnapshot[]>;
  listHistory(
    orgId: string,
    businessId: string,
  ): Promise<readonly BusinessDiscoveryHistoryEntry[]>;
}

export class BusinessGraphConcurrencyError extends Error {
  constructor() {
    super("Business Knowledge Graph was modified by another request.");
    this.name = "BusinessGraphConcurrencyError";
  }
}

export interface BusinessGraphMutationContext {
  readonly actorId: string;
  readonly correlationId: string;
  readonly traceId: string;
  readonly reason: string;
}

export interface BusinessGraphRepository {
  create(input: {
    readonly orgId: string;
    readonly businessId: string;
    readonly discoveryId: string;
    readonly sourceDiscoveryVersion: number;
    readonly nodes: readonly Omit<BusinessNode, "graphId">[];
    readonly edges: readonly Omit<BusinessEdge, "graphId">[];
    readonly metadata: GraphMetadata;
    readonly mutation: BusinessGraphMutationContext;
  }): Promise<GraphSnapshot>;
  getCurrent(orgId: string, businessId: string): Promise<GraphSnapshot | null>;
  saveSnapshot(input: {
    readonly orgId: string;
    readonly businessId: string;
    readonly expectedLockVersion: number;
    readonly sourceDiscoveryVersion: number;
    readonly nodes: readonly Omit<BusinessNode, "graphId">[];
    readonly edges: readonly Omit<BusinessEdge, "graphId">[];
    readonly metadata: GraphMetadata;
    readonly action: BusinessGraphHistoryEntry["action"];
    readonly mutation: BusinessGraphMutationContext;
  }): Promise<GraphSnapshot>;
  transition(input: {
    readonly orgId: string;
    readonly businessId: string;
    readonly expectedLockVersion: number;
    readonly status: BusinessGraphStatus;
    readonly mutation: BusinessGraphMutationContext;
  }): Promise<GraphSnapshot>;
  getVersion(
    orgId: string,
    businessId: string,
    version: number,
  ): Promise<GraphSnapshot | null>;
  listVersions(
    orgId: string,
    businessId: string,
  ): Promise<readonly GraphSnapshot[]>;
  listHistory(
    orgId: string,
    businessId: string,
  ): Promise<readonly BusinessGraphHistoryEntry[]>;
}

export type { TransformationRoadmapStageEntry };

export interface KpiReadingRepository {
  append(input: Omit<KpiReadingRecord, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<KpiReadingRecord>;
  listByBusinessId(orgId: string, businessId: string, limit?: number): Promise<KpiReadingRecord[]>;
  listByKpiKey(orgId: string, businessId: string, kpiKey: string, limit?: number): Promise<KpiReadingRecord[]>;
  latestByKpiKey(orgId: string, businessId: string, kpiKey: string): Promise<KpiReadingRecord | null>;
}

export interface BusinessGoalRepository {
  create(input: Omit<BusinessGoal, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<BusinessGoal>;
  findById(orgId: string, id: string): Promise<BusinessGoal | null>;
  update(orgId: string, id: string, patch: Partial<Omit<BusinessGoal, "id" | "orgId" | "businessId" | "createdAt" | "updatedAt" | "deletedAt">>): Promise<BusinessGoal>;
  updateStatus(orgId: string, id: string, status: GoalStatus): Promise<BusinessGoal>;
  listByBusinessId(orgId: string, businessId: string): Promise<BusinessGoal[]>;
  listByStatus(orgId: string, businessId: string, status: GoalStatus): Promise<BusinessGoal[]>;
}

export interface ExecutiveBriefingRepository {
  create(input: Omit<ExecutiveBriefingRecord, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<ExecutiveBriefingRecord>;
  findById(orgId: string, id: string): Promise<ExecutiveBriefingRecord | null>;
  findLatest(orgId: string, businessId: string, period?: BriefingPeriod): Promise<ExecutiveBriefingRecord | null>;
  listByBusinessId(orgId: string, businessId: string, limit?: number): Promise<ExecutiveBriefingRecord[]>;
}

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

export interface CustomerRepository {
  create(input: Omit<Customer, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<Customer>;
  findById(orgId: string, id: string): Promise<Customer | null>;
  update(orgId: string, id: string, patch: Partial<Omit<Customer, "id" | "orgId" | "businessId" | "createdAt" | "updatedAt" | "deletedAt">>): Promise<Customer>;
  updateStatus(orgId: string, id: string, status: CustomerStatus): Promise<Customer>;
  updateRevenue(orgId: string, id: string, totalRevenue: number): Promise<Customer>;
  delete(orgId: string, id: string): Promise<void>;
  listByBusinessId(orgId: string, businessId: string): Promise<Customer[]>;
  search(orgId: string, businessId: string, query: string): Promise<Customer[]>;
}

export interface CustomerInteractionRepository {
  create(input: Omit<CustomerInteraction, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<CustomerInteraction>;
  listByCustomerId(orgId: string, customerId: string): Promise<CustomerInteraction[]>;
  listByBusinessId(orgId: string, businessId: string, limit?: number): Promise<CustomerInteraction[]>;
  countByType(orgId: string, customerId: string, type: CustomerInteractionType): Promise<number>;
}

export type { CustomerStatus, CustomerInteractionType };

export interface JobRepository {
  create(input: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Job>;
  findById(orgId: string, id: string): Promise<Job | null>;
  update(orgId: string, id: string, patch: Partial<Omit<Job, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>>): Promise<Job>;
  listByBusiness(orgId: string, businessId: string): Promise<Job[]>;
  listByCustomer(orgId: string, customerId: string): Promise<Job[]>;
  softDelete(orgId: string, id: string): Promise<void>;
}

export type AppointmentPatch = {
  title?: string;
  customerId?: string | null;
  jobId?: string | null;
  notes?: string | null;
  status?: AppointmentStatus;
  startAt?: string;
  endAt?: string;
  location?: string | null;
  assignedTo?: string | null;
  reminderSent?: boolean;
  metadata?: Record<string, unknown>;
  deletedAt?: string | null;
};

export interface AppointmentRepository {
  create(input: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Appointment>;
  findById(orgId: string, id: string): Promise<Appointment | null>;
  update(orgId: string, id: string, patch: AppointmentPatch): Promise<Appointment>;
  listByBusiness(orgId: string, businessId: string): Promise<Appointment[]>;
  listByCustomer(orgId: string, customerId: string): Promise<Appointment[]>;
  softDelete(orgId: string, id: string): Promise<void>;
}

export type InvoicePatch = {
  status?: InvoiceStatus;
  lineItems?: import('@boss/types').InvoiceLineItem[];
  subtotalCents?: number;
  taxCents?: number;
  discountCents?: number;
  totalCents?: number;
  dueAt?: string | null;
  sentAt?: string | null;
  paidAt?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  terms?: string | null;
  metadata?: Record<string, unknown>;
  deletedAt?: string | null;
};

export interface InvoiceRepository {
  create(input: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Invoice>;
  findById(orgId: string, id: string): Promise<Invoice | null>;
  update(orgId: string, id: string, patch: InvoicePatch): Promise<Invoice>;
  listByBusiness(orgId: string, businessId: string): Promise<Invoice[]>;
  listByCustomer(orgId: string, customerId: string): Promise<Invoice[]>;
  softDelete(orgId: string, id: string): Promise<void>;
}

export type { JobStatus, AppointmentStatus, InvoiceStatus };

export type { PaymentMethod, PaymentStatus, ReviewStatus, ReviewSource };
import type { Payment, PaymentMethod, PaymentStatus, CustomerReview, ReviewStatus, ReviewSource } from '@boss/types';

export interface PaymentRepository {
  create(input: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Payment>;
  findById(orgId: string, id: string): Promise<Payment | null>;
  update(orgId: string, id: string, patch: Partial<Omit<Payment, 'id' | 'orgId' | 'businessId' | 'createdAt' | 'updatedAt'>>): Promise<Payment>;
  listByBusiness(orgId: string, businessId: string): Promise<Payment[]>;
  listByInvoice(orgId: string, invoiceId: string): Promise<Payment[]>;
  softDelete(orgId: string, id: string): Promise<void>;
}

export interface ReviewRepository {
  create(input: Omit<CustomerReview, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<CustomerReview>;
  findById(orgId: string, id: string): Promise<CustomerReview | null>;
  update(orgId: string, id: string, patch: Partial<Omit<CustomerReview, 'id' | 'orgId' | 'businessId' | 'createdAt' | 'updatedAt'>>): Promise<CustomerReview>;
  listByBusiness(orgId: string, businessId: string): Promise<CustomerReview[]>;
  softDelete(orgId: string, id: string): Promise<void>;
}

export interface EventLogEntry {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  orgId: string | null;
  correlationId: string | null;
  causationId: string | null;
  createdAt: string;
}

export interface EventLogRepository {
  append(entry: Omit<EventLogEntry, "id" | "createdAt">): Promise<EventLogEntry>;
  listByType(type: string, limit?: number): Promise<EventLogEntry[]>;
  listByOrgId(orgId: string, limit?: number): Promise<EventLogEntry[]>;
  listByCorrelationId(correlationId: string): Promise<EventLogEntry[]>;
  listSince(since: string, limit?: number): Promise<EventLogEntry[]>;
  /** Delete events older than retentionDays (default 90). Scoped to orgId if provided. Returns deleted row count. */
  compact(retentionDays?: number, orgId?: string): Promise<number>;
}

export interface ExecutionMetricsEntry {
  id: string;
  orgId: string;
  workflowId: string;
  windowStart: string;
  windowEnd: string;
  runCount: number;
  successCount: number;
  failureCount: number;
  p50Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  minMs: number | null;
  maxMs: number | null;
  computedAt: string;
}

export interface ExecutionMetricsRepository {
  /** Return the latest metrics snapshot for a workflow within the given org. */
  latestForWorkflow(orgId: string, workflowId: string): Promise<ExecutionMetricsEntry | null>;
  /** Return all metrics entries for an org ordered by window_start desc. */
  listByOrg(orgId: string, limit?: number): Promise<ExecutionMetricsEntry[]>;
  /** Upsert a metrics entry (used by in-memory and test helpers). */
  upsert(entry: Omit<ExecutionMetricsEntry, "id" | "computedAt">): Promise<ExecutionMetricsEntry>;
  /** Call the DB refresh function; returns number of rows upserted. */
  refresh(windowHours?: number): Promise<number>;
}

export interface LeadRepository {
  create(input: Omit<import('@boss/types').Lead, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<import('@boss/types').Lead>;
  findById(orgId: string, id: string): Promise<import('@boss/types').Lead | null>;
  update(orgId: string, id: string, patch: Partial<Omit<import('@boss/types').Lead, 'id' | 'orgId' | 'businessId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): Promise<import('@boss/types').Lead>;
  updateStatus(orgId: string, id: string, status: import('@boss/types').LeadStatus): Promise<import('@boss/types').Lead>;
  delete(orgId: string, id: string): Promise<void>;
  listByBusinessId(orgId: string, businessId: string): Promise<import('@boss/types').Lead[]>;
  listByStatus(orgId: string, businessId: string, status: import('@boss/types').LeadStatus): Promise<import('@boss/types').Lead[]>;
  search(orgId: string, businessId: string, query: string): Promise<import('@boss/types').Lead[]>;
}

// ─── RC3 Batch 1 Repository Interfaces ───────────────────────────────────────

import type {
  StaffMember,
  Opportunity,
  OpportunityStage,
  Conversation,
  StandaloneTask,
  Document,
  Estimate,
} from "@boss/types";

export interface StaffRepository {
  create(input: Omit<StaffMember, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<StaffMember>;
  findById(orgId: string, id: string): Promise<StaffMember | null>;
  update(orgId: string, id: string, patch: Partial<Omit<StaffMember, "id" | "orgId" | "businessId" | "createdAt" | "updatedAt" | "deletedAt">>): Promise<StaffMember>;
  delete(orgId: string, id: string): Promise<void>;
  listByBusinessId(orgId: string, businessId: string): Promise<StaffMember[]>;
  findByUserId(orgId: string, userId: string): Promise<StaffMember | null>;
}

export interface OpportunityRepository {
  create(input: Omit<Opportunity, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<Opportunity>;
  findById(orgId: string, id: string): Promise<Opportunity | null>;
  update(orgId: string, id: string, patch: Partial<Omit<Opportunity, "id" | "orgId" | "businessId" | "createdAt" | "updatedAt" | "deletedAt">>): Promise<Opportunity>;
  delete(orgId: string, id: string): Promise<void>;
  listByBusinessId(orgId: string, businessId: string): Promise<Opportunity[]>;
  listByStage(orgId: string, businessId: string, stage: OpportunityStage): Promise<Opportunity[]>;
  listByCustomer(orgId: string, customerId: string): Promise<Opportunity[]>;
}

export interface ConversationRepository {
  create(input: Omit<Conversation, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<Conversation>;
  findById(orgId: string, id: string): Promise<Conversation | null>;
  update(orgId: string, id: string, patch: Partial<Omit<Conversation, "id" | "orgId" | "businessId" | "createdAt" | "updatedAt" | "deletedAt">>): Promise<Conversation>;
  delete(orgId: string, id: string): Promise<void>;
  listByBusinessId(orgId: string, businessId: string, limit?: number): Promise<Conversation[]>;
  listByCustomer(orgId: string, customerId: string): Promise<Conversation[]>;
}

export interface TaskRepository {
  create(input: Omit<StandaloneTask, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<StandaloneTask>;
  findById(orgId: string, id: string): Promise<StandaloneTask | null>;
  update(orgId: string, id: string, patch: Partial<Omit<StandaloneTask, "id" | "orgId" | "businessId" | "createdAt" | "updatedAt" | "deletedAt">>): Promise<StandaloneTask>;
  delete(orgId: string, id: string): Promise<void>;
  listByBusinessId(orgId: string, businessId: string): Promise<StandaloneTask[]>;
  listChildren(orgId: string, parentTaskId: string): Promise<StandaloneTask[]>;
}

export interface DocumentRepository {
  create(input: Omit<Document, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<Document>;
  findById(orgId: string, id: string): Promise<Document | null>;
  update(orgId: string, id: string, patch: Partial<Omit<Document, "id" | "orgId" | "businessId" | "createdAt" | "updatedAt" | "deletedAt">>): Promise<Document>;
  delete(orgId: string, id: string): Promise<void>;
  listByBusinessId(orgId: string, businessId: string): Promise<Document[]>;
}

export interface EstimateRepository {
  create(input: Omit<Estimate, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<Estimate>;
  findById(orgId: string, id: string): Promise<Estimate | null>;
  findByNumber(orgId: string, estimateNumber: string): Promise<Estimate | null>;
  update(orgId: string, id: string, patch: Partial<Omit<Estimate, "id" | "orgId" | "businessId" | "createdAt" | "updatedAt" | "deletedAt">>): Promise<Estimate>;
  delete(orgId: string, id: string): Promise<void>;
  listByBusinessId(orgId: string, businessId: string): Promise<Estimate[]>;
  listByCustomer(orgId: string, customerId: string): Promise<Estimate[]>;
}

// ─── Wave 1A: Business Operating Loop ────────────────────────────────────────

import type { Workflow, WorkflowRun, LifecyclePolicy } from "@boss/types";

export interface WorkflowRepository {
  create(input: Omit<Workflow, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<Workflow>;
  findById(orgId: string, id: string): Promise<Workflow | null>;
  update(orgId: string, id: string, patch: Partial<Omit<Workflow, "id" | "orgId" | "businessId" | "createdAt" | "updatedAt" | "deletedAt">>): Promise<Workflow>;
  delete(orgId: string, id: string): Promise<void>;
  listByBusinessId(orgId: string, businessId: string): Promise<Workflow[]>;
  listByTriggerEvent(orgId: string, triggerEvent: string): Promise<Workflow[]>;
}

export interface WorkflowRunRepository {
  create(input: Omit<WorkflowRun, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<WorkflowRun>;
  findById(orgId: string, id: string): Promise<WorkflowRun | null>;
  update(orgId: string, id: string, patch: Partial<Omit<WorkflowRun, "id" | "orgId" | "businessId" | "createdAt" | "updatedAt" | "deletedAt">>): Promise<WorkflowRun>;
  listByBusinessId(orgId: string, businessId: string): Promise<WorkflowRun[]>;
  listByWorkflow(orgId: string, workflowId: string): Promise<WorkflowRun[]>;
  listByObject(orgId: string, businessObjectType: string, businessObjectId: string): Promise<WorkflowRun[]>;
}

export interface LifecyclePolicyRepository {
  create(input: Omit<LifecyclePolicy, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<LifecyclePolicy>;
  findById(orgId: string, id: string): Promise<LifecyclePolicy | null>;
  update(orgId: string, id: string, patch: Partial<Omit<LifecyclePolicy, "id" | "orgId" | "businessId" | "createdAt" | "updatedAt" | "deletedAt">>): Promise<LifecyclePolicy>;
  delete(orgId: string, id: string): Promise<void>;
  listByBusinessId(orgId: string, businessId: string): Promise<LifecyclePolicy[]>;
  listByEvent(orgId: string, businessId: string, fromEvent: string): Promise<LifecyclePolicy[]>;
}
