import { randomUUID } from "node:crypto";
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
  ConstraintScore,
  ConstraintPriority,
  BusinessRecommendation,
  RecommendationScore,
  RecommendationPriority,
  TransformationRoadmap,
  IntegrationAccount,
  CredentialReference,
  PermissionPolicy,
  ToolExecution,
  ToolAuditRecord,
  ProviderHealth,
  WorkflowExecution,
  TaskExecution,
  ExecutionEventRecord,
  DeadLetterEntry,
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
  OrganizationWithMembership,
  BusinessContextSnapshot,
  BusinessDiscoveryHistoryEntry,
  CanonicalBusinessContextData,
  BusinessEdge,
  BusinessGraphHistoryEntry,
  BusinessNode,
  GraphSnapshot,
} from "@boss/types";
import {
  BusinessDiscoveryConcurrencyError,
  BusinessGraphConcurrencyError,
  type BusinessRepository,
  type BusinessProfileRepository,
  type BusinessMriRepository,
  type BusinessDnaRepository,
  type BusinessHealthRepository,
  type BusinessCapabilityRepository,
  type BusinessTimelineRepository,
  type BusinessConstraintRepository,
  type StoredConstraintEvidence,
  type ConstraintScoreRepository,
  type ConstraintPriorityRepository,
  type BusinessRecommendationRepository,
  type StoredRecommendationEvidence,
  type RecommendationScoreRepository,
  type BusinessDiagnosticRepository,
  type OrganizationRepository,
  type RecommendationPriorityRepository,
  type TransformationRoadmapRepository,
  type IntegrationAccountRepository,
  type PermissionPolicyRepository,
  type ToolExecutionRepository,
  type ProviderHealthRepository,
  type WorkflowExecutionRepository,
  type TaskExecutionRepository,
  type ExecutionEventRepository,
  type DeadLetterRepository,
  type MemoryRecordRepository,
  type ProviderEvidenceRepository,
  type SchedulerJobRepository,
  type EventLogRepository,
  type EventLogEntry,
  type BusinessDecisionRepository,
  type BusinessScenarioRepository,
  type BusinessDiscoveryRepository,
  type BusinessGraphRepository,
} from "../types.js";

function stamp(): Pick<Business, "createdAt" | "updatedAt" | "deletedAt"> {
  const now = new Date().toISOString();
  return { createdAt: now, updatedAt: now, deletedAt: null };
}

export function createInMemoryBusinessRepository(): BusinessRepository {
  const items = new Map<string, Business>();
  return {
    async create(input) {
      const business: Business = { id: randomUUID(), ...input, ...stamp() };
      items.set(business.id, business);
      return business;
    },
    async findById(orgId, id) {
      const found = items.get(id);
      return found && found.orgId === orgId ? found : null;
    },
    async list(orgId) {
      return Array.from(items.values()).filter((item) => item.orgId === orgId);
    },
  };
}

export function createInMemoryBusinessProfileRepository(): BusinessProfileRepository {
  const items = new Map<string, BusinessProfile>();
  return {
    async upsert(input) {
      const existing = Array.from(items.values()).find((item) => item.businessId === input.businessId);
      const profile: BusinessProfile = existing
        ? { ...existing, ...input, updatedAt: new Date().toISOString() }
        : { id: randomUUID(), ...input, ...stamp() };
      items.set(profile.id, profile);
      return profile;
    },
    async findByBusinessId(orgId, businessId) {
      return (
        Array.from(items.values()).find((item) => item.orgId === orgId && item.businessId === businessId) ?? null
      );
    },
  };
}

export function createInMemoryBusinessMriRepository(): BusinessMriRepository {
  const mris = new Map<string, BusinessMRI>();
  const sections = new Map<string, BusinessMriSection>();
  const responses = new Map<string, BusinessMriResponse>();
  return {
    async create(input) {
      const mri: BusinessMRI = { id: randomUUID(), ...input, ...stamp() };
      mris.set(mri.id, mri);
      return mri;
    },
    async update(orgId, id, patch) {
      const existing = mris.get(id);
      if (!existing || existing.orgId !== orgId) {
        throw new Error(`BusinessMRI ${id} not found`);
      }
      const updated: BusinessMRI = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      mris.set(id, updated);
      return updated;
    },
    async findByBusinessId(orgId, businessId) {
      return (
        Array.from(mris.values()).find((item) => item.orgId === orgId && item.businessId === businessId) ?? null
      );
    },
    async upsertSection(input) {
      const existing = Array.from(sections.values()).find(
        (item) => item.businessMriId === input.businessMriId && item.sectionKey === input.sectionKey
      );
      const section: BusinessMriSection = existing
        ? { ...existing, ...input, updatedAt: new Date().toISOString() }
        : { id: randomUUID(), ...input, ...stamp() };
      sections.set(section.id, section);
      return section;
    },
    async listSections(orgId, businessMriId) {
      return Array.from(sections.values()).filter(
        (item) => item.orgId === orgId && item.businessMriId === businessMriId
      );
    },
    async upsertResponse(input) {
      const existing = Array.from(responses.values()).find(
        (item) => item.businessMriId === input.businessMriId && item.questionKey === input.questionKey
      );
      const response: BusinessMriResponse = existing
        ? { ...existing, ...input, updatedAt: new Date().toISOString() }
        : { id: randomUUID(), ...input, ...stamp() };
      responses.set(response.id, response);
      return response;
    },
    async listResponses(orgId, businessMriId) {
      return Array.from(responses.values()).filter(
        (item) => item.orgId === orgId && item.businessMriId === businessMriId
      );
    },
  };
}

export function createInMemoryBusinessDnaRepository(): BusinessDnaRepository {
  const items = new Map<string, BusinessDNA>();
  return {
    async upsert(input) {
      const existing = Array.from(items.values()).find((item) => item.businessId === input.businessId);
      const dna: BusinessDNA = existing
        ? { ...existing, ...input, updatedAt: new Date().toISOString() }
        : { id: randomUUID(), ...input, ...stamp() };
      items.set(dna.id, dna);
      return dna;
    },
    async findByBusinessId(orgId, businessId) {
      return (
        Array.from(items.values()).find((item) => item.orgId === orgId && item.businessId === businessId) ?? null
      );
    },
  };
}

export function createInMemoryBusinessHealthRepository(): BusinessHealthRepository {
  const healths = new Map<string, BusinessHealth>();
  const dimensions = new Map<string, BusinessHealthDimension>();
  return {
    async upsert(input) {
      const existing = Array.from(healths.values()).find((item) => item.businessId === input.businessId);
      const health: BusinessHealth = existing
        ? { ...existing, ...input, updatedAt: new Date().toISOString() }
        : { id: randomUUID(), ...input, ...stamp() };
      healths.set(health.id, health);
      return health;
    },
    async findByBusinessId(orgId, businessId) {
      return (
        Array.from(healths.values()).find((item) => item.orgId === orgId && item.businessId === businessId) ?? null
      );
    },
    async upsertDimension(input) {
      const existing = Array.from(dimensions.values()).find(
        (item) => item.businessHealthId === input.businessHealthId && item.dimensionKey === input.dimensionKey
      );
      const dimension: BusinessHealthDimension = existing
        ? { ...existing, ...input, updatedAt: new Date().toISOString() }
        : { id: randomUUID(), ...input, ...stamp() };
      dimensions.set(dimension.id, dimension);
      return dimension;
    },
    async listDimensions(orgId, businessHealthId) {
      return Array.from(dimensions.values()).filter(
        (item) => item.orgId === orgId && item.businessHealthId === businessHealthId
      );
    },
  };
}

export function createInMemoryBusinessCapabilityRepository(): BusinessCapabilityRepository {
  const items = new Map<string, BusinessCapabilityAssessment>();
  return {
    async upsert(input) {
      const existing = Array.from(items.values()).find(
        (item) => item.businessId === input.businessId && item.capabilityKey === input.capabilityKey
      );
      const capability: BusinessCapabilityAssessment = existing
        ? { ...existing, ...input, updatedAt: new Date().toISOString() }
        : { id: randomUUID(), ...input, ...stamp() };
      items.set(capability.id, capability);
      return capability;
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(items.values()).filter((item) => item.orgId === orgId && item.businessId === businessId);
    },
  };
}

export function createInMemoryBusinessTimelineRepository(): BusinessTimelineRepository {
  const items = new Map<string, BusinessTimelineEntry>();
  return {
    async append(input) {
      const entry: BusinessTimelineEntry = { id: randomUUID(), ...input, ...stamp() };
      items.set(entry.id, entry);
      return entry;
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(items.values())
        .filter((item) => item.orgId === orgId && item.businessId === businessId)
        .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
    },
  };
}

export function createInMemoryBusinessConstraintRepository(): BusinessConstraintRepository {
  const items = new Map<string, BusinessConstraint>();
  const evidence = new Map<string, StoredConstraintEvidence[]>();
  return {
    async create(input) {
      const constraint: BusinessConstraint = { id: randomUUID(), ...input, evidence: [], ...stamp() };
      items.set(constraint.id, constraint);
      evidence.set(constraint.id, []);
      return constraint;
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(items.values())
        .filter((item) => item.orgId === orgId && item.businessId === businessId)
        .map((item) => ({ ...item, evidence: evidence.get(item.id) ?? [] }));
    },
    async findById(orgId, id) {
      const found = items.get(id);
      if (!found || found.orgId !== orgId) return null;
      return { ...found, evidence: evidence.get(id) ?? [] };
    },
    async updateStatus(orgId, id, status) {
      const existing = items.get(id);
      if (!existing || existing.orgId !== orgId) {
        throw new Error(`BusinessConstraint ${id} not found`);
      }
      const updated: BusinessConstraint = { ...existing, status, updatedAt: new Date().toISOString() };
      items.set(id, updated);
      return { ...updated, evidence: evidence.get(id) ?? [] };
    },
    async addEvidence(constraintId, item) {
      const stored: StoredConstraintEvidence = { id: randomUUID(), constraintId, ...item, createdAt: new Date().toISOString() };
      const list = evidence.get(constraintId) ?? [];
      list.push(stored);
      evidence.set(constraintId, list);
      return stored;
    },
    async listEvidence(constraintId) {
      return evidence.get(constraintId) ?? [];
    },
    async recordHistory() {
      // In-memory adapter does not persist history; Postgres adapter does.
    },
  };
}

export function createInMemoryConstraintScoreRepository(): ConstraintScoreRepository {
  const items = new Map<string, ConstraintScore>();
  return {
    async upsert(input) {
      const existing = Array.from(items.values()).find((item) => item.constraintId === input.constraintId);
      const score: ConstraintScore = existing
        ? { ...existing, ...input, updatedAt: new Date().toISOString() }
        : { id: randomUUID(), ...input, ...stamp() };
      items.set(score.id, score);
      return score;
    },
    async findByConstraintId(orgId, constraintId) {
      return (
        Array.from(items.values()).find((item) => item.orgId === orgId && item.constraintId === constraintId) ?? null
      );
    },
  };
}

/**
 * businessId is not denormalized onto ConstraintPriority, so the in-memory
 * adapter is constructed with the constraint repository it should consult
 * to resolve which constraint IDs belong to a given business.
 */
export function createInMemoryConstraintPriorityRepository(
  constraintRepository: BusinessConstraintRepository
): ConstraintPriorityRepository {
  const items = new Map<string, ConstraintPriority>();
  return {
    async upsert(input) {
      const existing = Array.from(items.values()).find((item) => item.constraintId === input.constraintId);
      const priority: ConstraintPriority = existing
        ? { ...existing, ...input, updatedAt: new Date().toISOString() }
        : { id: randomUUID(), ...input, ...stamp() };
      items.set(priority.id, priority);
      return priority;
    },
    async listByBusinessId(orgId, businessId) {
      const constraints = await constraintRepository.listByBusinessId(orgId, businessId);
      const constraintIds = new Set(constraints.map((c) => c.id));
      return Array.from(items.values())
        .filter((item) => item.orgId === orgId && constraintIds.has(item.constraintId))
        .sort((a, b) => a.rank - b.rank);
    },
  };
}

export function createInMemoryBusinessRecommendationRepository(): BusinessRecommendationRepository {
  const items = new Map<string, BusinessRecommendation>();
  const evidence = new Map<string, StoredRecommendationEvidence[]>();
  return {
    async create(input) {
      const recommendation: BusinessRecommendation = { id: randomUUID(), ...input, evidence: [], ...stamp() };
      items.set(recommendation.id, recommendation);
      evidence.set(recommendation.id, []);
      return recommendation;
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(items.values())
        .filter((item) => item.orgId === orgId && item.businessId === businessId)
        .map((item) => ({ ...item, evidence: evidence.get(item.id) ?? [] }));
    },
    async findById(orgId, id) {
      const found = items.get(id);
      if (!found || found.orgId !== orgId) return null;
      return { ...found, evidence: evidence.get(id) ?? [] };
    },
    async updateStatus(orgId, id, status) {
      const existing = items.get(id);
      if (!existing || existing.orgId !== orgId) {
        throw new Error(`BusinessRecommendation ${id} not found`);
      }
      const updated: BusinessRecommendation = { ...existing, status, updatedAt: new Date().toISOString() };
      items.set(id, updated);
      return { ...updated, evidence: evidence.get(id) ?? [] };
    },
    async addEvidence(recommendationId, item) {
      const stored: StoredRecommendationEvidence = {
        id: randomUUID(),
        recommendationId,
        ...item,
        createdAt: new Date().toISOString(),
      };
      const list = evidence.get(recommendationId) ?? [];
      list.push(stored);
      evidence.set(recommendationId, list);
      return stored;
    },
    async listEvidence(recommendationId) {
      return evidence.get(recommendationId) ?? [];
    },
    async recordHistory() {
      // In-memory adapter does not persist history; Postgres adapter does.
    },
  };
}

export function createInMemoryRecommendationScoreRepository(): RecommendationScoreRepository {
  const items = new Map<string, RecommendationScore>();
  return {
    async upsert(input) {
      const existing = Array.from(items.values()).find((item) => item.recommendationId === input.recommendationId);
      const score: RecommendationScore = existing
        ? { ...existing, ...input, updatedAt: new Date().toISOString() }
        : { id: randomUUID(), ...input, ...stamp() };
      items.set(score.id, score);
      return score;
    },
    async findByRecommendationId(orgId, recommendationId) {
      return (
        Array.from(items.values()).find(
          (item) => item.orgId === orgId && item.recommendationId === recommendationId
        ) ?? null
      );
    },
  };
}

/**
 * businessId is not denormalized onto RecommendationPriority, so the
 * in-memory adapter is constructed with the recommendation repository it
 * should consult to resolve which recommendation IDs belong to a business.
 */
export function createInMemoryRecommendationPriorityRepository(
  recommendationRepository: BusinessRecommendationRepository
): RecommendationPriorityRepository {
  const items = new Map<string, RecommendationPriority>();
  return {
    async upsert(input) {
      const existing = Array.from(items.values()).find(
        (item) => item.recommendationId === input.recommendationId
      );
      const priority: RecommendationPriority = existing
        ? { ...existing, ...input, updatedAt: new Date().toISOString() }
        : { id: randomUUID(), ...input, ...stamp() };
      items.set(priority.id, priority);
      return priority;
    },
    async listByBusinessId(orgId, businessId) {
      const recommendations = await recommendationRepository.listByBusinessId(orgId, businessId);
      const recommendationIds = new Set(recommendations.map((r) => r.id));
      return Array.from(items.values())
        .filter((item) => item.orgId === orgId && recommendationIds.has(item.recommendationId))
        .sort((a, b) => a.rank - b.rank);
    },
  };
}

export function createInMemoryTransformationRoadmapRepository(): TransformationRoadmapRepository {
  const items = new Map<string, TransformationRoadmap>();
  return {
    async upsert(input) {
      const existing = Array.from(items.values()).find((item) => item.businessId === input.businessId);
      const roadmap: TransformationRoadmap = existing
        ? { ...existing, ...input, updatedAt: new Date().toISOString() }
        : { id: randomUUID(), ...input, ...stamp() };
      items.set(roadmap.id, roadmap);
      return roadmap;
    },
    async findByBusinessId(orgId, businessId) {
      return (
        Array.from(items.values()).find((item) => item.orgId === orgId && item.businessId === businessId) ?? null
      );
    },
  };
}

export function createInMemoryIntegrationAccountRepository(): IntegrationAccountRepository {
  const accounts = new Map<string, IntegrationAccount>();
  const credentials = new Map<string, CredentialReference>();
  return {
    async upsert(input) {
      const existing = Array.from(accounts.values()).find(
        (a) => a.businessId === input.businessId && a.providerKey === input.providerKey
      );
      const account: IntegrationAccount = existing
        ? { ...existing, ...input, updatedAt: new Date().toISOString() }
        : { id: randomUUID(), ...input, ...stamp() };
      accounts.set(account.id, account);
      return account;
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(accounts.values()).filter(
        (a) => a.orgId === orgId && a.businessId === businessId && !a.deletedAt
      );
    },
    async findByProvider(orgId, businessId, providerKey) {
      return (
        Array.from(accounts.values()).find(
          (a) => a.orgId === orgId && a.businessId === businessId && a.providerKey === providerKey && !a.deletedAt
        ) ?? null
      );
    },
    async addCredentialReference(integrationAccountId, input) {
      const account = accounts.get(integrationAccountId);
      const credential: CredentialReference = {
        id: randomUUID(),
        orgId: account?.orgId ?? "",
        integrationAccountId,
        ...input,
        ...stamp(),
      };
      credentials.set(credential.id, credential);
      return credential;
    },
    async findCredentialByAccount(integrationAccountId) {
      return (
        Array.from(credentials.values()).find(
          (c) => c.integrationAccountId === integrationAccountId && !c.deletedAt
        ) ?? null
      );
    },
  };
}

export function createInMemoryPermissionPolicyRepository(): PermissionPolicyRepository {
  const items = new Map<string, PermissionPolicy>();
  return {
    async upsert(input) {
      const existing = Array.from(items.values()).find(
        (p) => p.businessId === input.businessId && p.toolKey === input.toolKey && p.roleKey === input.roleKey
      );
      const policy: PermissionPolicy = existing
        ? { ...existing, ...input, updatedAt: new Date().toISOString() }
        : { id: randomUUID(), ...input, ...stamp() };
      items.set(policy.id, policy);
      return policy;
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(items.values()).filter((p) => p.orgId === orgId && p.businessId === businessId && !p.deletedAt);
    },
  };
}

export function createInMemoryToolExecutionRepository(): ToolExecutionRepository {
  const executions = new Map<string, ToolExecution>();
  const audits = new Map<string, ToolAuditRecord>();
  return {
    async create(input) {
      const execution: ToolExecution = {
        id: randomUUID(),
        ...input,
        attemptCount: 1,
        latencyMs: null,
        ...stamp(),
      };
      executions.set(execution.id, execution);
      return execution;
    },
    async updateStatus(orgId, id, status, output, errorMessage, meta) {
      const existing = executions.get(id);
      if (!existing || existing.orgId !== orgId) {
        throw new Error(`ToolExecution ${id} not found`);
      }
      const updated: ToolExecution = {
        ...existing,
        status,
        output,
        errorMessage,
        attemptCount: meta?.attemptCount ?? existing.attemptCount,
        latencyMs: meta?.latencyMs !== undefined ? meta.latencyMs : existing.latencyMs,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      executions.set(id, updated);
      return updated;
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(executions.values())
        .filter((e) => e.orgId === orgId && e.businessId === businessId && !e.deletedAt)
        .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    },
    async addAuditRecord(input) {
      const record: ToolAuditRecord = { id: randomUUID(), ...input, createdAt: new Date().toISOString() };
      audits.set(record.id, record);
      return record;
    },
    async listAuditRecords(orgId, businessId) {
      return Array.from(audits.values())
        .filter((a) => a.orgId === orgId && a.businessId === businessId)
        .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
    },
  };
}

export function createInMemoryProviderHealthRepository(): ProviderHealthRepository {
  const items = new Map<string, ProviderHealth>();
  return {
    async upsert(input) {
      const existing = Array.from(items.values()).find(
        (h) => h.businessId === input.businessId && h.providerKey === input.providerKey
      );
      const health: ProviderHealth = existing
        ? { ...existing, ...input, updatedAt: new Date().toISOString() }
        : { id: randomUUID(), ...input, ...stamp() };
      items.set(health.id, health);
      return health;
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(items.values()).filter((h) => h.orgId === orgId && h.businessId === businessId);
    },
  };
}

export function createInMemoryWorkflowExecutionRepository(): WorkflowExecutionRepository {
  const executions = new Map<string, WorkflowExecution>();
  return {
    async create(input) {
      const execution: WorkflowExecution = { id: randomUUID(), ...input, ...stamp() };
      executions.set(execution.id, execution);
      return execution;
    },
    async updateState(orgId, id, state, currentStepIndex, output, errorMessage, completedAt) {
      const existing = executions.get(id);
      if (!existing || existing.orgId !== orgId) {
        throw new Error(`WorkflowExecution ${id} not found`);
      }
      const updated: WorkflowExecution = {
        ...existing,
        state,
        currentStepIndex,
        output,
        errorMessage,
        completedAt,
        updatedAt: new Date().toISOString(),
      };
      executions.set(id, updated);
      return updated;
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(executions.values())
        .filter((e) => e.orgId === orgId && e.businessId === businessId && !e.deletedAt)
        .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    },
  };
}

export function createInMemoryTaskExecutionRepository(): TaskExecutionRepository {
  const tasks = new Map<string, TaskExecution>();
  return {
    async create(input) {
      const task: TaskExecution = { id: randomUUID(), ...input, ...stamp() };
      tasks.set(task.id, task);
      return task;
    },
    async updateState(orgId, id, state, attempt, output, errorMessage, completedAt) {
      const existing = tasks.get(id);
      if (!existing || existing.orgId !== orgId) {
        throw new Error(`TaskExecution ${id} not found`);
      }
      const updated: TaskExecution = {
        ...existing,
        state,
        attempt,
        output,
        errorMessage,
        completedAt,
        updatedAt: new Date().toISOString(),
      };
      tasks.set(id, updated);
      return updated;
    },
    async listByWorkflowExecutionId(orgId, workflowExecutionId) {
      return Array.from(tasks.values())
        .filter((t) => t.orgId === orgId && t.workflowExecutionId === workflowExecutionId)
        .sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1));
    },
  };
}

export function createInMemoryExecutionEventRepository(): ExecutionEventRepository {
  const events = new Map<string, ExecutionEventRecord>();
  return {
    async append(input) {
      const event: ExecutionEventRecord = { id: randomUUID(), ...input, createdAt: new Date().toISOString() };
      events.set(event.id, event);
      return event;
    },
    async listByWorkflowExecutionId(orgId, workflowExecutionId) {
      return Array.from(events.values())
        .filter((e) => e.orgId === orgId && e.workflowExecutionId === workflowExecutionId)
        .sort((a, b) => (a.occurredAt < b.occurredAt ? -1 : 1));
    },
  };
}

export function createInMemoryDeadLetterRepository(): DeadLetterRepository {
  const entries = new Map<string, DeadLetterEntry>();
  return {
    async add(input) {
      const entry: DeadLetterEntry = { id: randomUUID(), ...input, ...stamp() };
      entries.set(entry.id, entry);
      return entry;
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(entries.values())
        .filter((e) => e.orgId === orgId && e.businessId === businessId && !e.deletedAt)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
  };
}

export function createInMemoryMemoryRecordRepository(): MemoryRecordRepository {
  const items = new Map<string, MemoryRecord>();
  return {
    async upsert(input) {
      const existing = Array.from(items.values()).find(
        (item) =>
          item.orgId === input.orgId &&
          item.businessId === input.businessId &&
          item.ownerType === input.ownerType &&
          item.ownerId === input.ownerId &&
          item.key === input.key
      );
      const now = new Date().toISOString();
      const record: MemoryRecord = existing
        ? { ...existing, ...input, updatedAt: now }
        : { id: randomUUID(), ...input, createdAt: now, updatedAt: now };
      items.set(record.id, record);
      return record;
    },
    async get(orgId, businessId, ownerType, ownerId, key) {
      return (
        Array.from(items.values()).find(
          (item) =>
            item.orgId === orgId &&
            item.businessId === businessId &&
            item.ownerType === ownerType &&
            item.ownerId === ownerId &&
            item.key === key
        ) ?? null
      );
    },
    async listByOwner(orgId, businessId, ownerType, ownerId) {
      return Array.from(items.values()).filter(
        (item) =>
          item.orgId === orgId &&
          item.businessId === businessId &&
          item.ownerType === ownerType &&
          item.ownerId === ownerId
      );
    },
  };
}

export function createInMemoryProviderEvidenceRepository(): ProviderEvidenceRepository {
  const records = new Map<string, ProviderEvidence>();
  return {
    async create(input) {
      const record: ProviderEvidence = { id: randomUUID(), ...input, ...stamp() };
      records.set(record.id, record);
      return record;
    },
    async listByToolExecutionId(orgId, toolExecutionId) {
      return Array.from(records.values()).filter(
        (r) => r.orgId === orgId && r.toolExecutionId === toolExecutionId && !r.deletedAt
      );
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(records.values()).filter(
        (r) => r.orgId === orgId && r.businessId === businessId && !r.deletedAt
      );
    },
  };
}

export function createInMemorySchedulerJobRepository(): SchedulerJobRepository {
  const jobs = new Map<string, SchedulerJob>();
  return {
    async create(input) {
      const job: SchedulerJob = { id: randomUUID(), ...input, ...stamp() };
      jobs.set(job.id, job);
      return job;
    },
    async findById(orgId, id) {
      const job = jobs.get(id);
      return job && job.orgId === orgId && !job.deletedAt ? job : null;
    },
    async updateState(orgId, id, state, fields = {}) {
      const job = jobs.get(id);
      if (!job || job.orgId !== orgId) throw new Error(`SchedulerJob ${id} not found`);
      const updated: SchedulerJob = {
        ...job,
        state,
        lastRunAt: fields.lastRunAt ?? job.lastRunAt,
        nextRunAt: fields.nextRunAt ?? job.nextRunAt,
        runCount: fields.runCount ?? job.runCount,
        errorMessage: fields.errorMessage ?? job.errorMessage,
        updatedAt: new Date().toISOString(),
      };
      jobs.set(id, updated);
      return updated;
    },
    async listDuePending(now) {
      return Array.from(jobs.values()).filter((j) => {
        if (j.state !== "pending" || j.deletedAt) return false;
        // For cron jobs that have already run once, use nextRunAt as the due-time check
        if (j.lastRunAt && j.nextRunAt) return j.nextRunAt <= now;
        return j.runAt <= now;
      });
    },
    async listByBusiness(orgId, businessId) {
      return Array.from(jobs.values()).filter(
        (j) => j.orgId === orgId && j.businessId === businessId && !j.deletedAt
      );
    },
    async cancel(orgId, id) {
      const job = jobs.get(id);
      if (job && job.orgId === orgId) {
        jobs.set(id, { ...job, state: "cancelled" as SchedulerJobState, updatedAt: new Date().toISOString() });
      }
    },
  };
}

export function createInMemoryBusinessDecisionRepository(): BusinessDecisionRepository {
  const items = new Map<string, BusinessDecision>();
  const now = () => new Date().toISOString();
  return {
    async create(input) {
      const decision: BusinessDecision = {
        id: randomUUID(), ...input,
        createdAt: now(), updatedAt: now(), deletedAt: null,
      };
      items.set(decision.id, decision);
      return decision;
    },
    async findById(orgId, id) {
      const found = items.get(id);
      return found && found.orgId === orgId && !found.deletedAt ? found : null;
    },
    async update(orgId, id, patch) {
      const existing = items.get(id);
      if (!existing || existing.orgId !== orgId || existing.deletedAt) throw new Error(`Decision ${id} not found`);
      const updated: BusinessDecision = { ...existing, ...patch, updatedAt: now() };
      items.set(id, updated);
      return updated;
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(items.values()).filter(
        (d) => d.orgId === orgId && d.businessId === businessId && !d.deletedAt
      );
    },
    async listByStatus(orgId, businessId, status: DecisionStatus) {
      return Array.from(items.values()).filter(
        (d) => d.orgId === orgId && d.businessId === businessId && d.status === status && !d.deletedAt
      );
    },
  };
}

export function createInMemoryBusinessScenarioRepository(): BusinessScenarioRepository {
  const scenarios = new Map<string, BusinessScenario>();
  const comparisons = new Map<string, ScenarioComparison>();
  const now = () => new Date().toISOString();
  return {
    async create(input) {
      const scenario: BusinessScenario = {
        id: randomUUID(), ...input,
        createdAt: now(), updatedAt: now(), deletedAt: null,
      };
      scenarios.set(scenario.id, scenario);
      return scenario;
    },
    async findById(orgId, id) {
      const found = scenarios.get(id);
      return found && found.orgId === orgId && !found.deletedAt ? found : null;
    },
    async update(orgId, id, patch) {
      const existing = scenarios.get(id);
      if (!existing || existing.orgId !== orgId || existing.deletedAt) throw new Error(`Scenario ${id} not found`);
      const updated: BusinessScenario = { ...existing, ...patch, updatedAt: now() };
      scenarios.set(id, updated);
      return updated;
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(scenarios.values()).filter(
        (s) => s.orgId === orgId && s.businessId === businessId && !s.deletedAt
      );
    },
    async createComparison(input) {
      const comparison: ScenarioComparison = { id: randomUUID(), createdAt: now(), ...input };
      comparisons.set(comparison.id, comparison);
      return comparison;
    },
    async listComparisons(orgId, businessId) {
      return Array.from(comparisons.values()).filter(
        (c) => c.orgId === orgId && c.businessId === businessId
      );
    },
  };
}

export function createInMemoryEventLogRepository(): EventLogRepository {
  const entries: EventLogEntry[] = [];
  const now = () => new Date().toISOString();
  return {
    async append(input) {
      const entry: EventLogEntry = {
        id: randomUUID(),
        ...input,
        orgId: input.orgId ?? null,
        correlationId: input.correlationId ?? null,
        causationId: input.causationId ?? null,
        createdAt: now(),
      };
      entries.push(entry);
      return entry;
    },
    async listByType(type, limit = 100) {
      return entries.filter((e) => e.type === type).slice(-limit).reverse();
    },
    async listByOrgId(orgId, limit = 200) {
      return entries.filter((e) => e.orgId === orgId).slice(-limit).reverse();
    },
    async listByCorrelationId(correlationId) {
      return entries.filter((e) => e.correlationId === correlationId);
    },
    async listSince(since, limit = 500) {
      return entries.filter((e) => e.occurredAt >= since).slice(0, limit);
    },
  };
}

function freezeContext(
  context: CanonicalBusinessContextData,
): CanonicalBusinessContextData {
  return Object.freeze(structuredClone(context));
}

function freezeDiscoverySnapshot(
  snapshot: BusinessContextSnapshot,
): BusinessContextSnapshot {
  return Object.freeze({
    ...snapshot,
    context: freezeContext(snapshot.context),
  });
}

export function createInMemoryBusinessDiscoveryRepository(): BusinessDiscoveryRepository {
  const current = new Map<string, BusinessContextSnapshot>();
  const versions = new Map<string, BusinessContextSnapshot[]>();
  const history = new Map<string, BusinessDiscoveryHistoryEntry[]>();
  const key = (orgId: string, businessId: string): string =>
    `${orgId}:${businessId}`;

  const appendHistory = (
    aggregateKey: string,
    entry: Omit<BusinessDiscoveryHistoryEntry, "id" | "occurredAt">,
  ): void => {
    const entries = history.get(aggregateKey) ?? [];
    entries.push(
      Object.freeze({
        id: randomUUID(),
        occurredAt: new Date().toISOString(),
        ...entry,
      }),
    );
    history.set(aggregateKey, entries);
  };

  return {
    async create(input) {
      const aggregateKey = key(input.orgId, input.businessId);
      if (current.has(aggregateKey)) {
        throw new Error("A canonical Business Discovery already exists.");
      }
      const now = new Date().toISOString();
      const snapshot = freezeDiscoverySnapshot({
        id: randomUUID(),
        orgId: input.orgId,
        businessId: input.businessId,
        status: "draft",
        discoveryVersion: 1,
        lockVersion: 1,
        schemaVersion: input.schemaVersion,
        createdBy: input.mutation.actorId,
        createdAt: now,
        updatedAt: now,
        context: input.context,
        versionCreatedBy: input.mutation.actorId,
        versionCreatedAt: now,
      });
      current.set(aggregateKey, snapshot);
      versions.set(aggregateKey, [snapshot]);
      appendHistory(aggregateKey, {
        orgId: input.orgId,
        discoveryId: snapshot.id,
        discoveryVersion: 1,
        action: "created",
        previousStatus: null,
        newStatus: "draft",
        actorId: input.mutation.actorId,
        reason: input.mutation.reason,
        correlationId: input.mutation.correlationId,
        traceId: input.mutation.traceId,
      });
      return snapshot;
    },

    async getCurrent(orgId, businessId) {
      return current.get(key(orgId, businessId)) ?? null;
    },

    async saveContext(input) {
      const aggregateKey = key(input.orgId, input.businessId);
      const existing = current.get(aggregateKey);
      if (
        !existing ||
        existing.lockVersion !== input.expectedLockVersion ||
        !["draft", "in_progress"].includes(existing.status)
      ) {
        throw new BusinessDiscoveryConcurrencyError();
      }
      const now = new Date().toISOString();
      const snapshot = freezeDiscoverySnapshot({
        ...existing,
        discoveryVersion: existing.discoveryVersion + 1,
        lockVersion: existing.lockVersion + 1,
        updatedAt: now,
        context: input.context,
        versionCreatedBy: input.mutation.actorId,
        versionCreatedAt: now,
      });
      current.set(aggregateKey, snapshot);
      versions.set(aggregateKey, [
        ...(versions.get(aggregateKey) ?? []),
        snapshot,
      ]);
      appendHistory(aggregateKey, {
        orgId: input.orgId,
        discoveryId: snapshot.id,
        discoveryVersion: snapshot.discoveryVersion,
        action: "updated",
        previousStatus: existing.status,
        newStatus: snapshot.status,
        actorId: input.mutation.actorId,
        reason: input.mutation.reason,
        correlationId: input.mutation.correlationId,
        traceId: input.mutation.traceId,
      });
      return snapshot;
    },

    async transition(input) {
      const aggregateKey = key(input.orgId, input.businessId);
      const existing = current.get(aggregateKey);
      if (!existing || existing.lockVersion !== input.expectedLockVersion) {
        throw new BusinessDiscoveryConcurrencyError();
      }
      const snapshot = freezeDiscoverySnapshot({
        ...existing,
        status: input.status,
        lockVersion: existing.lockVersion + 1,
        updatedAt: new Date().toISOString(),
      });
      current.set(aggregateKey, snapshot);
      appendHistory(aggregateKey, {
        orgId: input.orgId,
        discoveryId: snapshot.id,
        discoveryVersion: snapshot.discoveryVersion,
        action: "transitioned",
        previousStatus: existing.status,
        newStatus: snapshot.status,
        actorId: input.mutation.actorId,
        reason: input.mutation.reason,
        correlationId: input.mutation.correlationId,
        traceId: input.mutation.traceId,
      });
      return snapshot;
    },

    async listVersions(orgId, businessId) {
      return Object.freeze([...(versions.get(key(orgId, businessId)) ?? [])]);
    },

    async listHistory(orgId, businessId) {
      return Object.freeze([...(history.get(key(orgId, businessId)) ?? [])]);
    },
  };
}

function freezeGraphSnapshot(snapshot: GraphSnapshot): GraphSnapshot {
  return Object.freeze({
    ...snapshot,
    nodes: Object.freeze(
      snapshot.nodes.map((node) =>
        Object.freeze({
          ...node,
          metadata: Object.freeze(structuredClone(node.metadata)),
        }),
      ),
    ),
    edges: Object.freeze(
      snapshot.edges.map((edge) =>
        Object.freeze({
          ...edge,
          metadata: Object.freeze(structuredClone(edge.metadata)),
        }),
      ),
    ),
    metadata: Object.freeze(structuredClone(snapshot.metadata)),
  });
}

export function createInMemoryBusinessGraphRepository(): BusinessGraphRepository {
  const current = new Map<string, GraphSnapshot>();
  const versions = new Map<string, GraphSnapshot[]>();
  const history = new Map<string, BusinessGraphHistoryEntry[]>();
  const key = (orgId: string, businessId: string): string =>
    `${orgId}:${businessId}`;

  const appendHistory = (
    aggregateKey: string,
    entry: Omit<BusinessGraphHistoryEntry, "id" | "occurredAt">,
  ): void => {
    const entries = history.get(aggregateKey) ?? [];
    entries.push(
      Object.freeze({
        id: randomUUID(),
        occurredAt: new Date().toISOString(),
        ...entry,
      }),
    );
    history.set(aggregateKey, entries);
  };

  const materialize = (
    graphId: string,
    nodes: readonly Omit<BusinessNode, "graphId">[],
    edges: readonly Omit<BusinessEdge, "graphId">[],
  ): {
    nodes: readonly BusinessNode[];
    edges: readonly BusinessEdge[];
  } => ({
    nodes: nodes.map((node) => ({ ...node, graphId })),
    edges: edges.map((edge) => ({ ...edge, graphId })),
  });

  return {
    async create(input) {
      const aggregateKey = key(input.orgId, input.businessId);
      if (current.has(aggregateKey)) {
        throw new Error("A Business Knowledge Graph already exists.");
      }
      const graphId = randomUUID();
      const now = new Date().toISOString();
      const content = materialize(graphId, input.nodes, input.edges);
      const snapshot = freezeGraphSnapshot({
        graphId,
        orgId: input.orgId,
        businessId: input.businessId,
        version: 1,
        lockVersion: 1,
        status: "draft",
        sourceDiscoveryVersion: input.sourceDiscoveryVersion,
        createdBy: input.mutation.actorId,
        createdAt: now,
        ...content,
        metadata: input.metadata,
      });
      current.set(aggregateKey, snapshot);
      versions.set(aggregateKey, [snapshot]);
      appendHistory(aggregateKey, {
        orgId: input.orgId,
        graphId,
        graphVersion: 1,
        action: "created",
        actorId: input.mutation.actorId,
        reason: input.mutation.reason,
        correlationId: input.mutation.correlationId,
        traceId: input.mutation.traceId,
      });
      return snapshot;
    },

    async getCurrent(orgId, businessId) {
      return current.get(key(orgId, businessId)) ?? null;
    },

    async saveSnapshot(input) {
      const aggregateKey = key(input.orgId, input.businessId);
      const existing = current.get(aggregateKey);
      if (
        !existing ||
        existing.lockVersion !== input.expectedLockVersion ||
        existing.status === "archived"
      ) {
        throw new BusinessGraphConcurrencyError();
      }
      const content = materialize(
        existing.graphId,
        input.nodes,
        input.edges,
      );
      const snapshot = freezeGraphSnapshot({
        ...existing,
        version: existing.version + 1,
        lockVersion: existing.lockVersion + 1,
        sourceDiscoveryVersion: input.sourceDiscoveryVersion,
        createdBy: input.mutation.actorId,
        createdAt: new Date().toISOString(),
        ...content,
        metadata: input.metadata,
      });
      current.set(aggregateKey, snapshot);
      versions.set(aggregateKey, [
        ...(versions.get(aggregateKey) ?? []),
        snapshot,
      ]);
      appendHistory(aggregateKey, {
        orgId: input.orgId,
        graphId: snapshot.graphId,
        graphVersion: snapshot.version,
        action: input.action,
        actorId: input.mutation.actorId,
        reason: input.mutation.reason,
        correlationId: input.mutation.correlationId,
        traceId: input.mutation.traceId,
      });
      return snapshot;
    },

    async transition(input) {
      const aggregateKey = key(input.orgId, input.businessId);
      const existing = current.get(aggregateKey);
      if (!existing || existing.lockVersion !== input.expectedLockVersion) {
        throw new BusinessGraphConcurrencyError();
      }
      const snapshot = freezeGraphSnapshot({
        ...existing,
        version: existing.version + 1,
        lockVersion: existing.lockVersion + 1,
        status: input.status,
        createdBy: input.mutation.actorId,
        createdAt: new Date().toISOString(),
      });
      current.set(aggregateKey, snapshot);
      versions.set(aggregateKey, [
        ...(versions.get(aggregateKey) ?? []),
        snapshot,
      ]);
      appendHistory(aggregateKey, {
        orgId: input.orgId,
        graphId: snapshot.graphId,
        graphVersion: snapshot.version,
        action: input.status === "published" ? "published" : "archived",
        actorId: input.mutation.actorId,
        reason: input.mutation.reason,
        correlationId: input.mutation.correlationId,
        traceId: input.mutation.traceId,
      });
      return snapshot;
    },

    async getVersion(orgId, businessId, version) {
      return (
        versions
          .get(key(orgId, businessId))
          ?.find((snapshot) => snapshot.version === version) ?? null
      );
    },

    async listVersions(orgId, businessId) {
      return Object.freeze([...(versions.get(key(orgId, businessId)) ?? [])]);
    },

    async listHistory(orgId, businessId) {
      return Object.freeze([...(history.get(key(orgId, businessId)) ?? [])]);
    },
  };
}

export function createInMemoryBusinessDiagnosticRepository(): BusinessDiagnosticRepository {
  const reports = new Map<string, BusinessDiagnosticReport>();
  return {
    async save(report) {
      reports.set(report.id, structuredClone(report));
    },
    async findLatest(orgId, businessId) {
      return (
        Array.from(reports.values())
          .filter(
            (report) =>
              report.orgId === orgId && report.businessId === businessId,
          )
          .sort((left, right) => right.version - left.version)[0] ?? null
      );
    },
    async listVersions(orgId, businessId) {
      return Array.from(reports.values())
        .filter(
          (report) =>
            report.orgId === orgId && report.businessId === businessId,
        )
        .sort((left, right) => right.version - left.version);
    },
  };
}

export function createInMemoryOrganizationRepository(): OrganizationRepository {
  const organizations = new Map<string, Organization>();
  const memberships = new Map<string, OrganizationWithMembership["membership"]>();
  const active = new Map<string, string>();
  return {
    async create(userId, input) {
      if (
        Array.from(organizations.values()).some(
          (organization) => organization.slug === input.slug,
        )
      ) {
        throw new Error(`Organization slug "${input.slug}" already exists.`);
      }
      const organization: Organization = Object.freeze({
        id: randomUUID(),
        name: input.name,
        slug: input.slug,
        plan: "trial",
        status: "trial",
        createdAt: new Date().toISOString(),
      });
      const membership = Object.freeze({
        userId,
        orgId: organization.id,
        role: "owner" as const,
        status: "active" as const,
      });
      organizations.set(organization.id, organization);
      memberships.set(`${userId}:${organization.id}`, membership);
      active.set(userId, organization.id);
      return Object.freeze({ organization, membership });
    },
    async getMembership(userId, orgId) {
      return memberships.get(`${userId}:${orgId}`);
    },
    async listForUser(userId) {
      return Object.freeze(
        Array.from(memberships.values())
          .filter(
            (membership) =>
              membership.userId === userId && membership.status === "active",
          )
          .map((membership) => ({
            organization: organizations.get(membership.orgId)!,
            membership,
          }))
          .filter((entry) => entry.organization),
      );
    },
    async getActive(userId) {
      const orgId = active.get(userId);
      return orgId ? organizations.get(orgId) ?? null : null;
    },
    async setActive(userId, orgId) {
      const membership = memberships.get(`${userId}:${orgId}`);
      const organization = organizations.get(orgId);
      if (!membership || membership.status !== "active" || !organization) {
        throw new Error("The user is not an active member of the organization.");
      }
      active.set(userId, orgId);
      return organization;
    },
  };
}
