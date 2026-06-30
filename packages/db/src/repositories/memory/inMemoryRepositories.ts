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
} from "@boss/types";
import type {
  BusinessRepository,
  BusinessProfileRepository,
  BusinessMriRepository,
  BusinessDnaRepository,
  BusinessHealthRepository,
  BusinessCapabilityRepository,
  BusinessTimelineRepository,
  BusinessConstraintRepository,
  StoredConstraintEvidence,
  ConstraintScoreRepository,
  ConstraintPriorityRepository,
  BusinessRecommendationRepository,
  StoredRecommendationEvidence,
  RecommendationScoreRepository,
  RecommendationPriorityRepository,
  TransformationRoadmapRepository,
  IntegrationAccountRepository,
  PermissionPolicyRepository,
  ToolExecutionRepository,
  ProviderHealthRepository,
  WorkflowExecutionRepository,
  TaskExecutionRepository,
  ExecutionEventRepository,
  DeadLetterRepository,
  MemoryRecordRepository,
  ProviderEvidenceRepository,
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
