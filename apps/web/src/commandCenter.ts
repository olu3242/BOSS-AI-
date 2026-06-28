import {
  formatCurrency,
  formatNumber,
  formatPercent,
  humanizeKey,
  toneForPriority,
  toneForScore,
  type MetricTone,
} from "@boss/ui";
import type {
  Business,
  BusinessCapabilityAssessment,
  BusinessConstraint,
  BusinessDNA,
  BusinessHealth,
  BusinessHealthDimension,
  BusinessProfile,
  BusinessRecommendation,
  BusinessTimelineEntry,
  ConstraintPriority,
  RecommendationPriority,
  TransformationRoadmap,
} from "@boss/types";

export interface CommandCenterInput {
  business: Business;
  profile: BusinessProfile;
  dna: BusinessDNA;
  health: BusinessHealth;
  healthDimensions: BusinessHealthDimension[];
  capabilities: BusinessCapabilityAssessment[];
  constraints: BusinessConstraint[];
  constraintPriorities: ConstraintPriority[];
  recommendations: BusinessRecommendation[];
  recommendationPriorities: RecommendationPriority[];
  roadmap: TransformationRoadmap;
  timeline: BusinessTimelineEntry[];
}

export interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
  tone: MetricTone;
}

export interface CommandCenterAlert {
  title: string;
  message: string;
  severity: MetricTone;
}

export interface AgentStatus {
  name: string;
  status: "ready" | "needs_attention" | "blocked";
  focus: string;
}

export interface AutomationHealth {
  label: string;
  status: "healthy" | "watch" | "blocked";
  detail: string;
}

export interface DrillDownView {
  title: string;
  items: string[];
}

export interface CommandCenterSnapshot {
  summary: {
    businessName: string;
    industry: string;
    archetype: string;
    generatedAt: string;
  };
  metrics: DashboardMetric[];
  alerts: CommandCenterAlert[];
  agents: AgentStatus[];
  automation: AutomationHealth[];
  drillDowns: DrillDownView[];
}

export function buildCommandCenterSnapshot(input: CommandCenterInput): CommandCenterSnapshot {
  const activeConstraints = input.constraints.filter((constraint) => constraint.status === "active");
  const approvedRecommendations = input.recommendations.filter(
    (recommendation) => recommendation.status === "approved"
  );
  const criticalPriorities = input.constraintPriorities.filter(
    (priority) => priority.priority === "critical" || priority.priority === "high"
  );
  const highValueRecommendations = input.recommendationPriorities.filter(
    (priority) => priority.priority === "critical" || priority.priority === "high"
  );
  const totalEstimatedProfit = input.recommendations.reduce(
    (sum, recommendation) => sum + recommendation.estimatedRoi.profitImpactAnnual,
    0
  );
  const totalOwnerHoursSaved = input.recommendations.reduce(
    (sum, recommendation) => sum + recommendation.estimatedRoi.ownerTimeSavedHoursWeekly,
    0
  );
  const averageCapabilityMaturity = maturityScore(input.capabilities);

  const metrics: DashboardMetric[] = [
    {
      label: "Business Health",
      value: formatPercent(input.health.overallScore),
      detail: `${input.healthDimensions.length} dimensions evaluated`,
      tone: toneForScore(input.health.overallScore),
    },
    {
      label: "Active Constraints",
      value: formatNumber(activeConstraints.length),
      detail: `${criticalPriorities.length} critical or high priority`,
      tone: criticalPriorities.length > 0 ? "critical" : "positive",
    },
    {
      label: "Recommendation Pipeline",
      value: formatNumber(input.recommendations.length),
      detail: `${highValueRecommendations.length} high-value opportunities`,
      tone: highValueRecommendations.length > 0 ? "positive" : "neutral",
    },
    {
      label: "Projected Annual Profit",
      value: formatCurrency(totalEstimatedProfit),
      detail: `${formatNumber(totalOwnerHoursSaved)} owner hours saved weekly`,
      tone: totalEstimatedProfit > 0 ? "positive" : "neutral",
    },
    {
      label: "Capability Maturity",
      value: formatPercent(averageCapabilityMaturity),
      detail: `${input.capabilities.length} capabilities mapped`,
      tone: toneForScore(averageCapabilityMaturity),
    },
    {
      label: "Approved Work",
      value: formatNumber(approvedRecommendations.length),
      detail: "recommendations approved for execution",
      tone: approvedRecommendations.length > 0 ? "positive" : "warning",
    },
  ];

  return {
    summary: {
      businessName: input.profile.businessName,
      industry: humanizeKey(input.business.industry),
      archetype: humanizeKey(input.dna.archetype),
      generatedAt: new Date().toISOString(),
    },
    metrics,
    alerts: buildAlerts(input, activeConstraints),
    agents: buildAgentStatuses(input),
    automation: buildAutomationHealth(input, activeConstraints),
    drillDowns: buildDrillDowns(input),
  };
}

export function renderCommandCenterHtml(snapshot: CommandCenterSnapshot): string {
  const metricCards = snapshot.metrics.map(renderMetric).join("");
  const alerts = snapshot.alerts.map(renderAlert).join("");
  const agents = snapshot.agents.map(renderAgent).join("");
  const automation = snapshot.automation.map(renderAutomation).join("");
  const drillDowns = snapshot.drillDowns.map(renderDrillDown).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(snapshot.summary.businessName)} | BOSS Command Center</title>
  <style>
    :root { color-scheme: light; --ink: #17211d; --muted: #5d6963; --line: #dbe3de; --surface: #f7faf8; --panel: #ffffff; --green: #16734a; --amber: #9a6400; --red: #b42318; --blue: #2458a6; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--surface); color: var(--ink); }
    main { width: min(1180px, calc(100% - 32px)); margin: 0 auto; padding: 28px 0 40px; }
    header { display: grid; gap: 8px; padding: 8px 0 24px; border-bottom: 1px solid var(--line); }
    h1 { margin: 0; font-size: clamp(2rem, 4vw, 3.5rem); line-height: 1; letter-spacing: 0; }
    h2 { margin: 0 0 12px; font-size: 1rem; letter-spacing: 0; }
    p { margin: 0; color: var(--muted); }
    section { padding-top: 24px; }
    .grid { display: grid; gap: 12px; }
    .metrics { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
    .two { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .card { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 16px; min-width: 0; }
    .metric-value { display: block; margin-top: 12px; font-size: 1.9rem; font-weight: 750; line-height: 1; overflow-wrap: anywhere; }
    .label { color: var(--muted); font-size: .82rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
    .detail { margin-top: 10px; font-size: .92rem; }
    .tone-positive { border-left: 4px solid var(--green); }
    .tone-warning { border-left: 4px solid var(--amber); }
    .tone-critical { border-left: 4px solid var(--red); }
    .tone-neutral { border-left: 4px solid var(--blue); }
    ul { margin: 8px 0 0; padding-left: 18px; color: var(--muted); }
    li + li { margin-top: 6px; }
    .row { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
    .pill { display: inline-block; border: 1px solid var(--line); border-radius: 999px; padding: 3px 8px; font-size: .78rem; color: var(--muted); white-space: nowrap; }
    @media (max-width: 640px) { main { width: min(100% - 20px, 1180px); padding-top: 18px; } .row { display: grid; } }
  </style>
</head>
<body>
  <main>
    <header>
      <p class="label">BOSS Command Center</p>
      <h1>${escapeHtml(snapshot.summary.businessName)}</h1>
      <p>${escapeHtml(snapshot.summary.industry)} | ${escapeHtml(snapshot.summary.archetype)} | generated ${escapeHtml(snapshot.summary.generatedAt)}</p>
    </header>
    <section aria-labelledby="metrics-title">
      <h2 id="metrics-title">Executive KPIs</h2>
      <div class="grid metrics">${metricCards}</div>
    </section>
    <section class="grid two" aria-label="Operations">
      <div>
        <h2>Alerts</h2>
        <div class="grid">${alerts}</div>
      </div>
      <div>
        <h2>AI Agent Status</h2>
        <div class="grid">${agents}</div>
      </div>
    </section>
    <section class="grid two" aria-label="Automation and drill-downs">
      <div>
        <h2>Automation Health</h2>
        <div class="grid">${automation}</div>
      </div>
      <div>
        <h2>Drill-Down Views</h2>
        <div class="grid">${drillDowns}</div>
      </div>
    </section>
  </main>
</body>
</html>`;
}

function buildAlerts(input: CommandCenterInput, activeConstraints: BusinessConstraint[]): CommandCenterAlert[] {
  const constraintAlerts = input.constraintPriorities.slice(0, 3).flatMap((priority) => {
    const constraint = activeConstraints.find((item) => item.id === priority.constraintId);
    if (!constraint) return [];
    return [
      {
        title: constraint.title,
        message: `${humanizeKey(priority.priority)} priority | ${constraint.businessImpact}`,
        severity: toneForPriority(priority.priority),
      },
    ];
  });

  if (constraintAlerts.length > 0) return constraintAlerts;

  return [
    {
      title: "No critical constraints detected",
      message: "The latest MRI did not surface active critical operating constraints.",
      severity: "positive",
    },
  ];
}

function buildAgentStatuses(input: CommandCenterInput): AgentStatus[] {
  const proposed = input.recommendations.filter((recommendation) => recommendation.status === "proposed").length;
  const approved = input.recommendations.filter((recommendation) => recommendation.status === "approved").length;
  const criticalHealth = input.healthDimensions.filter((dimension) => dimension.status === "critical").length;

  return [
    {
      name: "CEO Advisor",
      status: proposed > 0 ? "ready" : "needs_attention",
      focus: `${proposed} recommendations awaiting executive review`,
    },
    {
      name: "COO",
      status: input.constraints.some((constraint) => constraint.severity === "critical") ? "needs_attention" : "ready",
      focus: `${input.constraints.length} operating constraints monitored`,
    },
    {
      name: "Automation Manager",
      status: approved > 0 ? "ready" : "blocked",
      focus: `${approved} approved recommendations ready for workflow design`,
    },
    {
      name: "Reporting Analyst",
      status: criticalHealth > 0 ? "needs_attention" : "ready",
      focus: `${input.healthDimensions.length} health dimensions refreshed`,
    },
  ];
}

function buildAutomationHealth(
  input: CommandCenterInput,
  activeConstraints: BusinessConstraint[]
): AutomationHealth[] {
  const autoRecommendations = input.recommendations.filter((recommendation) => recommendation.approval === "auto");
  const approvalRequired = input.recommendations.filter(
    (recommendation) => recommendation.approval === "approval_required" || recommendation.approval === "executive_review"
  );

  return [
    {
      label: "Trigger Handling",
      status: activeConstraints.length > 0 ? "healthy" : "watch",
      detail: `${activeConstraints.length} active constraint trigger(s) available`,
    },
    {
      label: "Approval Queue",
      status: approvalRequired.length > 0 ? "watch" : "healthy",
      detail: `${approvalRequired.length} recommendation(s) require approval`,
    },
    {
      label: "Safe Automation",
      status: autoRecommendations.length > 0 ? "healthy" : "blocked",
      detail: `${autoRecommendations.length} recommendation(s) eligible for automatic execution`,
    },
    {
      label: "Roadmap Coverage",
      status: input.roadmap.stages.some((stage) => stage.recommendationIds.length > 0) ? "healthy" : "blocked",
      detail: `${input.roadmap.stages.length} transformation stages generated`,
    },
  ];
}

function buildDrillDowns(input: CommandCenterInput): DrillDownView[] {
  return [
    {
      title: "Top Recommendations",
      items: input.recommendationPriorities.slice(0, 5).map((priority) => {
        const recommendation = input.recommendations.find((item) => item.id === priority.recommendationId);
        return recommendation
          ? `#${priority.rank} ${recommendation.title} (${humanizeKey(priority.priority)})`
          : `#${priority.rank} Unknown recommendation`;
      }),
    },
    {
      title: "Transformation Roadmap",
      items: input.roadmap.stages.map(
        (stage) => `${humanizeKey(stage.stage)}: ${formatNumber(stage.recommendationIds.length)} recommendation(s)`
      ),
    },
    {
      title: "Recent Activity",
      items: input.timeline.slice(-6).map((entry) => `${humanizeKey(entry.type)}: ${entry.description}`),
    },
  ];
}

function maturityScore(capabilities: BusinessCapabilityAssessment[]): number {
  if (capabilities.length === 0) return 0;
  const scoreByMaturity: Record<BusinessCapabilityAssessment["currentMaturity"], number> = {
    absent: 0,
    ad_hoc: 25,
    developing: 50,
    managed: 75,
    optimized: 100,
  };
  const total = capabilities.reduce((sum, capability) => sum + scoreByMaturity[capability.currentMaturity], 0);
  return total / capabilities.length;
}

function renderMetric(metric: DashboardMetric): string {
  return `<article class="card tone-${metric.tone}"><span class="label">${escapeHtml(metric.label)}</span><strong class="metric-value">${escapeHtml(metric.value)}</strong><p class="detail">${escapeHtml(metric.detail)}</p></article>`;
}

function renderAlert(alert: CommandCenterAlert): string {
  return `<article class="card tone-${alert.severity}"><div class="row"><strong>${escapeHtml(alert.title)}</strong><span class="pill">${escapeHtml(alert.severity)}</span></div><p class="detail">${escapeHtml(alert.message)}</p></article>`;
}

function renderAgent(agent: AgentStatus): string {
  return `<article class="card"><div class="row"><strong>${escapeHtml(agent.name)}</strong><span class="pill">${escapeHtml(humanizeKey(agent.status))}</span></div><p class="detail">${escapeHtml(agent.focus)}</p></article>`;
}

function renderAutomation(item: AutomationHealth): string {
  return `<article class="card"><div class="row"><strong>${escapeHtml(item.label)}</strong><span class="pill">${escapeHtml(humanizeKey(item.status))}</span></div><p class="detail">${escapeHtml(item.detail)}</p></article>`;
}

function renderDrillDown(view: DrillDownView): string {
  const items =
    view.items.length > 0 ? view.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : "<li>No data available</li>";
  return `<article class="card"><strong>${escapeHtml(view.title)}</strong><ul>${items}</ul></article>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
