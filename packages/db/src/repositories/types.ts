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
