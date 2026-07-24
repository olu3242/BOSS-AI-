import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "../../src/components/ui/MarketingNav";
import "../landing.css";

export const metadata: Metadata = {
  title: "Pricing — BOSS",
  description:
    "Simple, transparent pricing for BOSS. Start free, grow with your business.",
  alternates: { canonical: "/pricing" },
};

const PLANS = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "For solo operators and micro-businesses getting started with AI.",
    cta: "Start free trial",
    href: "/auth/sign-up",
    highlight: false,
    features: [
      "1 business location",
      "Business MRI & Health Score",
      "AI Receptionist",
      "Jobs & Appointments",
      "Invoices & Payments",
      "Customer CRM (up to 500 customers)",
      "5 automated workflows/month",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: "$149",
    period: "/month",
    description: "For growing businesses that want the full AI workforce running every day.",
    cta: "Start free trial",
    href: "/auth/sign-up",
    highlight: true,
    badge: "Most popular",
    features: [
      "Up to 3 business locations",
      "Full AI Workforce (13 specialists)",
      "Unlimited automated workflows",
      "Unlimited customers",
      "Google Calendar + QuickBooks integrations",
      "Stripe payment processing",
      "Business DNA & Root Cause Analysis",
      "AI Action Center",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For multi-location businesses, DSOs, and franchise groups.",
    cta: "Book a demo",
    href: "/waitlist",
    highlight: false,
    features: [
      "Unlimited locations",
      "Custom AI employee training",
      "White-label option",
      "Dedicated customer success manager",
      "SSO / SAML",
      "Custom integrations",
      "SLA guarantees",
      "On-premise deployment option",
    ],
  },
];

const FAQ = [
  {
    q: "Is there a free trial?",
    a: "Yes — every plan starts with a 14-day free trial, no credit card required. You get full access from day one.",
  },
  {
    q: "What happens after the trial?",
    a: "You choose a plan and enter payment details. If you decide not to continue, your account is downgraded to read-only — your data is never deleted.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes, you can upgrade or downgrade at any time. Upgrades take effect immediately; downgrades take effect at the end of the billing period.",
  },
  {
    q: "What counts as a 'location'?",
    a: "Each physical address or distinct operating unit (e.g. a second practice, a second van) counts as one location.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted at rest and in transit. Each organization is fully tenant-isolated — your data is never shared with other businesses.",
  },
  {
    q: "Do you have discounts for annual billing?",
    a: "Annual billing is available at a 20% discount. Contact sales or select the annual option during checkout.",
  },
];

export default function PricingPage() {
  return (
    <div className="boss-landing">
      <MarketingNav />

      <div style={{ paddingTop: "60px" }}>
        {/* Hero */}
        <section className="l-section" style={{ textAlign: "center", paddingTop: "80px" }}>
          <p className="l-section-label">Pricing</p>
          <h1 className="l-section-title" style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>
            Simple pricing.<br />No surprises.
          </h1>
          <p className="l-section-sub">
            Start free. Pay only when you are ready. Cancel any time.
          </p>
        </section>

        {/* Plans */}
        <section className="l-section" style={{ paddingTop: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
              maxWidth: "1040px",
              margin: "0 auto",
            }}
          >
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                style={{
                  background: plan.highlight ? "rgba(200,16,46,0.06)" : "var(--card)",
                  border: plan.highlight ? "1px solid rgba(200,16,46,0.35)" : "1px solid rgba(255,255,255,0.07)",
                  padding: "32px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  position: "relative",
                }}
              >
                {plan.badge ? (
                  <span
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#C8102E",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      padding: "3px 12px",
                      textTransform: "uppercase",
                    }}
                  >
                    {plan.badge}
                  </span>
                ) : null}

                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#C8102E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                    {plan.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "40px", fontWeight: 800, fontFamily: "var(--font-syne)", color: "var(--warm)" }}>
                      {plan.price}
                    </span>
                    {plan.period ? (
                      <span style={{ color: "var(--warm-dim)", fontSize: "15px" }}>{plan.period}</span>
                    ) : null}
                  </div>
                  <p style={{ color: "var(--warm-dim)", fontSize: "14px", marginTop: "8px" }}>{plan.description}</p>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "14px", color: "var(--warm-dim)" }}>
                      <span style={{ color: "#16a34a", flexShrink: 0, marginTop: "1px" }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "12px 24px",
                    background: plan.highlight ? "#C8102E" : "transparent",
                    border: plan.highlight ? "none" : "1px solid rgba(255,255,255,0.2)",
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: "14px",
                    marginTop: "auto",
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", color: "var(--warm-dim)", fontSize: "13px", marginTop: "24px" }}>
            All plans include a 14-day free trial. No credit card required.
          </p>
        </section>

        {/* FAQ */}
        <section className="l-section l-bg-card">
          <p className="l-section-label">FAQ</p>
          <h2 className="l-section-title">Common questions.</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
              maxWidth: "900px",
              margin: "0 auto",
            }}
          >
            {FAQ.map(({ q, a }) => (
              <div key={q} style={{ background: "var(--card2)", padding: "24px" }}>
                <p style={{ fontWeight: 700, color: "var(--warm)", marginBottom: "8px", fontSize: "15px" }}>{q}</p>
                <p style={{ color: "var(--warm-dim)", fontSize: "14px", lineHeight: "1.6" }}>{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="l-section l-final-cta">
          <h2 className="l-section-title">Start your free trial today.</h2>
          <div className="l-final-cta-btns">
            <Link href="/auth/sign-up" className="l-btn-red">Get started free</Link>
            <Link href="/waitlist" className="l-btn-ghost">Talk to sales</Link>
          </div>
          <p className="l-final-note">14-day free trial · Cancel any time</p>
        </section>

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
