import { nowIso } from "@boss/shared";
import { generateRecommendations, prioritizeRecommendations, buildTransformationRoadmapStages } from "@boss/mcp";
import type { BusinessRecommendation, RecommendationPriority, RecommendationScore, TransformationRoadmap } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface RecommendationAnalysisResult {
  recommendations: BusinessRecommendation[];
  scores: RecommendationScore[];
  priorities: RecommendationPriority[];
  roadmap: TransformationRoadmap;
}

export interface BusinessRecommendationService {
  analyze(orgId: string, businessId: string): Promise<RecommendationAnalysisResult>;
  list(orgId: string, businessId: string): Promise<BusinessRecommendation[]>;
  getPriorities(orgId: string, businessId: string): Promise<RecommendationPriority[]>;
  getRoadmap(orgId: string, businessId: string): Promise<TransformationRoadmap | null>;
  dismiss(orgId: string, recommendationId: string): Promise<BusinessRecommendation>;
  approve(orgId: string, recommendationId: string): Promise<BusinessRecommendation>;
}

export function createBusinessRecommendationService(repos: RepositoryContainer): BusinessRecommendationService {
  return {
    async analyze(orgId, businessId) {
      const business = await repos.businesses.findById(orgId, businessId);
      if (!business) {
        throw new Error(`Business ${businessId} not found`);
      }

      const activeConstraints = (await repos.businessConstraints.listByBusinessId(orgId, businessId)).filter(
        (c) => c.status === "active"
      );

      const generated = generateRecommendations(
        activeConstraints.map((c) => ({ id: c.id, definitionKey: c.definitionKey })),
        business.employeeCount
      );
      const scoreResults = prioritizeRecommendations(generated, business.employeeCount);
      const scoreByDefinition = new Map(scoreResults.map((s) => [s.definitionKey, s]));

      const recommendations: BusinessRecommendation[] = [];
      const scores: RecommendationScore[] = [];
      const priorities: RecommendationPriority[] = [];

      for (const candidate of generated) {
        const recommendation = await repos.businessRecommendations.create({
          orgId,
          businessId,
          definitionKey: candidate.definitionKey,
          title: candidate.title,
          description: candidate.description,
          businessGoal: candidate.businessGoal,
          category: candidate.category,
          relatedCapabilities: candidate.relatedCapabilities,
          relatedConstraintIds: candidate.relatedConstraintIds,
          relatedKpiKeys: candidate.relatedKpiKeys,
          expectedOutcome: candidate.expectedOutcome,
          difficulty: candidate.difficulty,
          estimatedEffortHours: candidate.estimatedEffortHours,
          estimatedCost: candidate.estimatedCost,
          estimatedRoi: candidate.estimatedRoi,
          estimatedTimeToValueDays: candidate.estimatedTimeToValueDays,
          confidence: candidate.confidence,
          dependencies: candidate.dependencies,
          approval: candidate.approval,
          stage: candidate.stage,
          status: "proposed",
          dateRecommended: nowIso(),
          version: 1,
        });

        for (const evidence of candidate.evidence) {
          await repos.businessRecommendations.addEvidence(recommendation.id, evidence);
        }

        const score = scoreByDefinition.get(candidate.definitionKey);
        if (score) {
          const savedScore = await repos.recommendationScores.upsert({
            orgId,
            recommendationId: recommendation.id,
            priorityScore: score.priorityScore,
            businessValueScore: score.businessValueScore,
            implementationScore: score.implementationScore,
            strategicScore: score.strategicScore,
            overallScore: score.overallScore,
            deletedAt: null,
          });
          scores.push(savedScore);

          const savedPriority = await repos.recommendationPriorities.upsert({
            orgId,
            recommendationId: recommendation.id,
            priority: score.priority,
            rank: score.rank,
            computedAt: nowIso(),
            deletedAt: null,
          });
          priorities.push(savedPriority);
        }

        recommendations.push(await repos.businessRecommendations.findById(orgId, recommendation.id) ?? recommendation);
      }

      const stages = buildTransformationRoadmapStages(generated);
      const roadmap = await repos.transformationRoadmaps.upsert({
        orgId,
        businessId,
        stages,
        generatedAt: nowIso(),
        version: 1,
        deletedAt: null,
      });

      await repos.businessTimeline.append({
        orgId,
        businessId,
        type: "recommendations_generated",
        description: `Recommendation analysis generated ${recommendations.length} recommendation(s)`,
        metadata: { count: recommendations.length },
        occurredAt: nowIso(),
      });

      await repos.eventBus.publish({
        type: "business.recommendations.generated",
        payload: { orgId, businessId, count: recommendations.length },
        occurredAt: nowIso(),
      });

      return { recommendations, scores, priorities, roadmap };
    },
    async list(orgId, businessId) {
      return repos.businessRecommendations.listByBusinessId(orgId, businessId);
    },
    async getPriorities(orgId, businessId) {
      return repos.recommendationPriorities.listByBusinessId(orgId, businessId);
    },
    async getRoadmap(orgId, businessId) {
      return repos.transformationRoadmaps.findByBusinessId(orgId, businessId);
    },
    async dismiss(orgId, recommendationId) {
      const existing = await repos.businessRecommendations.findById(orgId, recommendationId);
      const updated = await repos.businessRecommendations.updateStatus(orgId, recommendationId, "dismissed");
      await repos.businessRecommendations.recordHistory(
        recommendationId,
        existing?.status ?? null,
        "dismissed",
        "Dismissed via API"
      );
      return updated;
    },
    async approve(orgId, recommendationId) {
      const existing = await repos.businessRecommendations.findById(orgId, recommendationId);
      const updated = await repos.businessRecommendations.updateStatus(orgId, recommendationId, "approved");
      await repos.businessRecommendations.recordHistory(
        recommendationId,
        existing?.status ?? null,
        "approved",
        "Approved via API"
      );
      await repos.eventBus.publish({
        type: "business.recommendation.approved",
        payload: { orgId, businessId: updated.businessId, recommendationId },
        occurredAt: nowIso(),
      });
      return updated;
    },
  };
}
