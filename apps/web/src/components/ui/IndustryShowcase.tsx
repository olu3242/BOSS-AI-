"use client";

import { useState } from "react";

const INDUSTRY_SCENES = [
  {
    name: "Healthcare & dental",
    image: "/industry/healthcare.jpeg",
    eyebrow: "Care operations",
    title: "Patient flow, reminders, reviews, and revenue in one operating rhythm.",
    body: "BOSS helps clinics recover missed calls, reduce no-shows, follow up after visits, and keep owners aware of capacity and cash flow.",
    metrics: ["-74% no-shows", "4 min response", "Daily health report"],
  },
  {
    name: "Executive teams",
    image: "/industry/executive-team.jpeg",
    eyebrow: "Leadership visibility",
    title: "A command layer for owners and operators who need answers fast.",
    body: "Turn scattered dashboards, meetings, and gut checks into a daily executive briefing with clear recommendations.",
    metrics: ["87 health score", "3 decisions today", "Revenue trend"],
  },
  {
    name: "Operations teams",
    image: "/industry/operations-team.jpeg",
    eyebrow: "Back-office control",
    title: "Keep sales, service, finance, and follow-up moving without manual chase.",
    body: "BOSS watches the work queue, highlights exceptions, and helps teams act before issues become owner emergencies.",
    metrics: ["214 tasks/week", "100% audit trail", "Live queue"],
  },
  {
    name: "Professional services",
    image: "/industry/professional-services.jpeg",
    eyebrow: "Advisory firms",
    title: "Make every client conversation sharper with live business context.",
    body: "Use BOSS to track pipeline, client follow-up, proposals, billing, and operating priorities across a service business.",
    metrics: ["31% lead lift", "Proposal drafts", "Client timeline"],
  },
  {
    name: "Retail showroom",
    image: "/industry/retail-showroom.jpeg",
    eyebrow: "Retail experience",
    title: "Connect store activity, inventory signals, and customer follow-up.",
    body: "BOSS gives retailers a cinematic view of store health, campaign performance, customer activity, and next best actions.",
    metrics: ["Store health", "Campaign ROI", "Customer follow-up"],
  },
  {
    name: "Retail analytics",
    image: "/industry/retail-analytics.jpeg",
    eyebrow: "Store management",
    title: "Bring the floor, inventory, and revenue data into the same view.",
    body: "Managers can see what moved, what stalled, which campaigns worked, and where staff should focus next.",
    metrics: ["Inventory pulse", "Sales forecast", "Margin watch"],
  },
  {
    name: "Retail manager",
    image: "/industry/retail-manager.jpeg",
    eyebrow: "Owner mobility",
    title: "Run store operations from the aisle, office, or between locations.",
    body: "BOSS gives owners and managers a mobile command view for customer activity, staff tasks, promotions, and cash.",
    metrics: ["1-tap approve", "Live tasks", "Multi-location"],
  },
  {
    name: "Construction automation",
    image: "/industry/construction-automation.jpeg",
    eyebrow: "Project intelligence",
    title: "Coordinate field work, estimates, invoices, and project risk.",
    body: "BOSS helps contractors connect job progress, customer updates, estimates, billing, and operational exceptions.",
    metrics: ["Job pipeline", "Estimate follow-up", "Risk alerts"],
  },
  {
    name: "Construction field",
    image: "/industry/construction-field.jpeg",
    eyebrow: "Field execution",
    title: "Give crews and owners a shared operating picture from the jobsite.",
    body: "Turn site activity into decisions: what is blocked, what needs approval, what can be billed, and what comes next.",
    metrics: ["Crew tasks", "Change orders", "Daily brief"],
  },
  {
    name: "Contractors",
    image: "/industry/contractor-tablet.jpeg",
    eyebrow: "Trade businesses",
    title: "Capture demand, schedule work, follow up, and collect faster.",
    body: "BOSS gives trades a practical operating system for jobs, estimates, appointments, customer messages, and payments.",
    metrics: ["2x invoicing", "$18K cash lift", "Zero cold leads"],
  },
];

export function IndustryShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = INDUSTRY_SCENES[activeIndex] ?? INDUSTRY_SCENES[0]!;

  return (
    <section className="l-section l-industry-cinema" aria-labelledby="industries-title">
      <div className="l-industry-cinema-bg" aria-hidden="true">
        {INDUSTRY_SCENES.map((scene, index) => (
          <div
            key={scene.name}
            className={`l-industry-cinema-image${index === activeIndex ? " is-active" : ""}`}
            style={{ backgroundImage: `url("${scene.image}")` }}
          />
        ))}
      </div>

      <div className="l-industry-cinema-content">
        <div className="l-industry-cinema-copy">
          <p className="l-section-label">Built for your industry</p>
          <h2 id="industries-title" className="l-section-title">
            BOSS adapts to the way your business actually runs.
          </h2>
          <p className="l-section-sub">
            Select an industry and the operating story changes with it: the
            visuals, the workflows, the metrics, and the decisions BOSS brings
            into focus.
          </p>
        </div>

        <div className="l-industry-panel" aria-live="polite">
          <p className="l-industry-panel-eyebrow">{active.eyebrow}</p>
          <h3>{active.title}</h3>
          <p>{active.body}</p>
          <div className="l-industry-panel-metrics">
            {active.metrics.map((metric) => (
              <span key={metric}>{metric}</span>
            ))}
          </div>
        </div>

        <div className="l-industry-selector" role="tablist" aria-label="Industry scenes">
          {INDUSTRY_SCENES.map((scene, index) => (
            <button
              key={scene.name}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              className="l-industry-scene-btn"
              onClick={() => setActiveIndex(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {scene.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
