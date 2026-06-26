import {
  createPostgresBusinessRepository,
  createPostgresBusinessProfileRepository,
  createPostgresBusinessMriRepository,
  createPostgresBusinessDnaRepository,
  createPostgresBusinessHealthRepository,
  createPostgresBusinessCapabilityRepository,
  createPostgresBusinessTimelineRepository,
  createPostgresBusinessConstraintRepository,
  createPostgresConstraintScoreRepository,
  createPostgresConstraintPriorityRepository,
  createInMemoryBusinessRepository,
  createInMemoryBusinessProfileRepository,
  createInMemoryBusinessMriRepository,
  createInMemoryBusinessDnaRepository,
  createInMemoryBusinessHealthRepository,
  createInMemoryBusinessCapabilityRepository,
  createInMemoryBusinessTimelineRepository,
  createInMemoryBusinessConstraintRepository,
  createInMemoryConstraintScoreRepository,
  createInMemoryConstraintPriorityRepository,
  type BusinessRepository,
  type BusinessProfileRepository,
  type BusinessMriRepository,
  type BusinessDnaRepository,
  type BusinessHealthRepository,
  type BusinessCapabilityRepository,
  type BusinessTimelineRepository,
  type BusinessConstraintRepository,
  type ConstraintScoreRepository,
  type ConstraintPriorityRepository,
} from "@boss/db";
import { installGeneralSmbPack } from "@boss/industry-pack-general-smb";

export interface RepositoryContainer {
  businesses: BusinessRepository;
  businessProfiles: BusinessProfileRepository;
  businessMri: BusinessMriRepository;
  businessDna: BusinessDnaRepository;
  businessHealth: BusinessHealthRepository;
  businessCapabilities: BusinessCapabilityRepository;
  businessTimeline: BusinessTimelineRepository;
  businessConstraints: BusinessConstraintRepository;
  constraintScores: ConstraintScoreRepository;
  constraintPriorities: ConstraintPriorityRepository;
}

export function createPostgresContainer(): RepositoryContainer {
  installGeneralSmbPack();
  return {
    businesses: createPostgresBusinessRepository(),
    businessProfiles: createPostgresBusinessProfileRepository(),
    businessMri: createPostgresBusinessMriRepository(),
    businessDna: createPostgresBusinessDnaRepository(),
    businessHealth: createPostgresBusinessHealthRepository(),
    businessCapabilities: createPostgresBusinessCapabilityRepository(),
    businessTimeline: createPostgresBusinessTimelineRepository(),
    businessConstraints: createPostgresBusinessConstraintRepository(),
    constraintScores: createPostgresConstraintScoreRepository(),
    constraintPriorities: createPostgresConstraintPriorityRepository(),
  };
}

export function createInMemoryContainer(): RepositoryContainer {
  installGeneralSmbPack();
  const businessConstraints = createInMemoryBusinessConstraintRepository();
  return {
    businesses: createInMemoryBusinessRepository(),
    businessProfiles: createInMemoryBusinessProfileRepository(),
    businessMri: createInMemoryBusinessMriRepository(),
    businessDna: createInMemoryBusinessDnaRepository(),
    businessHealth: createInMemoryBusinessHealthRepository(),
    businessCapabilities: createInMemoryBusinessCapabilityRepository(),
    businessTimeline: createInMemoryBusinessTimelineRepository(),
    businessConstraints,
    constraintScores: createInMemoryConstraintScoreRepository(),
    constraintPriorities: createInMemoryConstraintPriorityRepository(businessConstraints),
  };
}
