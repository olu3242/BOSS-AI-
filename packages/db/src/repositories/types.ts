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
