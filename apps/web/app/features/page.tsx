import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "../../src/components/ui/MarketingNav";
import "../landing.css";

export const metadata: Metadata = {
  title: "Features — BOSS",
  description:
    "Everything BOSS does to run your small business: AI workforce, business health scoring, automated workflows, integrations, and more.",
  alternates: { canonical: "/features" },
};

const FEATURE_GROUPS = [
  {
    eyebrow: "Intelligence",
    title: "Know your business like a CFO, every day.",
    features: [
      {
        icon: "🩺",
        name: "Business MRI",
        desc: "A 10-minute diagnostic interview that maps every pressure point — revenue, operations, customers, and risk — into a ranked action list.",
      },
      {
        icon: "💊",
        name: "Business Health Score",
        desc: "A single 0–100 score updated daily, built from KPI readings across every area of your business.",
      },
      {
        icon: "🧬",
        name: "Business DNA",
        desc: "A permanent profile of your business model, constraints, and competitive position that BOSS uses to tailor every recommendation.",
      },
      {
        icon: "🔍",
        name: "Root Cause Analysis",
        desc: "When a KPI drops, BOSS traces the chain of causes back to the source — not just the symptom.",
      },
    ],
  },
  {
    eyebrow: "AI Workforce",
    title: "A full team working while you sleep.",
    features: [
      {
        icon: "📞",
        name: "AI Receptionist",
        desc: "Answers inbound calls and web inquiries, collects details, qualifies leads, and books appointments — 24/7.",
      },
      {
        icon: "💰",
        name: "AI Bookkeeper",
        desc: "Tracks revenue, flags overdue invoices, sends payment reminders, and produces a daily cash-flow summary.",
      },
      {
        icon: "⭐",
        name: "Review Manager",
        desc: "Requests reviews from satisfied customers at exactly the right moment and drafts responses to every new review.",
      },
      {
        icon: "📋",
        name: "Proposal Writer",
        desc: "Turns job notes and customer history into a professional estimate or proposal in under a minute.",
      },
      {
        icon: "📣",
        name: "Marketing Director",
        desc: "Identifies win-back opportunities, drafts campaigns, and tracks which messages drive bookings.",
      },
      {
        icon: "🤝",
        name: "Customer Success Manager",
        desc: "Monitors customer health scores and triggers proactive outreach before a good customer churns.",
      },
    ],
  },
  {
    eyebrow: "Automation",
    title: "Workflows that execute, not just remind.",
    features: [
      {
        icon: "⚡",
        name: "AI Action Center",
        desc: "Recommendations become one-click workflows. Review, approve, and let BOSS execute — or set it to auto-approve for fully hands-free operation.",
      },
      {
        icon: "🔄",
        name: "Loop Runtime",
        desc: "A durable workflow engine that retries on failure, holds for human approval when needed, and logs every step for audit.",
      },
      {
        icon: "📅",
        name: "Scheduler",
        desc: "Recurring tasks — daily briefs, weekly reports, follow-up sequences — run on a reliable schedule with zero maintenance.",
      },
      {
        icon: "📬",
        name: "Dead-Letter Queue",
        desc: "Failed automations are caught, held, and surfaced for review — nothing silently disappears.",
      },
    ],
  },
  {
    eyebrow: "Operations",
    title: "Run the full business from one screen.",
    features: [
      {
        icon: "👥",
        name: "Customer OS",
        desc: "Full CRM with interaction history, health scoring, revenue tracking, and AI-powered segments.",
      },
      {
        icon: "🔧",
        name: "Jobs & Appointments",
        desc: "Schedule, dispatch, start, and complete jobs. Book, confirm, remind, and reschedule appointments.",
      },
      {
        icon: "🧾",
        name: "Invoices & Payments",
        desc: "Create, send, and collect on invoices. Track every payment. Flag overdue accounts automatically.",
      },
      {
        icon: "📊",
        name: "Analytics",
        desc: "Revenue trends, job completion rates, appointment no-show rates, customer lifetime value — all in one view.",
      },
    ],
  },
  {
    eyebrow: "Integrations",
    title: "Connect the tools you already use.",
    features: [
      { icon: "📅", name: "Google Calendar", desc: "Two-way appointment sync." },
      { icon: "📒", name: "QuickBooks", desc: "Push invoices and payments, pull expense data." },
      { icon: "💳", name: "Stripe", desc: "Process card payments in-platform." },
      { icon: "🛒", name: "Shopify", desc: "Pull order and customer data." },
      { icon: "💬", name: "Slack", desc: "Route alerts and approval requests to your team channel." },
      { icon: "📮", name: "HubSpot", desc: "Sync contacts and deals bidirectionally." },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="boss-landing">
      <MarketingNav />

      <div style={{ paddingTop: "60px" }}>
        {/* Hero */}
        <section className="l-section" style={{ textAlign: "center", paddingTop: "80px" }}>
          <p className="l-section-label">Everything you need</p>
          <h1 className="l-section-title" style={{ fontSize: "clamp(2rem,5vw,3.5rem)" }}>
            One platform.<br />Every job in the business.
          </h1>
          <p className="l-section-sub" style={{ maxWidth: "560px", margin: "0 auto 32px" }}>
            BOSS replaces a patchwork of point solutions with a single AI-powered
            operating system — from the first customer enquiry to the bank reconciliation.
          </p>
          <div className="l-final-cta-btns">
            <Link href="/auth/sign-up" className="l-btn-red">Start for free</Link>
            <Link href="/pricing" className="l-btn-ghost">See pricing</Link>
          </div>
        </section>

        {/* Feature groups */}
        {FEATURE_GROUPS.map((group) => (
          <section key={group.eyebrow} className="l-section l-bg-card">
            <p className="l-section-label">{group.eyebrow}</p>
            <h2 className="l-section-title">{group.title}</h2>
            <div className="l-pain-grid">
              {group.features.map((f) => (
                <article key={f.name} className="l-pain-card">
                  <div style={{ fontSize: "28px", marginBottom: "12px" }}>{f.icon}</div>
                  <p style={{ fontWeight: 700, marginBottom: "8px", color: "var(--warm)" }}>{f.name}</p>
                  <p className="l-pain-answer">{f.desc}</p>
                </article>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <section className="l-section l-final-cta">
          <p className="l-section-label">Get started today</p>
          <h2 className="l-section-title">See it running in your business.</h2>
          <div className="l-final-cta-btns">
            <Link href="/auth/sign-up" className="l-btn-red">Get my free Health Report</Link>
            <Link href="/waitlist" className="l-btn-ghost">Book a live demo</Link>
          </div>
          <p className="l-final-note">14-day free trial · No credit card · Setup support included</p>
        </section>

        {/* Footer */}
        <footer className="l-footer">
          <div>
            <div className="l-logo">B<em>O</em>SS</div>
            <p className="l-footer-tagline">The AI team for small business owners.</p>
          </div>
          <nav aria-label="Product links">
            <p className="l-footer-col-title">Product</p>
            <ul className="l-footer-links">
              <li><Link href="/features">Features</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/waitlist">Book a demo</Link></li>
            </ul>
          </nav>
          <nav aria-label="Account links">
            <p className="l-footer-col-title">Account</p>
            <ul className="l-footer-links">
              <li><Link href="/auth/sign-up">Start free trial</Link></li>
              <li><Link href="/auth/sign-in">Sign in</Link></li>
            </ul>
          </nav>
        </footer>
        <div className="l-footer-bottom">
          <span className="l-footer-copy">© 2026 BOSS. All rights reserved.</span>
          <div className="l-footer-legal">
            <Link href="/legal/privacy">Privacy Policy</Link>
            <Link href="/legal/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
