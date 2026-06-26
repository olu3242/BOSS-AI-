import {
  createPostgresBusinessRepository,
  createPostgresBusinessProfileRepository,
  createPostgresBusinessMriRepository,
  createPostgresBusinessDnaRepository,
  createPostgresBusinessHealthRepository,
  createPostgresBusinessCapabilityRepository,
  createPostgresBusinessTimelineRepository,
  createInMemoryBusinessRepository,
  createInMemoryBusinessProfileRepository,
  createInMemoryBusinessMriRepository,
  createInMemoryBusinessDnaRepository,
  createInMemoryBusinessHealthRepository,
  createInMemoryBusinessCapabilityRepository,
  createInMemoryBusinessTimelineRepository,
  type BusinessRepository,
  type BusinessProfileRepository,
  type BusinessMriRepository,
  type BusinessDnaRepository,
  type BusinessHealthRepository,
  type BusinessCapabilityRepository,
  type BusinessTimelineRepository,
} from "@boss/db";

export interface RepositoryContainer {
  businesses: BusinessRepository;
  businessProfiles: BusinessProfileRepository;
  businessMri: BusinessMriRepository;
  businessDna: BusinessDnaRepository;
  businessHealth: BusinessHealthRepository;
  businessCapabilities: BusinessCapabilityRepository;
  businessTimeline: BusinessTimelineRepository;
}

export function createPostgresContainer(): RepositoryContainer {
  return {
    businesses: createPostgresBusinessRepository(),
    businessProfiles: createPostgresBusinessProfileRepository(),
    businessMri: createPostgresBusinessMriRepository(),
    businessDna: createPostgresBusinessDnaRepository(),
    businessHealth: createPostgresBusinessHealthRepository(),
    businessCapabilities: createPostgresBusinessCapabilityRepository(),
    businessTimeline: createPostgresBusinessTimelineRepository(),
  };
}

export function createInMemoryContainer(): RepositoryContainer {
  return {
    businesses: createInMemoryBusinessRepository(),
    businessProfiles: createInMemoryBusinessProfileRepository(),
    businessMri: createInMemoryBusinessMriRepository(),
    businessDna: createInMemoryBusinessDnaRepository(),
    businessHealth: createInMemoryBusinessHealthRepository(),
    businessCapabilities: createInMemoryBusinessCapabilityRepository(),
    businessTimeline: createInMemoryBusinessTimelineRepository(),
  };
}
