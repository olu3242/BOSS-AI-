import {
  createPostgresProviderEvidenceRepository,
  createInMemoryProviderEvidenceRepository,
  type ProviderEvidenceRepository,
  createPostgresSchedulerJobRepository,
  createInMemorySchedulerJobRepository,
  type SchedulerJobRepository,
  createPostgresBusinessDecisionRepository,
  createInMemoryBusinessDecisionRepository,
  type BusinessDecisionRepository,
  createPostgresBusinessScenarioRepository,
  createInMemoryBusinessScenarioRepository,
  type BusinessScenarioRepository,
  createPostgresEventLogRepository,
  createInMemoryEventLogRepository,
  type EventLogRepository,
  createPostgresKpiReadingRepository,
  createInMemoryKpiReadingRepository,
  type KpiReadingRepository,
  createPostgresBusinessGoalRepository,
  createInMemoryBusinessGoalRepository,
  type BusinessGoalRepository,
  createPostgresExecutiveBriefingRepository,
  createInMemoryExecutiveBriefingRepository,
  type ExecutiveBriefingRepository,
  createPostgresCustomerRepository,
  createPostgresCustomerInteractionRepository,
  createInMemoryCustomerRepository,
  createInMemoryCustomerInteractionRepository,
  type CustomerRepository,
  type CustomerInteractionRepository,
  createPostgresJobRepository,
  createInMemoryJobRepository,
  type JobRepository,
  createPostgresAppointmentRepository,
  createInMemoryAppointmentRepository,
  type AppointmentRepository,
  createPostgresInvoiceRepository,
  createInMemoryInvoiceRepository,
  type InvoiceRepository,
  createPostgresPaymentRepository,
  createInMemoryPaymentRepository,
  type PaymentRepository,
  createPostgresReviewRepository,
  createInMemoryReviewRepository,
  type ReviewRepository,
  createPostgresLeadRepository,
  createInMemoryLeadRepository,
  type LeadRepository,
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
  createPostgresMemoryRecordRepository,
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
  createInMemoryIntegrationAccountRepository,
  createInMemoryPermissionPolicyRepository,
  createInMemoryToolExecutionRepository,
  createInMemoryProviderHealthRepository,
  createInMemoryWorkflowExecutionRepository,
  createInMemoryTaskExecutionRepository,
  createInMemoryExecutionEventRepository,
  createInMemoryDeadLetterRepository,
  createInMemoryMemoryRecordRepository,
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
  type IntegrationAccountRepository,
  type PermissionPolicyRepository,
  type ToolExecutionRepository,
  type ProviderHealthRepository,
  type WorkflowExecutionRepository,
  type TaskExecutionRepository,
  type ExecutionEventRepository,
  type DeadLetterRepository,
  type MemoryRecordRepository,
  type BusinessDiagnosticRepository,
  type BusinessDiscoveryRepository,
  type BusinessGraphRepository,
} from "@boss/db";
import { createInMemoryEventBus, createDurableEventBus, type EventBus } from "@boss/events";
import { installGeneralSmbPack } from "@boss/industry-pack-general-smb";
import { createEnvSecretStore, createDbSecretStore, type SecretStore } from "./services/secretVault/index.js";

export interface RepositoryContainer {
  eventBus: EventBus;
  eventLog: EventLogRepository;
  secretStore: SecretStore;
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
  memoryRecords: MemoryRecordRepository;
  providerEvidence: ProviderEvidenceRepository;
  schedulerJobs: SchedulerJobRepository;
  businessDecisions: BusinessDecisionRepository;
  businessScenarios: BusinessScenarioRepository;
  businessDiagnostics: BusinessDiagnosticRepository;
  businessDiscovery: BusinessDiscoveryRepository;
  businessGraph: BusinessGraphRepository;
  kpiReadings: KpiReadingRepository;
  businessGoals: BusinessGoalRepository;
  executiveBriefings: ExecutiveBriefingRepository;
  customers: CustomerRepository;
  customerInteractions: CustomerInteractionRepository;
  jobs: JobRepository;
  appointments: AppointmentRepository;
  invoices: InvoiceRepository;
  payments: PaymentRepository;
  reviews: ReviewRepository;
  leads: LeadRepository;
}

export function createPostgresContainer(): RepositoryContainer {
  installGeneralSmbPack();
  const eventLog = createPostgresEventLogRepository();
  return {
    eventBus: createDurableEventBus(createInMemoryEventBus(), eventLog),
    eventLog,
    secretStore: process.env.BOSS_SECRET_VAULT_KEY ? createDbSecretStore() : createEnvSecretStore(),
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
    memoryRecords: createPostgresMemoryRecordRepository(),
    providerEvidence: createPostgresProviderEvidenceRepository(),
    schedulerJobs: createPostgresSchedulerJobRepository(),
    businessDecisions: createPostgresBusinessDecisionRepository(),
    businessScenarios: createPostgresBusinessScenarioRepository(),
    businessDiagnostics: createPostgresBusinessDiagnosticRepository(),
    businessDiscovery: createPostgresBusinessDiscoveryRepository(),
    businessGraph: createPostgresBusinessGraphRepository(),
    kpiReadings: createPostgresKpiReadingRepository(),
    businessGoals: createPostgresBusinessGoalRepository(),
    executiveBriefings: createPostgresExecutiveBriefingRepository(),
    customers: createPostgresCustomerRepository(),
    customerInteractions: createPostgresCustomerInteractionRepository(),
    jobs: createPostgresJobRepository(),
    appointments: createPostgresAppointmentRepository(),
    invoices: createPostgresInvoiceRepository(),
    payments: createPostgresPaymentRepository(),
    reviews: createPostgresReviewRepository(),
    leads: createPostgresLeadRepository(),
  };
}

export function createInMemoryContainer(): RepositoryContainer {
  installGeneralSmbPack();
  const businessConstraints = createInMemoryBusinessConstraintRepository();
  const businessRecommendations = createInMemoryBusinessRecommendationRepository();
  const eventLog = createInMemoryEventLogRepository();
  return {
    eventBus: createDurableEventBus(createInMemoryEventBus(), eventLog),
    eventLog,
    secretStore: createEnvSecretStore(),
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
    memoryRecords: createInMemoryMemoryRecordRepository(),
    providerEvidence: createInMemoryProviderEvidenceRepository(),
    schedulerJobs: createInMemorySchedulerJobRepository(),
    businessDecisions: createInMemoryBusinessDecisionRepository(),
    businessScenarios: createInMemoryBusinessScenarioRepository(),
    businessDiagnostics: createInMemoryBusinessDiagnosticRepository(),
    businessDiscovery: createInMemoryBusinessDiscoveryRepository(),
    businessGraph: createInMemoryBusinessGraphRepository(),
    kpiReadings: createInMemoryKpiReadingRepository(),
    businessGoals: createInMemoryBusinessGoalRepository(),
    executiveBriefings: createInMemoryExecutiveBriefingRepository(),
    customers: createInMemoryCustomerRepository(),
    customerInteractions: createInMemoryCustomerInteractionRepository(),
    jobs: createInMemoryJobRepository(),
    appointments: createInMemoryAppointmentRepository(),
    invoices: createInMemoryInvoiceRepository(),
    payments: createInMemoryPaymentRepository(),
    reviews: createInMemoryReviewRepository(),
    leads: createInMemoryLeadRepository(),
  };
}
