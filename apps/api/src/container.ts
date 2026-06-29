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
  createPostgresIntegrationAccountRepository,
  createPostgresPermissionPolicyRepository,
  createPostgresToolExecutionRepository,
  createPostgresProviderHealthRepository,
  createPostgresWorkflowExecutionRepository,
  createPostgresTaskExecutionRepository,
  createPostgresExecutionEventRepository,
  createPostgresDeadLetterRepository,
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
  createInMemoryIntegrationAccountRepository,
  createInMemoryPermissionPolicyRepository,
  createInMemoryToolExecutionRepository,
  createInMemoryProviderHealthRepository,
  createInMemoryWorkflowExecutionRepository,
  createInMemoryTaskExecutionRepository,
  createInMemoryExecutionEventRepository,
  createInMemoryDeadLetterRepository,
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
  type IntegrationAccountRepository,
  type PermissionPolicyRepository,
  type ToolExecutionRepository,
  type ProviderHealthRepository,
  type WorkflowExecutionRepository,
  type TaskExecutionRepository,
  type ExecutionEventRepository,
  type DeadLetterRepository,
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
  integrationAccounts: IntegrationAccountRepository;
  permissionPolicies: PermissionPolicyRepository;
  toolExecutions: ToolExecutionRepository;
  providerHealth: ProviderHealthRepository;
  workflowExecutions: WorkflowExecutionRepository;
  taskExecutions: TaskExecutionRepository;
  executionEvents: ExecutionEventRepository;
  deadLetters: DeadLetterRepository;
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
    integrationAccounts: createPostgresIntegrationAccountRepository(),
    permissionPolicies: createPostgresPermissionPolicyRepository(),
    toolExecutions: createPostgresToolExecutionRepository(),
    providerHealth: createPostgresProviderHealthRepository(),
    workflowExecutions: createPostgresWorkflowExecutionRepository(),
    taskExecutions: createPostgresTaskExecutionRepository(),
    executionEvents: createPostgresExecutionEventRepository(),
    deadLetters: createPostgresDeadLetterRepository(),
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
    integrationAccounts: createInMemoryIntegrationAccountRepository(),
    permissionPolicies: createInMemoryPermissionPolicyRepository(),
    toolExecutions: createInMemoryToolExecutionRepository(),
    providerHealth: createInMemoryProviderHealthRepository(),
    workflowExecutions: createInMemoryWorkflowExecutionRepository(),
    taskExecutions: createInMemoryTaskExecutionRepository(),
    executionEvents: createInMemoryExecutionEventRepository(),
    deadLetters: createInMemoryDeadLetterRepository(),
  };
}
