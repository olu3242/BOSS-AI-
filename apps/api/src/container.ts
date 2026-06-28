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
  createPostgresBusinessRecommendationRepository,
  createPostgresRecommendationScoreRepository,
  createPostgresRecommendationPriorityRepository,
  createPostgresTransformationRoadmapRepository,
  createPostgresBusinessDiagnosticRepository,
  createPostgresBusinessDiscoveryRepository,
  createPostgresBusinessGraphRepository,
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
  createInMemoryBusinessRecommendationRepository,
  createInMemoryRecommendationScoreRepository,
  createInMemoryRecommendationPriorityRepository,
  createInMemoryTransformationRoadmapRepository,
  createInMemoryBusinessDiagnosticRepository,
  createInMemoryBusinessDiscoveryRepository,
  createInMemoryBusinessGraphRepository,
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
  type BusinessRecommendationRepository,
  type RecommendationScoreRepository,
  type RecommendationPriorityRepository,
  type TransformationRoadmapRepository,
  type BusinessDiagnosticRepository,
  type BusinessDiscoveryRepository,
  type BusinessGraphRepository,
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
  businessRecommendations: BusinessRecommendationRepository;
  recommendationScores: RecommendationScoreRepository;
  recommendationPriorities: RecommendationPriorityRepository;
  transformationRoadmaps: TransformationRoadmapRepository;
  businessDiagnostics: BusinessDiagnosticRepository;
  businessDiscovery: BusinessDiscoveryRepository;
  businessGraph: BusinessGraphRepository;
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
    businessRecommendations: createPostgresBusinessRecommendationRepository(),
    recommendationScores: createPostgresRecommendationScoreRepository(),
    recommendationPriorities: createPostgresRecommendationPriorityRepository(),
    transformationRoadmaps: createPostgresTransformationRoadmapRepository(),
    businessDiagnostics: createPostgresBusinessDiagnosticRepository(),
    businessDiscovery: createPostgresBusinessDiscoveryRepository(),
    businessGraph: createPostgresBusinessGraphRepository(),
  };
}

export function createInMemoryContainer(): RepositoryContainer {
  installGeneralSmbPack();
  const businessConstraints = createInMemoryBusinessConstraintRepository();
  const businessRecommendations = createInMemoryBusinessRecommendationRepository();
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
    businessRecommendations,
    recommendationScores: createInMemoryRecommendationScoreRepository(),
    recommendationPriorities: createInMemoryRecommendationPriorityRepository(businessRecommendations),
    transformationRoadmaps: createInMemoryTransformationRoadmapRepository(),
    businessDiagnostics: createInMemoryBusinessDiagnosticRepository(),
    businessDiscovery: createInMemoryBusinessDiscoveryRepository(),
    businessGraph: createInMemoryBusinessGraphRepository(),
  };
}
