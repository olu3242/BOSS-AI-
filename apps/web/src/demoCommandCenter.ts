import { createInMemoryApi } from "@boss/api";
import { buildCommandCenterSnapshot, renderCommandCenterHtml, type CommandCenterSnapshot } from "./commandCenter.js";

const ORG_ID = "44444444-4444-4444-4444-444444444444";

export interface DemoCommandCenter {
  snapshot: CommandCenterSnapshot;
  html: string;
}

export async function createDemoCommandCenter(): Promise<DemoCommandCenter> {
  const api = createInMemoryApi();

  const { business, profile } = await api.business.create({
    orgId: ORG_ID,
    name: "Lakeside HVAC",
    industry: "hvac",
    employeeCount: 8,
    annualRevenue: 520000,
    businessType: "hvac",
    yearsOperating: 4,
    locationCount: 1,
    businessHours: "Mon-Fri 7am-6pm",
  });

  const mri = await api.businessMri.start(ORG_ID, business.id);
  await answerDemoMri(api, mri.id);
  await api.businessMri.completeSection(ORG_ID, mri.id, "sales");
  await api.businessMri.completeSection(ORG_ID, mri.id, "operations");
  await api.businessMri.completeSection(ORG_ID, mri.id, "technology");
  const completedMri = await api.businessMri.complete(ORG_ID, mri.id);

  const dna = await api.businessDna.generate(ORG_ID, business.id, completedMri.id);
  const healthResult = await api.businessHealth.generate(ORG_ID, business.id, completedMri.id);
  const capabilities = await api.businessCapability.evaluate(ORG_ID, business.id, completedMri.id, dna);
  const constraintAnalysis = await api.businessConstraint.analyze(ORG_ID, business.id, completedMri.id);
  const recommendationAnalysis = await api.businessRecommendation.analyze(ORG_ID, business.id);

  const firstRecommendation = recommendationAnalysis.recommendations[0];
  if (firstRecommendation) {
    await api.businessRecommendation.approve(ORG_ID, firstRecommendation.id);
  }

  const recommendations = await api.businessRecommendation.list(ORG_ID, business.id);
  const timeline = await api.businessTimeline.list(ORG_ID, business.id);
  const roadmap = await api.businessRecommendation.getRoadmap(ORG_ID, business.id);

  if (!roadmap) {
    throw new Error("Expected recommendation analysis to create a transformation roadmap.");
  }

  const snapshot = buildCommandCenterSnapshot({
    business,
    profile,
    dna,
    health: healthResult.health,
    healthDimensions: healthResult.dimensions,
    capabilities,
    constraints: constraintAnalysis.constraints,
    constraintPriorities: constraintAnalysis.priorities,
    recommendations,
    recommendationPriorities: recommendationAnalysis.priorities,
    roadmap,
    timeline,
  });

  return {
    snapshot,
    html: renderCommandCenterHtml(snapshot),
  };
}

async function answerDemoMri(api: ReturnType<typeof createInMemoryApi>, businessMriId: string): Promise<void> {
  await api.businessMri.answer(ORG_ID, businessMriId, {
    sectionKey: "sales",
    questionKey: "sales.follow_up_process",
    value: "manual",
  });
  await api.businessMri.answer(ORG_ID, businessMriId, {
    sectionKey: "operations",
    questionKey: "operations.team_responsibilities",
    value: "undefined",
  });
  await api.businessMri.answer(ORG_ID, businessMriId, {
    sectionKey: "technology",
    questionKey: "technology.crm",
    value: false,
  });
  await api.businessMri.answer(ORG_ID, businessMriId, {
    sectionKey: "pain_points",
    questionKey: "pain_points.challenges",
    value: ["missed_leads", "administrative_overload", "slow_follow_up"],
  });
  await api.businessMri.answer(ORG_ID, businessMriId, {
    sectionKey: "finance",
    questionKey: "finance.reporting",
    value: "monthly_manual",
  });
}
