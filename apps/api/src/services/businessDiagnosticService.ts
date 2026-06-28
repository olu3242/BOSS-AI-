import { randomUUID } from "node:crypto";
import { createBossEvent, InMemoryEventBus, type EventBus } from "@boss/events";
import {
  DEFAULT_DIAGNOSTIC_WEIGHT_PROFILE,
  deriveBusinessDiagnostic,
} from "@boss/mcp";
import {
  InMemoryRuntimeTelemetry,
  type ExecutionContext,
  type RuntimeTelemetry,
} from "@boss/loop";
import { nowIso } from "@boss/shared";
import type {
  BusinessDiagnosticReport,
  DiagnosticWeightProfile,
} from "@boss/types";
import type { RepositoryContainer } from "../container.js";
import { createBusinessConstraintService } from "./businessConstraintService.js";
import { createBusinessRecommendationService } from "./businessRecommendationService.js";

export interface BusinessDiagnosticService {
  generate(
    orgId: string,
    businessId: string,
    businessMriId: string,
    context: ExecutionContext,
    weightProfile?: DiagnosticWeightProfile,
  ): Promise<BusinessDiagnosticReport>;
  getLatest(
    orgId: string,
    businessId: string,
  ): Promise<BusinessDiagnosticReport | null>;
  listVersions(
    orgId: string,
    businessId: string,
  ): Promise<readonly BusinessDiagnosticReport[]>;
}

export function createBusinessDiagnosticService(
  repos: RepositoryContainer,
  eventBus: EventBus = new InMemoryEventBus(),
  telemetry: RuntimeTelemetry = new InMemoryRuntimeTelemetry(),
): BusinessDiagnosticService {
  const constraints = createBusinessConstraintService(repos);
  const recommendations = createBusinessRecommendationService(repos);

  return {
    async generate(
      orgId,
      businessId,
      businessMriId,
      context,
      weightProfile = DEFAULT_DIAGNOSTIC_WEIGHT_PROFILE,
    ) {
      if (context.orgId !== orgId) {
        throw new Error("Diagnostic context does not match the requested organization.");
      }
      const business = await repos.businesses.findById(orgId, businessId);
      const mri = await repos.businessMri.findByBusinessId(orgId, businessId);
      if (!business || !mri || mri.id !== businessMriId || mri.status !== "completed") {
        throw new Error("A completed Business Discovery context is required.");
      }
      const health = await repos.businessHealth.findByBusinessId(orgId, businessId);
      const capabilities =
        await repos.businessCapabilities.listByBusinessId(orgId, businessId);
      if (!health || capabilities.length === 0) {
        throw new Error(
          "Business Health and capability assessments must exist before diagnosis.",
        );
      }

      const started = performance.now();
      const reportId = randomUUID();
      await eventBus.publish(
        createBossEvent(
          "business.diagnostic.started",
          { reportId, businessId, businessMriId },
          context,
        ),
      );

      let activeConstraints = (
        await constraints.list(orgId, businessId)
      ).filter((constraint) => constraint.status === "active");
      let constraintPriorities = await constraints.getPriorities(
        orgId,
        businessId,
      );
      if (activeConstraints.length === 0) {
        const analysis = await constraints.analyze(
          orgId,
          businessId,
          businessMriId,
        );
        activeConstraints = analysis.constraints;
        constraintPriorities = analysis.priorities;
      }

      let proposedRecommendations = (
        await recommendations.list(orgId, businessId)
      ).filter(
        (recommendation) =>
          recommendation.status === "proposed" ||
          recommendation.status === "approved",
      );
      let recommendationPriorities = await recommendations.getPriorities(
        orgId,
        businessId,
      );
      if (proposedRecommendations.length === 0) {
        const analysis = await recommendations.analyze(orgId, businessId);
        proposedRecommendations = analysis.recommendations;
        recommendationPriorities = analysis.priorities;
      }

      const healthDimensions = await repos.businessHealth.listDimensions(
        orgId,
        health.id,
      );
      const latest = await repos.businessDiagnostics.findLatest(
        orgId,
        businessId,
      );
      const generatedAt = nowIso();
      const report = deriveBusinessDiagnostic(
        {
          reportId,
          orgId,
          businessId,
          businessMriId,
          generatedAt,
          version: (latest?.version ?? 0) + 1,
          healthDimensions,
          capabilities,
          constraints: activeConstraints,
          constraintPriorities,
          recommendations: proposedRecommendations,
          recommendationPriorities,
        },
        weightProfile,
      );

      await eventBus.publish(
        createBossEvent(
          "business.diagnostic.analysis.completed",
          {
            reportId,
            businessId,
            areaCount: report.areaScores.length,
          },
          context,
        ),
      );
      for (const rootCause of report.rootCauses) {
        await eventBus.publish(
          createBossEvent(
            "business.diagnostic.root_cause.identified",
            {
              reportId,
              businessId,
              constraintId: rootCause.constraintId,
              kind: rootCause.kind,
            },
            context,
          ),
        );
      }

      await repos.businessDiagnostics.save(report);
      await repos.businessTimeline.append({
        orgId,
        businessId,
        type: "diagnostic_completed",
        description: `Business diagnostic version ${report.version} completed`,
        metadata: {
          reportId,
          overallHealth: report.overallHealth,
          rootCauseCount: report.rootCauses.length,
          opportunityCount: report.opportunities.length,
        },
        occurredAt: generatedAt,
      });
      await eventBus.publish(
        createBossEvent(
          "business.diagnostic.completed",
          {
            reportId,
            businessId,
            overallHealth: report.overallHealth,
            confidence: report.confidence,
          },
          context,
        ),
      );
      telemetry.metric(
        "diagnostic.duration",
        Math.max(0, Math.round(performance.now() - started)),
        "milliseconds",
        context,
        { weightProfileId: weightProfile.id },
      );
      telemetry.metric(
        "diagnostic.root_causes",
        report.rootCauses.length,
        "count",
        context,
      );
      telemetry.metric(
        "diagnostic.opportunities",
        report.opportunities.length,
        "count",
        context,
      );
      return report;
    },
    getLatest: (orgId, businessId) =>
      repos.businessDiagnostics.findLatest(orgId, businessId),
    listVersions: (orgId, businessId) =>
      repos.businessDiagnostics.listVersions(orgId, businessId),
  };
}
