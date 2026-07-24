import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "../../../src/components/ui/MarketingNav";
import "../../landing.css";

export const metadata: Metadata = {
  title: "Privacy Policy — BOSS",
  description: "How BOSS collects, uses, and protects your personal and business data.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="boss-landing">
      <MarketingNav />
      <div style={{ paddingTop: "60px" }}>
        <section className="l-section" style={{ paddingTop: "80px", maxWidth: "760px", margin: "0 auto" }}>
          <p className="l-section-label">Legal</p>
          <h1 className="l-section-title" style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)" }}>
            Privacy Policy
          </h1>
          <p style={{ color: "var(--warm-dim)", fontSize: "14px", marginBottom: "48px" }}>
            Effective date: January 1, 2026 · Last updated: January 1, 2026
          </p>

          {SECTIONS.map(({ title, body }) => (
            <div key={title} style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--warm)", marginBottom: "12px" }}>
                {title}
              </h2>
              <div style={{ color: "var(--warm-dim)", fontSize: "15px", lineHeight: "1.75" }}
                dangerouslySetInnerHTML={{ __html: body }} />
            </div>
          ))}

          <p style={{ color: "var(--warm-dim)", fontSize: "14px", marginTop: "48px", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "24px" }}>
            Questions? Email us at{" "}
            <a href="mailto:privacy@useboss.ai" style={{ color: "#C8102E" }}>privacy@useboss.ai</a>.
          </p>
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

const SECTIONS = [
  {
    title: "1. Who We Are",
    body: "BOSS (Business Operating System Suite) is operated by BOSS Technologies, Inc. ("BOSS," "we," "us," or "our"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform at useboss.ai and related services.",
  },
  {
    title: "2. Information We Collect",
    body: `<p style="margin-bottom:12px"><strong style="color:var(--warm)">Account information.</strong> When you create an account we collect your name, email address, and password hash. If you add team members, we collect their email addresses.</p>
<p style="margin-bottom:12px"><strong style="color:var(--warm)">Business profile.</strong> During onboarding you provide your business name, industry, location(s), and operational details. This forms your Business DNA and is used to power AI recommendations.</p>
<p style="margin-bottom:12px"><strong style="color:var(--warm)">Business data.</strong> You may upload or connect customer records, invoices, appointments, jobs, and payment history. This data is stored and processed to generate health scores, action plans, and automated workflows on your behalf.</p>
<p style="margin-bottom:12px"><strong style="color:var(--warm)">Integration data.</strong> If you connect third-party services (Google Calendar, QuickBooks, Stripe, Shopify, Slack, HubSpot), we receive data from those services subject to their own privacy policies and your authorisation.</p>
<p><strong style="color:var(--warm)">Usage data.</strong> We automatically collect log data including IP address, browser type, pages visited, features used, and timestamps. We use this for security, support, and product improvement.</p>`,
  },
  {
    title: "3. How We Use Your Information",
    body: `We use your information to:
<ul style="padding-left:20px;margin-top:8px;display:flex;flex-direction:column;gap:6px">
  <li>Provide, maintain, and improve the BOSS platform</li>
  <li>Generate Business Health Scores, MRI reports, and AI-driven action plans</li>
  <li>Execute automated workflows on your behalf (AI Workforce)</li>
  <li>Send transactional emails (receipts, alerts, approval requests)</li>
  <li>Respond to support inquiries</li>
  <li>Detect fraud and enforce our Terms of Service</li>
  <li>Comply with legal obligations</li>
</ul>
<p style="margin-top:12px">We do <strong>not</strong> sell your data to third parties. We do not use your business data to train our AI models without your explicit consent.</p>`,
  },
  {
    title: "4. Data Isolation and Multi-Tenancy",
    body: "Each BOSS organisation is fully tenant-isolated. Your data is stored under a unique organisation ID and is never accessible to other organisations. Row-level security is enforced at the database layer. AI employees and workflows operate exclusively within your organisation's data boundary.",
  },
  {
    title: "5. Data Sharing",
    body: `We share data only in the following circumstances:
<ul style="padding-left:20px;margin-top:8px;display:flex;flex-direction:column;gap:6px">
  <li><strong style="color:var(--warm)">Service providers.</strong> We engage Supabase (database), Anthropic (AI inference), Vercel (hosting), and similar infrastructure providers under strict data processing agreements. They process data on our behalf and may not use it for their own purposes.</li>
  <li><strong style="color:var(--warm)">Integrations you authorise.</strong> When you connect a third-party service, data flows to that service per your instruction.</li>
  <li><strong style="color:var(--warm)">Legal requirements.</strong> We may disclose data when required by law or to protect rights, property, or safety.</li>
  <li><strong style="color:var(--warm)">Business transfers.</strong> In the event of a merger or acquisition, data may be transferred to the successor entity, with notice to you.</li>
</ul>`,
  },
  {
    title: "6. Data Retention",
    body: "We retain your data for as long as your account is active. If you cancel, your data is retained in read-only state for 90 days to allow export, then permanently deleted. Audit logs are retained for 7 years to meet financial record-keeping requirements. You may request earlier deletion by contacting us.",
  },
  {
    title: "7. Security",
    body: "All data is encrypted in transit (TLS 1.2+) and at rest (AES-256). Credentials and API keys are stored in encrypted vaults and are never returned via API responses. We conduct regular security reviews and follow OWASP best practices. We will notify you of any breach affecting your data within 72 hours of discovery.",
  },
  {
    title: "8. Your Rights",
    body: `Depending on your jurisdiction you may have the right to:
<ul style="padding-left:20px;margin-top:8px;display:flex;flex-direction:column;gap:6px">
  <li>Access a copy of your personal data</li>
  <li>Correct inaccurate data</li>
  <li>Delete your data ("right to be forgotten")</li>
  <li>Export your data in a portable format</li>
  <li>Object to or restrict certain processing</li>
  <li>Withdraw consent where processing is based on consent</li>
</ul>
<p style="margin-top:12px">To exercise any right, email <a href="mailto:privacy@useboss.ai" style="color:#C8102E">privacy@useboss.ai</a>. We will respond within 30 days.</p>`,
  },
  {
    title: "9. Cookies",
    body: "We use strictly necessary session cookies (httpOnly, SameSite=Lax) to maintain authenticated sessions. We do not use tracking cookies or third-party advertising cookies. You may disable cookies in your browser settings, but this will prevent login.",
  },
  {
    title: "10. Children",
    body: "BOSS is a business platform intended for users aged 18 and over. We do not knowingly collect data from anyone under 18. If you believe a minor has created an account, contact us immediately and we will delete it.",
  },
  {
    title: "11. Changes to This Policy",
    body: "We may update this Privacy Policy periodically. Material changes will be communicated by email or in-product notification at least 30 days before they take effect. Continued use after the effective date constitutes acceptance.",
  },
];
