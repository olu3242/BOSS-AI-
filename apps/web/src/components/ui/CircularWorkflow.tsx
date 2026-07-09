"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

const WORKFLOW_STEPS = [
  {
    label: "Tell us",
    title: "Share what is slowing you down",
    detail: "Missed calls, open invoices, empty slots, stale leads, and owner bottlenecks.",
  },
  {
    label: "Read signals",
    title: "BOSS watches the moving parts",
    detail: "Customer demand, calendar gaps, payment delays, follow-up timing, and daily activity.",
  },
  {
    label: "Find leaks",
    title: "The highest-impact fixes rise first",
    detail: "You see where time and money are slipping before the day gets away from you.",
  },
  {
    label: "Act",
    title: "Approve the next best moves",
    detail: "Send reminders, recover leads, nudge invoices, fill slots, and follow up faster.",
  },
  {
    label: "Learn",
    title: "Every result sharpens the next brief",
    detail: "The loop gets clearer as BOSS sees what works for your business.",
  },
];

export function CircularWorkflow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = WORKFLOW_STEPS[activeIndex] ?? WORKFLOW_STEPS[0]!;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % WORKFLOW_STEPS.length);
    }, 3600);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="l-workflow" aria-label="BOSS information processing flow">
      <div className="l-workflow-orbit" aria-hidden="true">
        <div className="l-workflow-ring" />
        <div className="l-workflow-pulse" />
        {WORKFLOW_STEPS.map((step, index) => {
          const angle = -90 + (index * 360) / WORKFLOW_STEPS.length;
          return (
            <button
              key={step.label}
              type="button"
              className={`l-workflow-node${index === activeIndex ? " is-active" : ""}`}
              style={{ "--angle": `${angle}deg` } as CSSProperties}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show step: ${step.label}`}
            >
              <span>{index + 1}</span>
            </button>
          );
        })}
        <div className="l-workflow-core">
          <span>Daily brief</span>
          <strong>{active.label}</strong>
        </div>
      </div>

      <div className="l-workflow-panel" aria-live="polite">
        <p className="l-workflow-step">
          Step {activeIndex + 1} of {WORKFLOW_STEPS.length}
        </p>
        <h3>{active.title}</h3>
        <p>{active.detail}</p>
      </div>
    </div>
  );
}
