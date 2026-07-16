import { createInMemoryContainer, createPostgresContainer, type RepositoryContainer } from "./container.js";
import { createBusinessProfileService } from "./services/businessProfileService.js";
import { createBusinessMriService } from "./services/businessMriService.js";
import { createBusinessDnaService } from "./services/businessDnaService.js";
import { createBusinessHealthService } from "./services/businessHealthService.js";
import { createBusinessCapabilityService } from "./services/businessCapabilityService.js";
import { createBusinessTimelineService } from "./services/businessTimelineService.js";
import { createBusinessConstraintService } from "./services/businessConstraintService.js";
import { createBusinessRecommendationService } from "./services/businessRecommendationService.js";
import { createToolFabricService } from "./services/toolFabricService.js";
import { createLoopRuntimeService } from "./services/loopRuntimeService.js";
import { createWorkflowGenerationService } from "./services/workflowGenerationService.js";
import { createMissionControlService } from "./services/missionControlService.js";
import { createBusinessDiagnosticService } from "./services/businessDiagnosticService.js";
import {
  createBusinessContextService,
  type BusinessContextService,
} from "./services/businessContextService.js";
import {
  createBusinessGraphService,
  type BusinessGraphService,
} from "./services/businessGraphService.js";
import {
  createGraphRuntime,
  type GraphRuntime,
} from "./services/businessGraphRuntime.js";
import {
  ContextResolutionService,
  createBusinessSemanticLayer,
  DependencyResolutionService,
  type BusinessSemanticLayer,
} from "./services/businessSemanticLayer.js";
import {
  createBusinessQueryService,
  type BusinessQueryService,
} from "./services/businessQueryService.js";
import { createBusinessController } from "./controllers/businessController.js";
import { createBusinessMriController } from "./controllers/businessMriController.js";
import { createBusinessDnaController } from "./controllers/businessDnaController.js";
import { createBusinessHealthController } from "./controllers/businessHealthController.js";
import { createBusinessCapabilityController } from "./controllers/businessCapabilityController.js";
import { createBusinessTimelineController } from "./controllers/businessTimelineController.js";
import { createBusinessConstraintController } from "./controllers/businessConstraintController.js";
import { createBusinessRecommendationController } from "./controllers/businessRecommendationController.js";
import { createToolFabricController } from "./controllers/toolFabricController.js";
import { createMissionControlController } from "./controllers/missionControlController.js";
import { createBusinessDiagnosticController } from "./controllers/businessDiagnosticController.js";
import { createObservabilityService } from "./services/observabilityService.js";
import { createAlertingService } from "./services/alertingService.js";
import { createMultiAgentRuntimeService } from "./services/multiAgentRuntimeService.js";
import { createBusinessDecisionService } from "./services/businessDecisionService.js";
import { createScenarioService } from "./services/scenarioService.js";
import { createKpiMeasurementService } from "./services/kpiMeasurementService.js";
import { createBusinessGoalService } from "./services/businessGoalService.js";
import { createExecutiveBriefingService } from "./services/executiveBriefingService.js";
import { createRootCauseService } from "./services/rootCauseService.js";
import { createExecutionPlanService } from "./services/executionPlanService.js";
import { createOutcomeVerificationService } from "./services/outcomeVerificationService.js";
import { createBusinessOperatingLoopService } from "./services/businessOperatingLoopService.js";
import { installLifecycleChain } from "./services/lifecycleChainService.js";
import { createWorkspaceService } from "./services/workspaceService.js";
import { createFeatureFlagService } from "./services/featureFlagService.js";
import { createSupportService } from "./services/supportService.js";
import { createProductAnalyticsService } from "./services/productAnalyticsService.js";
import { createCustomerHealthService } from "./services/customerHealthService.js";
import { createBetaInviteService } from "./services/betaInviteService.js";
import { createMarketplaceService } from "./services/marketplaceService.js";
import { createSchedulerService } from "./services/schedulerService.js";
import { createBteService } from "./services/bteService.js";
import { createAiWorkforceService } from "./services/aiWorkforceService.js";
import { createAiEmployeeExecutionService } from "./services/aiEmployeeExecutionService.js";
import { createOrgHealthService } from "./services/orgHealthService.js";
import { createInsightService } from "./services/insightService.js";
import { createCustomerService } from "./services/customerService.js";
import { createCustomerController } from "./controllers/customerController.js";
import { createJobService } from "./services/jobService.js";
import { createJobController } from "./controllers/jobController.js";
import { createAppointmentService } from "./services/appointmentService.js";
import { createAppointmentController } from "./controllers/appointmentController.js";
import { createInvoiceService } from "./services/invoiceService.js";
import { createInvoiceController } from "./controllers/invoiceController.js";
import { createPaymentService } from "./services/paymentService.js";
import { createPaymentController } from "./controllers/paymentController.js";
import { createReviewService } from "./services/reviewService.js";
import { createReviewController } from "./controllers/reviewController.js";
import { createLeadService } from "./services/leadService.js";
import { createLeadController } from "./controllers/leadController.js";
import { createStaffService } from "./services/staffService.js";
import { createStaffController } from "./controllers/staffController.js";
import { createOpportunityService } from "./services/opportunityService.js";
import { createOpportunityController } from "./controllers/opportunityController.js";
import { createConversationService } from "./services/conversationService.js";
import { createConversationController } from "./controllers/conversationController.js";
import { createTaskService } from "./services/taskService.js";
import { createTaskController } from "./controllers/taskController.js";
import { createDocumentService } from "./services/documentService.js";
import { createDocumentController } from "./controllers/documentController.js";
import { createEstimateService } from "./services/estimateService.js";
import { createEstimateController } from "./controllers/estimateController.js";
import { createWorkflowService } from "./services/workflowService.js";
import { createWorkflowController } from "./controllers/workflowController.js";
import { createWorkflowRunService } from "./services/workflowRunService.js";
import { createWorkflowRunController } from "./controllers/workflowRunController.js";
import { createWorkflowExecutionService } from "./services/workflowExecutionService.js";
import { createWorkflowExecutionController } from "./controllers/workflowExecutionController.js";
import { createLifecyclePolicyService } from "./services/lifecyclePolicyService.js";
import { createLifecyclePolicyController } from "./controllers/lifecyclePolicyController.js";
import { createPolicyEngineService } from "./services/policyEngineService.js";
import { createNotificationService } from "./services/notificationService.js";
import { createSearchService } from "./services/searchService.js";
import { createCommunicationService } from "./services/communicationService.js";
import { createPlatformSdk } from "./services/platformSdk.js";
import { createAnalyticsService } from "./services/analyticsService.js";
import { createAnalyticsController } from "./controllers/analyticsController.js";
import { createBusinessObjectiveService } from "./services/businessObjectiveService.js";
import { createKpiPlatformService } from "./services/kpiPlatformService.js";
import { createDecisionEngineService } from "./services/decisionEngineService.js";
import { createLearningPlatformService } from "./services/learningPlatformService.js";
import { createPricingEngineService } from "./services/pricingEngineService.js";
import { createCollectionsService } from "./services/collectionsService.js";
import { createRevenueIntelligenceService } from "./services/revenueIntelligenceService.js";
import { createRevenueCommunicationService } from "./services/revenueCommunicationService.js";
import { createRevenueAiService } from "./services/revenueAiService.js";
import { createRevenueDashboardService } from "./services/revenueDashboardService.js";

import { InMemoryEventBus } from "@boss/events";
import { InMemoryAuditSink, PostgresAuditSink } from "./observability.js";
import { JournaledEventBus, PostgresEventJournal } from "./runtimePersistence.js";

export function createApiFromContainer(
  repos: RepositoryContainer,
  businessContext: BusinessContextService = createBusinessContextService(repos),
  businessGraph: BusinessGraphService = createBusinessGraphService(
    repos,
    businessContext,
  ),
  graphRuntime: GraphRuntime = createGraphRuntime(businessGraph),
  businessSemantic: BusinessSemanticLayer = createBusinessSemanticLayer(
    graphRuntime,
    businessContext,
  ),
  businessQueries: BusinessQueryService = createBusinessQueryService(
    businessSemantic,
  ),
) {
  const toolFabric = createToolFabricService(repos);
  const loopRuntime = createLoopRuntimeService(repos, toolFabric);
  const workflowGeneration = createWorkflowGenerationService(repos, loopRuntime);
  const observability = createObservabilityService();

  // ── Search Platform ────────────────────────────────────────────────────────
  const search = createSearchService(repos.eventBus);
  // Register all searchable entities
  search.register("customer",     (o, b) => repos.customers.listByBusinessId(o, b) as unknown as Promise<Record<string, unknown>[]>,
    { defaultSearchFields: ["name", "email", "phone"], defaultSort: [{ field: "name", direction: "asc" }] });
  search.register("lead",         (o, b) => repos.leads.listByBusinessId(o, b) as unknown as Promise<Record<string, unknown>[]>,
    { defaultSearchFields: ["name", "email", "phone", "source"], defaultSort: [{ field: "createdAt", direction: "desc" }] });
  search.register("opportunity",  (o, b) => repos.opportunities.listByBusinessId(o, b) as unknown as Promise<Record<string, unknown>[]>,
    { defaultSearchFields: ["title"], defaultSort: [{ field: "createdAt", direction: "desc" }], facetFields: ["status"] });
  search.register("estimate",     (o, b) => repos.estimates.listByBusinessId(o, b) as unknown as Promise<Record<string, unknown>[]>,
    { defaultSearchFields: ["title"], defaultSort: [{ field: "createdAt", direction: "desc" }], facetFields: ["status"] });
  search.register("appointment",  (o, b) => repos.appointments.listByBusiness(o, b) as unknown as Promise<Record<string, unknown>[]>,
    { defaultSearchFields: ["title", "location"], defaultSort: [{ field: "scheduledAt", direction: "asc" }], facetFields: ["status"] });
  search.register("job",          (o, b) => repos.jobs.listByBusiness(o, b) as unknown as Promise<Record<string, unknown>[]>,
    { defaultSearchFields: ["title", "description"], defaultSort: [{ field: "createdAt", direction: "desc" }], facetFields: ["status"] });
  search.register("invoice",      (o, b) => repos.invoices.listByBusiness(o, b) as unknown as Promise<Record<string, unknown>[]>,
    { defaultSearchFields: ["title"], defaultSort: [{ field: "createdAt", direction: "desc" }], facetFields: ["status"] });
  search.register("payment",      (o, b) => repos.payments.listByBusiness(o, b) as unknown as Promise<Record<string, unknown>[]>,
    { defaultSearchFields: ["method", "reference"], defaultSort: [{ field: "createdAt", direction: "desc" }] });
  search.register("document",     (o, b) => repos.documents.listByBusinessId(o, b) as unknown as Promise<Record<string, unknown>[]>,
    { defaultSearchFields: ["title", "type"], defaultSort: [{ field: "createdAt", direction: "desc" }], facetFields: ["type"] });
  search.register("conversation", (o, b) => repos.conversations.listByBusinessId(o, b) as unknown as Promise<Record<string, unknown>[]>,
    { defaultSearchFields: ["subject", "channel"], defaultSort: [{ field: "createdAt", direction: "desc" }], facetFields: ["channel", "status"] });
  search.register("workflow",     (o, b) => repos.workflows.listByBusinessId(o, b) as unknown as Promise<Record<string, unknown>[]>,
    { defaultSearchFields: ["name", "description"], defaultSort: [{ field: "createdAt", direction: "desc" }], facetFields: ["status"] });
  search.register("workflow_run", (o, b) => repos.workflowRuns.listByBusinessId(o, b) as unknown as Promise<Record<string, unknown>[]>,
    { defaultSort: [{ field: "createdAt", direction: "desc" }], facetFields: ["status"] });
  search.register("task",         (o, b) => repos.tasks.listByBusinessId(o, b) as unknown as Promise<Record<string, unknown>[]>,
    { defaultSearchFields: ["title", "description"], defaultSort: [{ field: "createdAt", direction: "desc" }], facetFields: ["status", "priority"] });
  search.register("staff",        (o, b) => repos.staff.listByBusinessId(o, b) as unknown as Promise<Record<string, unknown>[]>,
    { defaultSearchFields: ["name", "role", "email"], defaultSort: [{ field: "name", direction: "asc" }] });

  // ── Communication Platform ─────────────────────────────────────────────────
  const notification = createNotificationService(repos);
  const communication = createCommunicationService(notification, repos.eventBus);
  observability.attachToEventBus(repos);
  const alerting = createAlertingService();
  alerting.attachToEventBus(repos.eventBus);
  const multiAgentRuntime = createMultiAgentRuntimeService(repos, loopRuntime);
  const businessDecision = createBusinessDecisionService(repos);
  const scenario = createScenarioService(repos);

  repos.eventBus.subscribe<{ orgId: string; businessId: string; recommendationId: string }>(
    "business.recommendation.approved",
    (event) => {
      void workflowGeneration.generateAndExecute(
        event.payload.orgId,
        event.payload.businessId,
        event.payload.recommendationId,
      );
    },
  );

  const kpiMeasurement = createKpiMeasurementService(repos);
  const kpiPlatform = createKpiPlatformService(repos, repos.eventBus);
  const businessObjective = createBusinessObjectiveService(repos.eventBus);
  const rootCause = createRootCauseService(repos);
  const businessRecommendation = createBusinessRecommendationService(repos);
  const decisionEngine = createDecisionEngineService(repos, repos.eventBus, kpiPlatform, businessRecommendation, rootCause, scenario);
  const learningPlatform = createLearningPlatformService(repos.eventBus);
  const businessGoal = createBusinessGoalService(repos);
  const executiveBriefing = createExecutiveBriefingService(repos);
  const executionPlan = createExecutionPlanService(repos);
  const outcomeVerification = createOutcomeVerificationService(repos);
  const businessOperatingLoop = createBusinessOperatingLoopService(repos);
  const workspace = createWorkspaceService(repos);
  const featureFlags = createFeatureFlagService();
  const support = createSupportService(repos);
  const productAnalytics = createProductAnalyticsService(repos);
  const customerHealth = createCustomerHealthService(repos);
  const betaInvite = createBetaInviteService(repos);
  const marketplace = createMarketplaceService(repos);
  const workflowStepRegistry = new Map();
  const scheduler = createSchedulerService(repos, loopRuntime, workflowStepRegistry);
  const bte = createBteService(repos, businessOperatingLoop, scheduler);
  const aiWorkforce = createAiWorkforceService(repos);
  const aiEmployeeExecution = createAiEmployeeExecutionService(repos);
  const orgHealth = createOrgHealthService(repos, bte, aiWorkforce);
  const insight = createInsightService(repos);

  repos.eventBus.subscribe<{ orgId: string; businessId: string; industry?: string; employeeCount?: number }>(
    "business.created",
    (e) => {
      void bte.scheduleDailyCycle(e.payload.orgId, e.payload.businessId);
    },
  );

  repos.eventBus.subscribe<{ orgId: string; businessId: string; industry?: string; employeeCount?: number }>(
    "business.created",
    (e) => {
      void productAnalytics.track({
        type: "analytics.business.created",
        orgId: e.payload.orgId,
        businessId: e.payload.businessId,
        properties: { industry: e.payload.industry ?? null, employeeCount: e.payload.employeeCount ?? null },
      });
    },
  );

  repos.eventBus.subscribe<{ orgId: string; businessId: string; businessMriId: string }>(
    "business.mri.completed",
    (e) => {
      void productAnalytics.track({
        type: "analytics.mri.completed",
        orgId: e.payload.orgId,
        businessId: e.payload.businessId,
        properties: { mriId: e.payload.businessMriId },
      });
    },
  );

  repos.eventBus.subscribe<{ orgId: string; businessId: string; decisionId: string; decisionType?: string; confidenceScore?: number }>(
    "decision.approved",
    (e) => {
      void productAnalytics.track({
        type: "analytics.recommendation.accepted",
        orgId: e.payload.orgId,
        businessId: e.payload.businessId,
        properties: { decisionId: e.payload.decisionId, decisionType: e.payload.decisionType ?? null, confidenceScore: e.payload.confidenceScore ?? null },
      });
    },
  );

  repos.eventBus.subscribe<{ orgId: string; businessId: string; decisionId: string }>(
    "decision.rejected",
    (e) => {
      void productAnalytics.track({
        type: "analytics.recommendation.rejected",
        orgId: e.payload.orgId,
        businessId: e.payload.businessId,
        properties: { decisionId: e.payload.decisionId },
      });
    },
  );

  repos.eventBus.subscribe<{ orgId: string; feedbackId: string }>(
    "support.feedback.submitted",
    (e) => {
      void productAnalytics.track({
        type: "analytics.feedback.submitted",
        orgId: e.payload.orgId,
        properties: { feedbackId: e.payload.feedbackId },
      });
    },
  );

  graphRuntime.start();
  installLifecycleChain(repos);

  // ── Wave 2 Revenue OS services ────────────────────────────────────────────
  const pricingEngine = createPricingEngineService(repos.eventBus);
  const invoiceServiceInstance = createInvoiceService(repos);
  const collectionsServiceInstance = createCollectionsService(repos, invoiceServiceInstance, repos.eventBus);
  const revenueIntelligence = createRevenueIntelligenceService(repos, repos.eventBus);
  const revenueCommunication = createRevenueCommunicationService(notification, repos.eventBus);
  const revenueAi = createRevenueAiService(repos, revenueIntelligence, collectionsServiceInstance);
  const revenueDashboard = createRevenueDashboardService(repos, revenueIntelligence, collectionsServiceInstance);

  // ── Wave 2: Revenue Communication event subscriptions ────────────────────
  repos.eventBus.subscribe<{ orgId: string; businessId: string; invoiceId: string }>(
    "invoice.sent",
    (e) => {
      void revenueCommunication.sendInvoiceEmail(e.payload.orgId, e.payload.businessId, e.payload.invoiceId);
    },
  );

  repos.eventBus.subscribe<{ orgId: string; businessId: string; paymentId: string }>(
    "payment.received",
    (e) => {
      void revenueCommunication.sendPaymentReceipt(e.payload.orgId, e.payload.businessId, e.payload.paymentId);
    },
  );

  repos.eventBus.subscribe<{ orgId: string; businessId: string; invoiceId: string }>(
    "invoice.overdue",
    (e) => {
      void revenueCommunication.sendPaymentReminder(e.payload.orgId, e.payload.businessId, e.payload.invoiceId);
    },
  );

  repos.eventBus.subscribe<{ orgId: string; businessId: string; caseId: string }>(
    "collections.reminder.sent",
    (e) => {
      void revenueCommunication.sendCollectionsReminder(e.payload.orgId, e.payload.businessId, e.payload.caseId);
    },
  );

  // ── Event Bus → Workflow triggers (Phase 3 — Event Bus Completion) ──────────
  // job.completed → auto-invoice + analytics
  repos.eventBus.subscribe<{ orgId: string; businessId: string; jobId: string; customerId: string }>(
    "job.completed",
    async (e) => {
      void productAnalytics.track({
        type: "analytics.job.completed",
        orgId: e.payload.orgId,
        businessId: e.payload.businessId,
        properties: { jobId: e.payload.jobId },
      });

      // Auto-create a draft invoice when a job completes (if customer is present)
      if (e.payload.customerId) {
        try {
          const job = await repos.jobs.findById(e.payload.orgId, e.payload.jobId);
          if (job && !job.deletedAt) {
            await invoiceServiceInstance.createInvoice(e.payload.orgId, e.payload.businessId, {
              customerId: e.payload.customerId,
              jobId: job.id,
              lineItems: [{ description: job.title, quantity: 1, unitPriceCents: 0 }],
              notes: `Auto-generated draft invoice for completed job: ${job.title}`,
            });
          }
        } catch { /* invoice creation is best-effort; job data may be incomplete */ }
      }
    },
  );

  // customer.created → WF-012 (Customer Onboarding)
  repos.eventBus.subscribe<{ orgId: string; businessId: string; customerId: string }>(
    "customer.created",
    (e) => {
      void productAnalytics.track({
        type: "analytics.customer.created",
        orgId: e.payload.orgId,
        businessId: e.payload.businessId,
        properties: { customerId: e.payload.customerId },
      });
    },
  );

  // payment.received → WF-007 (Receipt Confirmation)
  repos.eventBus.subscribe<{ orgId: string; businessId: string; paymentId: string }>(
    "payment.received",
    (e) => {
      void productAnalytics.track({
        type: "analytics.payment.received",
        orgId: e.payload.orgId,
        businessId: e.payload.businessId,
        properties: { paymentId: e.payload.paymentId },
      });
    },
  );

  // lead.created → WF-001 (Lead Follow-Up Recovery)
  repos.eventBus.subscribe<{ orgId: string; businessId: string; leadId: string; source: string }>(
    "lead.created",
    (e) => {
      void productAnalytics.track({
        type: "analytics.lead.created",
        orgId: e.payload.orgId,
        businessId: e.payload.businessId,
        properties: { leadId: e.payload.leadId, source: e.payload.source },
      });
    },
  );

  // lead.converted → analytics + KPI
  repos.eventBus.subscribe<{ orgId: string; businessId: string; leadId: string }>(
    "lead.converted",
    (e) => {
      void productAnalytics.track({
        type: "analytics.lead.converted",
        orgId: e.payload.orgId,
        businessId: e.payload.businessId,
        properties: { leadId: e.payload.leadId },
      });
    },
  );

  // appointment.no_show → WF-013 (No-Show Recovery)
  repos.eventBus.subscribe<{ orgId: string; businessId: string; appointmentId: string }>(
    "appointment.no_show",
    (e) => {
      void productAnalytics.track({
        type: "analytics.appointment.no_show",
        orgId: e.payload.orgId,
        businessId: e.payload.businessId,
        properties: { appointmentId: e.payload.appointmentId },
      });
    },
  );

  // review.received → analytics
  repos.eventBus.subscribe<{ orgId: string; businessId: string; reviewId: string; rating: number }>(
    "review.received",
    (e) => {
      void productAnalytics.track({
        type: "analytics.review.received",
        orgId: e.payload.orgId,
        businessId: e.payload.businessId,
        properties: { reviewId: e.payload.reviewId, rating: e.payload.rating },
      });
    },
  );

  return {
    business: createBusinessController(createBusinessProfileService(repos)),
    businessMri: createBusinessMriController(createBusinessMriService(repos)),
    businessDna: createBusinessDnaController(createBusinessDnaService(repos)),
    businessHealth: createBusinessHealthController(createBusinessHealthService(repos)),
    businessCapability: createBusinessCapabilityController(createBusinessCapabilityService(repos)),
    businessTimeline: createBusinessTimelineController(createBusinessTimelineService(repos)),
    businessConstraint: createBusinessConstraintController(createBusinessConstraintService(repos)),
    businessRecommendation: createBusinessRecommendationController(businessRecommendation),
    toolFabric: createToolFabricController(toolFabric),
    loopRuntime,
    workflowGeneration,
    missionControl: createMissionControlController(createMissionControlService(repos)),
    observability,
    alerting,
    multiAgentRuntime,
    businessDecision,
    scenario,
    kpiMeasurement,
    businessGoal,
    executiveBriefing,
    rootCause,
    executionPlan,
    outcomeVerification,
    businessOperatingLoop,
    workspace,
    featureFlags,
    support,
    productAnalytics,
    customerHealth,
    betaInvite,
    marketplace,
    scheduler,
    bte,
    aiWorkforce,
    aiEmployeeExecution,
    orgHealth,
    insight,
    kpiPlatform,
    businessObjective,
    decisionEngine,
    learningPlatform,
    customer: createCustomerController(createCustomerService(repos)),
    job: createJobController(createJobService(repos)),
    appointment: createAppointmentController(createAppointmentService(repos)),
    invoice: createInvoiceController(invoiceServiceInstance),
    payment: createPaymentController(createPaymentService(repos)),
    review: createReviewController(createReviewService(repos)),
    lead: createLeadController(createLeadService(repos)),
    staff: createStaffController(createStaffService(repos)),
    opportunity: createOpportunityController(createOpportunityService(repos)),
    conversation: createConversationController(createConversationService(repos)),
    task: createTaskController(createTaskService(repos)),
    document: createDocumentController(createDocumentService(repos)),
    estimate: createEstimateController(createEstimateService(repos)),
    pricingEngine,
    collections: collectionsServiceInstance,
    revenueIntelligence,
    revenueCommunication,
    revenueAi,
    revenueDashboard,
    workflow: createWorkflowController(createWorkflowService(repos.workflows)),
    workflowRun: createWorkflowRunController(createWorkflowRunService(repos.workflowRuns)),
    workflowExecution: createWorkflowExecutionController(
      createWorkflowExecutionService(repos.workflowExecutions, repos.taskExecutions, repos.deadLetters, loopRuntime)
    ),
    lifecyclePolicy: createLifecyclePolicyController(createLifecyclePolicyService(repos.lifecyclePolicies)),
    policyEngine: createPolicyEngineService(repos.lifecyclePolicies, repos.workflows, repos.workflowRuns, repos.eventBus),
    notification,
    search,
    communication,
    platformSdk: createPlatformSdk(repos, loopRuntime),
    analytics: createAnalyticsController(createAnalyticsService(repos)),
    businessDiagnostic: createBusinessDiagnosticController(createBusinessDiagnosticService(repos)),
    businessContext,
    businessGraph,
    graphRuntime,
    businessSemantic,
    contextResolution: new ContextResolutionService(businessSemantic),
    dependencyResolution: new DependencyResolutionService(businessSemantic),
    businessQueries,
  };
}

export type BossApi = ReturnType<typeof createApiFromContainer>;

export function createInMemoryApi(): BossApi {
  const repos = createInMemoryContainer();
  const eventBus = new InMemoryEventBus();
  const auditSink = new InMemoryAuditSink();
  const businessContext = createBusinessContextService(
    repos,
    eventBus,
    auditSink,
  );
  const businessGraph = createBusinessGraphService(
    repos,
    businessContext,
    eventBus,
    auditSink,
  );
  const graphRuntime = createGraphRuntime(businessGraph, eventBus);
  const businessSemantic = createBusinessSemanticLayer(
    graphRuntime,
    businessContext,
    eventBus,
    auditSink,
  );
  const businessQueries = createBusinessQueryService(
    businessSemantic,
    eventBus,
    auditSink,
  );
  return createApiFromContainer(
    repos,
    businessContext,
    businessGraph,
    graphRuntime,
    businessSemantic,
    businessQueries,
  );
}

export function createApi(): BossApi {
  const repos = createPostgresContainer();
  const eventBus = new JournaledEventBus(
    new InMemoryEventBus(),
    new PostgresEventJournal(),
  );
  const auditSink = new PostgresAuditSink();
  const businessContext = createBusinessContextService(
    repos,
    eventBus,
    auditSink,
  );
  const businessGraph = createBusinessGraphService(
    repos,
    businessContext,
    eventBus,
    auditSink,
  );
  const graphRuntime = createGraphRuntime(businessGraph, eventBus);
  const businessSemantic = createBusinessSemanticLayer(
    graphRuntime,
    businessContext,
    eventBus,
    auditSink,
  );
  const businessQueries = createBusinessQueryService(
    businessSemantic,
    eventBus,
    auditSink,
  );
  return createApiFromContainer(
    repos,
    businessContext,
    businessGraph,
    graphRuntime,
    businessSemantic,
    businessQueries,
  );
}

export * from "./container.js";
export * from "./services/businessProfileService.js";
export * from "./services/businessMriService.js";
export * from "./services/businessDnaService.js";
export * from "./services/businessHealthService.js";
export * from "./services/businessCapabilityService.js";
export * from "./services/businessTimelineService.js";
export * from "./services/businessConstraintService.js";
export * from "./services/businessRecommendationService.js";
export * from "./services/toolFabricService.js";
export * from "./services/loopRuntimeService.js";
export * from "./services/workflowGenerationService.js";
export * from "./services/marketplaceService.js";
export * from "./services/missionControlService.js";
export * from "./services/observabilityService.js";
export * from "./services/multiAgentRuntimeService.js";
export * from "./services/businessDecisionService.js";
export * from "./services/scenarioService.js";
export * from "./services/kpiMeasurementService.js";
export * from "./services/businessGoalService.js";
export * from "./services/executiveBriefingService.js";
export * from "./services/rootCauseService.js";
export * from "./services/executionPlanService.js";
export * from "./services/outcomeVerificationService.js";
export * from "./services/businessOperatingLoopService.js";
export * from "./services/workspaceService.js";
export * from "./services/featureFlagService.js";
export * from "./services/supportService.js";
export * from "./services/productAnalyticsService.js";
export * from "./services/customerHealthService.js";
export * from "./services/betaInviteService.js";
export * from "./services/schedulerService.js";
export * from "./services/bteService.js";
export * from "./services/aiWorkforceService.js";
export * from "./services/orgHealthService.js";
export * from "./services/insightService.js";
export * from "./services/customerService.js";
export * from "./services/leadService.js";
export * from "./services/notificationService.js";
export * from "./services/platformSdk.js";
export * from "./services/jobService.js";
export * from "./services/appointmentService.js";
export * from "./services/invoiceService.js";
export * from "./services/businessDiagnosticService.js";
export * from "./controllers/businessDiagnosticController.js";
export * from "./security.js";
export * from "./observability.js";
export * from "./health.js";
export * from "./platformAdministration.js";
export * from "./identity.js";
export * from "./supabaseIdentityProvider.js";
export * from "./runtimePersistence.js";
export * from "./mvpJourney.js";
export * from "./organization.js";
export * from "./services/businessContextService.js";
export * from "./services/businessGraphService.js";
export * from "./services/businessGraphRuntime.js";
export * from "./services/businessSemanticLayer.js";
export * from "./services/businessQueryService.js";
export * from "./businessContextRuntime.js";
export * from "./services/staffService.js";
export * from "./services/opportunityService.js";
export * from "./services/conversationService.js";
export * from "./services/taskService.js";
export * from "./services/documentService.js";
export * from "./services/estimateService.js";

export * from "./services/workflowService.js";
export * from "./services/workflowRunService.js";
export * from "./services/lifecyclePolicyService.js";
export * from "./services/policyEngineService.js";
export * from "./services/lifecycleChainService.js";

export * from "./services/searchService.js";
export * from "./services/communicationService.js";
export * from "./services/pricingEngineService.js";
export * from "./services/collectionsService.js";
export * from "./services/revenueIntelligenceService.js";
export * from "./services/revenueCommunicationService.js";
export * from "./services/revenueAiService.js";
export * from "./services/revenueDashboardService.js";
