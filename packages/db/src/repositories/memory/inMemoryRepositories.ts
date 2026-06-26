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
} from "@boss/types";
import type {
  BusinessRepository,
  BusinessProfileRepository,
  BusinessMriRepository,
  BusinessDnaRepository,
  BusinessHealthRepository,
  BusinessCapabilityRepository,
  BusinessTimelineRepository,
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
