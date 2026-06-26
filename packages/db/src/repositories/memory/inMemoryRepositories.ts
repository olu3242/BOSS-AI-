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
