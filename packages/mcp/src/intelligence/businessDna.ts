import type {
  AutomationReadiness,
  BusinessArchetype,
  BusinessMriResponse,
  CommunicationStyle,
  CustomerEngagementStyle,
  DecisionStyle,
  GrowthStage,
  OperationalComplexity,
  RevenueModel,
  RiskProfile,
  TechnologyMaturity,
} from "@boss/types";
import { asBoolean, asNumber, asStringArray, toResponseMap } from "./responseMap.js";

export interface DerivedBusinessDna {
  archetype: BusinessArchetype;
  growthStage: GrowthStage;
  operationalComplexity: OperationalComplexity;
  technologyMaturity: TechnologyMaturity;
  automationReadiness: AutomationReadiness;
  customerEngagementStyle: CustomerEngagementStyle;
  revenueModel: RevenueModel;
  communicationStyle: CommunicationStyle;
  decisionStyle: DecisionStyle;
  riskProfile: RiskProfile;
}

/**
 * Deterministic, rule-based derivation of Business DNA from raw MRI
 * responses. No AI/LLM reasoning — every dimension is a fixed function of
 * specific question answers, documented inline. Goal 2 explicitly excludes
 * AI inference; this is the placeholder logic later goals may replace.
 */
export function deriveBusinessDna(responses: BusinessMriResponse[]): DerivedBusinessDna {
  const map = toResponseMap(responses);

  const employees = asNumber(map, "identity.employees");
  const locations = asNumber(map, "identity.locations");
  const yearsOperating = asNumber(map, "identity.years_operating");

  const archetype: BusinessArchetype =
    employees <= 1
      ? "solo_operator"
      : employees <= 5
        ? "owner_operator"
        : employees <= 20
          ? "growth_stage_team"
          : "established_enterprise";

  const growthStage: GrowthStage =
    yearsOperating < 1
      ? "startup"
      : yearsOperating < 3
        ? "early_growth"
        : yearsOperating < 8
          ? "scaling"
          : "mature";

  const operationalComplexity: OperationalComplexity =
    locations > 1 || employees > 20
      ? "highly_complex"
      : employees > 10
        ? "complex"
        : employees > 3
          ? "moderate"
          : "simple";

  const techSignals = [
    asBoolean(map, "technology.crm"),
    asBoolean(map, "technology.accounting_software"),
    asBoolean(map, "technology.calendar"),
    asBoolean(map, "technology.existing_ai_usage"),
  ].filter(Boolean).length;

  const technologyMaturity: TechnologyMaturity =
    techSignals >= 4 ? "advanced" : techSignals >= 3 ? "integrated" : techSignals >= 1 ? "basic_tools" : "manual";

  const existingAiUsage = asBoolean(map, "technology.existing_ai_usage");
  const automationReadiness: AutomationReadiness =
    existingAiUsage && (technologyMaturity === "integrated" || technologyMaturity === "advanced")
      ? "very_high"
      : technologyMaturity === "integrated" || technologyMaturity === "advanced"
        ? "high"
        : technologyMaturity === "basic_tools"
          ? "moderate"
          : "low";

  const customerTypes = asStringArray(map, "customers.customer_types");
  const repeatBusiness = asNumber(map, "customers.repeat_business");
  const customerEngagementStyle: CustomerEngagementStyle = customerTypes.includes("b2b")
    ? "relationship_driven"
    : repeatBusiness >= 4
      ? "relationship_driven"
      : repeatBusiness <= 1
        ? "transactional"
        : "self_service";

  const revenueSources = asStringArray(map, "finance.revenue_sources");
  const revenueModel: RevenueModel = revenueSources.includes("subscriptions")
    ? "recurring_subscription"
    : revenueSources.length > 1
      ? "mixed"
      : revenueSources.includes("services")
        ? "service_based"
        : "one_time_sales";

  const communicationChannels = asStringArray(map, "customers.communication");
  const communicationStyle: CommunicationStyle =
    communicationChannels.includes("in_person") || communicationChannels.includes("phone")
      ? "high_touch"
      : communicationChannels.includes("chat") || communicationChannels.includes("sms")
        ? "low_touch"
        : "casual";

  const cashFlowVisibility = asNumber(map, "finance.cash_flow_visibility");
  const decisionStyle: DecisionStyle =
    archetype === "solo_operator" || archetype === "owner_operator"
      ? "owner_led"
      : cashFlowVisibility >= 4
        ? "data_driven"
        : "intuitive";

  const goalPriorities = asStringArray(map, "goals.priorities");
  const riskProfile: RiskProfile =
    yearsOperating < 2 && goalPriorities.includes("growth")
      ? "risk_tolerant"
      : yearsOperating > 8
        ? "risk_averse"
        : "balanced";

  return {
    archetype,
    growthStage,
    operationalComplexity,
    technologyMaturity,
    automationReadiness,
    customerEngagementStyle,
    revenueModel,
    communicationStyle,
    decisionStyle,
    riskProfile,
  };
}
