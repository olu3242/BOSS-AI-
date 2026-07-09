import type { CSSProperties } from "react";

const PRODUCT_SHOWCASES = [
  {
    title: "Executive Command Center",
    category: "Command",
    metric: "87",
    unit: "health",
    description: "One calm operating view for revenue, risks, decisions, and work in motion.",
    signals: ["Revenue", "Risk", "Priorities"],
  },
  {
    title: "Business Operating Loop",
    category: "Operations",
    metric: "24/7",
    unit: "loop",
    description: "Capture, decide, execute, measure, and improve without waiting for a meeting.",
    signals: ["Capture", "Execute", "Measure"],
  },
  {
    title: "AI Workforce",
    category: "Automation",
    metric: "214",
    unit: "tasks",
    description: "Specialized agents handle routine work while owners keep approval control.",
    signals: ["Reception", "Finance", "Reviews"],
  },
  {
    title: "AI Copilot",
    category: "Assistant",
    metric: "4m",
    unit: "response",
    description: "Plain-English business answers, next best actions, and generated customer drafts.",
    signals: ["Ask", "Draft", "Approve"],
  },
  {
    title: "Executive Dashboard",
    category: "Visibility",
    metric: "$124K",
    unit: "MTD",
    description: "A daily executive screen for money, customers, operations, and exceptions.",
    signals: ["Cash", "Pipeline", "Capacity"],
  },
  {
    title: "KPI Analytics",
    category: "Analytics",
    metric: "+18%",
    unit: "trend",
    description: "Track the few numbers that actually explain whether the business is improving.",
    signals: ["Growth", "Margin", "Speed"],
  },
  {
    title: "CRM",
    category: "Customers",
    metric: "31%",
    unit: "lift",
    description: "Manage leads, customers, conversations, and follow-up without losing context.",
    signals: ["Leads", "Customers", "Follow-up"],
  },
  {
    title: "Scheduling",
    category: "Calendar",
    metric: "-74%",
    unit: "no-shows",
    description: "Fill open slots, confirm visits, and recover missed appointments automatically.",
    signals: ["Slots", "Waitlist", "Reminders"],
  },
  {
    title: "Finance",
    category: "Money",
    metric: "$18K",
    unit: "cash",
    description: "Understand cash flow, overdue accounts, revenue pacing, and payment risk.",
    signals: ["Cash", "AR", "Forecast"],
  },
  {
    title: "Estimates",
    category: "Sales",
    metric: "2x",
    unit: "faster",
    description: "Turn job notes into polished estimates with follow-up already scheduled.",
    signals: ["Quote", "Send", "Nudge"],
  },
  {
    title: "Invoices",
    category: "Billing",
    metric: "40%",
    unit: "faster paid",
    description: "Create, send, and follow up on invoices before cash gets stuck.",
    signals: ["Create", "Send", "Collect"],
  },
  {
    title: "Payments",
    category: "Revenue",
    metric: "$31K",
    unit: "tracked",
    description: "See paid, pending, failed, and overdue payments in the same operating view.",
    signals: ["Paid", "Pending", "Overdue"],
  },
  {
    title: "Marketing Automation",
    category: "Growth",
    metric: "6",
    unit: "campaigns",
    description: "Launch local campaigns, review prompts, reactivation, and offer follow-ups.",
    signals: ["Email", "SMS", "Reviews"],
  },
  {
    title: "Workflow Automation",
    category: "Systems",
    metric: "5",
    unit: "steps",
    description: "Automate repeated handoffs across sales, service, support, and finance.",
    signals: ["Trigger", "Route", "Audit"],
  },
  {
    title: "Customer Timeline",
    category: "History",
    metric: "360",
    unit: "view",
    description: "Every touch, job, payment, review, and decision in chronological context.",
    signals: ["Calls", "Jobs", "Notes"],
  },
  {
    title: "MRI Business Assessment",
    category: "Diagnosis",
    metric: "10m",
    unit: "setup",
    description: "A guided assessment that finds revenue leaks, operational risk, and next steps.",
    signals: ["Assess", "Score", "Plan"],
  },
  {
    title: "Reporting",
    category: "Briefings",
    metric: "7:14",
    unit: "daily",
    description: "Morning reports show what changed, what matters, and what BOSS handled.",
    signals: ["Daily", "Weekly", "Monthly"],
  },
  {
    title: "Industry Intelligence",
    category: "Verticals",
    metric: "20+",
    unit: "packs",
    description: "Industry-specific playbooks for dental, legal, trades, fitness, retail, and more.",
    signals: ["Rules", "Playbooks", "Benchmarks"],
  },
  {
    title: "Operations Center",
    category: "Control",
    metric: "47",
    unit: "today",
    description: "Track jobs, appointments, handoffs, exceptions, and team workload.",
    signals: ["Jobs", "Capacity", "Issues"],
  },
  {
    title: "Notifications",
    category: "Alerts",
    metric: "3",
    unit: "urgent",
    description: "Smart alerts separate true owner decisions from routine background noise.",
    signals: ["Urgent", "Review", "Done"],
  },
  {
    title: "Mobile Experience",
    category: "Owner App",
    metric: "1",
    unit: "tap",
    description: "Approve, review, and understand the business from anywhere between jobs.",
    signals: ["Approve", "Reply", "Check"],
  },
  {
    title: "Industry Templates",
    category: "Templates",
    metric: "80+",
    unit: "flows",
    description: "Prebuilt templates get the first automation live without custom consulting.",
    signals: ["Dental", "HVAC", "Legal"],
  },
  {
    title: "Marketplace",
    category: "Expansion",
    metric: "28",
    unit: "capabilities",
    description: "Add new capabilities and industry packs as the business matures.",
    signals: ["Browse", "Install", "Activate"],
  },
  {
    title: "Integrations",
    category: "Connectors",
    metric: "12",
    unit: "systems",
    description: "Connect the tools already running the business, from calendars to payments.",
    signals: ["Calendar", "Payments", "CRM"],
  },
  {
    title: "Customer Success",
    category: "Support",
    metric: "14d",
    unit: "trial",
    description: "Onboarding support helps owners turn the first week into measurable wins.",
    signals: ["Setup", "Coach", "Review"],
  },
  {
    title: "Team Workspace",
    category: "Collaboration",
    metric: "8",
    unit: "roles",
    description: "Give staff the right view of work without exposing owner-only controls.",
    signals: ["Roles", "Tasks", "Audit"],
  },
  {
    title: "Analytics",
    category: "Insights",
    metric: "4.9x",
    unit: "visibility",
    description: "Spot bottlenecks, weak signals, and opportunities before they become surprises.",
    signals: ["Trends", "Drivers", "Alerts"],
  },
  {
    title: "Business Health",
    category: "Score",
    metric: "87",
    unit: "/100",
    description: "A living score that translates business complexity into owner-ready clarity.",
    signals: ["Score", "Risk", "Momentum"],
  },
  {
    title: "Decision Engine",
    category: "Judgment",
    metric: "3",
    unit: "decisions",
    description: "Prioritize what the owner should decide today, with context and tradeoffs.",
    signals: ["Rank", "Explain", "Approve"],
  },
  {
    title: "Recommendation Engine",
    category: "Next Best Action",
    metric: "$2.8K",
    unit: "recoverable",
    description: "Turn operational signals into concrete recommendations that drive ROI.",
    signals: ["Detect", "Recommend", "Track"],
  },
  {
    title: "Audit Trail",
    category: "Governance",
    metric: "100%",
    unit: "logged",
    description: "Every automated action has timestamped context, approval state, and outcome.",
    signals: ["Who", "Why", "Result"],
  },
  {
    title: "Owner Briefing",
    category: "Executive Rhythm",
    metric: "5",
    unit: "mins",
    description: "A concise daily briefing turns scattered activity into a plan for the day.",
    signals: ["Today", "Risks", "Wins"],
  },
];

export function ProductGallery() {
  return (
    <section className="l-section l-gallery-section" id="gallery" aria-labelledby="gallery-title">
      <div className="l-gallery-heading">
        <div>
          <p className="l-section-label">Product gallery</p>
          <h2 id="gallery-title" className="l-section-title">
            One operating system.<br />Every business function connected.
          </h2>
        </div>
        <p className="l-section-sub">
          These reusable product visuals show the BOSS platform across sales,
          operations, finance, customer experience, automation, and executive
          decision-making.
        </p>
      </div>

      <div className="l-gallery-grid" role="list" aria-label="BOSS product showcase library">
        {PRODUCT_SHOWCASES.map((item, index) => (
          <article key={item.title} className="l-gallery-card" role="listitem">
            <div className="l-gallery-card-top">
              <span className="l-gallery-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="l-gallery-category">{item.category}</span>
            </div>
            <div className="l-gallery-visual" aria-hidden="true">
              <div className="l-gallery-orbit">
                <span />
                <span />
                <span />
              </div>
              <div className="l-gallery-metric">
                <strong>{item.metric}</strong>
                <span>{item.unit}</span>
              </div>
              <div className="l-gallery-bars">
                {item.signals.map((signal, signalIndex) => (
                  <span
                    key={signal}
                    style={{ "--bar-width": `${44 + signalIndex * 18}%` } as CSSProperties}
                  />
                ))}
              </div>
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className="l-gallery-signals" aria-label={`${item.title} signals`}>
              {item.signals.map((signal) => (
                <span key={signal}>{signal}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
