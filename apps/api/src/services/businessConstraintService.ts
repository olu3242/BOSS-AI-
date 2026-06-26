import { nowIso } from "@boss/shared";
import { detectConstraints, prioritizeConstraints } from "@boss/mcp";
import type { BusinessConstraint, ConstraintPriority, ConstraintScore } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface ConstraintAnalysisResult {
  constraints: BusinessConstraint[];
  scores: ConstraintScore[];
  priorities: ConstraintPriority[];
}

export interface BusinessConstraintService {
  analyze(orgId: string, businessId: string, businessMriId: string): Promise<ConstraintAnalysisResult>;
  list(orgId: string, businessId: string): Promise<BusinessConstraint[]>;
  getPriorities(orgId: string, businessId: string): Promise<ConstraintPriority[]>;
  dismiss(orgId: string, constraintId: string): Promise<BusinessConstraint>;
}

export function createBusinessConstraintService(repos: RepositoryContainer): BusinessConstraintService {
  return {
    async analyze(orgId, businessId, businessMriId) {
      const business = await repos.businesses.findById(orgId, businessId);
      if (!business) {
        throw new Error(`Business ${businessId} not found`);
      }

      const responses = await repos.businessMri.listResponses(orgId, businessMriId);
      const health = await repos.businessHealth.findByBusinessId(orgId, businessId);
      const healthDimensions = health ? await repos.businessHealth.listDimensions(orgId, health.id) : [];
      const capabilities = await repos.businessCapabilities.listByBusinessId(orgId, businessId);

      const detected = detectConstraints(
        responses,
        healthDimensions.map((d) => ({ dimensionKey: d.dimensionKey, score: d.score })),
        capabilities.map((c) => ({ capabilityKey: c.capabilityKey, currentMaturity: c.currentMaturity })),
        business.employeeCount
      );
      const scoreResults = prioritizeConstraints(detected, business.employeeCount);
      const scoreByDefinition = new Map(scoreResults.map((s) => [s.definitionKey, s]));

      const constraints: BusinessConstraint[] = [];
      const scores: ConstraintScore[] = [];
      const priorities: ConstraintPriority[] = [];

      for (const detection of detected) {
        const constraint = await repos.businessConstraints.create({
          orgId,
          businessId,
          definitionKey: detection.definitionKey,
          title: detection.title,
          description: detection.description,
          category: detection.category,
          severity: detection.severity,
          confidence: detection.confidence,
          businessImpact: detection.businessImpact,
          financialImpact: detection.financialImpact,
          customerImpact: detection.customerImpact,
          operationalImpact: detection.operationalImpact,
          automationPotential: detection.automationPotential,
          businessOwner: detection.businessOwner,
          dependencies: detection.dependencies,
          status: "active",
          dateDetected: nowIso(),
          version: 1,
        });

        for (const evidence of detection.evidence) {
          await repos.businessConstraints.addEvidence(constraint.id, evidence);
        }

        const score = scoreByDefinition.get(detection.definitionKey);
        if (score) {
          const savedScore = await repos.constraintScores.upsert({
            orgId,
            constraintId: constraint.id,
            businessImpactScore: score.businessImpactScore,
            financialImpactScore: score.financialImpactScore,
            customerImpactScore: score.customerImpactScore,
            urgencyScore: score.urgencyScore,
            automationScore: score.automationScore,
            confidenceScore: score.confidenceScore,
            overallScore: score.overallScore,
            deletedAt: null,
          });
          scores.push(savedScore);

          const savedPriority = await repos.constraintPriorities.upsert({
            orgId,
            constraintId: constraint.id,
            priority: score.priority,
            rank: score.rank,
            computedAt: nowIso(),
            deletedAt: null,
          });
          priorities.push(savedPriority);
        }

        constraints.push(await repos.businessConstraints.findById(orgId, constraint.id) ?? constraint);
      }

      await repos.businessTimeline.append({
        orgId,
        businessId,
        type: "constraint_analysis_completed",
        description: `Constraint analysis detected ${constraints.length} constraint(s)`,
        metadata: { count: constraints.length },
        occurredAt: nowIso(),
      });

      return { constraints, scores, priorities };
    },
    async list(orgId, businessId) {
      return repos.businessConstraints.listByBusinessId(orgId, businessId);
    },
    async getPriorities(orgId, businessId) {
      return repos.constraintPriorities.listByBusinessId(orgId, businessId);
    },
    async dismiss(orgId, constraintId) {
      const existing = await repos.businessConstraints.findById(orgId, constraintId);
      const updated = await repos.businessConstraints.updateStatus(orgId, constraintId, "dismissed");
      await repos.businessConstraints.recordHistory(constraintId, existing?.status ?? null, "dismissed", "Dismissed via API");
      return updated;
    },
  };
}
