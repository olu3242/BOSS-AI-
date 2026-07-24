import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "../../../src/components/ui/MarketingNav";
import "../../landing.css";

export const metadata: Metadata = {
  title: "Terms of Service — BOSS",
  description: "The terms governing your use of the BOSS Business Operating System Suite.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <div className="boss-landing">
      <MarketingNav />
      <div style={{ paddingTop: "60px" }}>
        <section className="l-section" style={{ paddingTop: "80px", maxWidth: "760px", margin: "0 auto" }}>
          <p className="l-section-label">Legal</p>
          <h1 className="l-section-title" style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)" }}>
            Terms of Service
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
            <a href="mailto:legal@useboss.ai" style={{ color: "#C8102E" }}>legal@useboss.ai</a>.
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
    title: "1. Acceptance of Terms",
    body: 'By creating an account or using the BOSS Business Operating System Suite ("Service"), you agree to these Terms of Service ("Terms"). If you are using BOSS on behalf of a business, you represent that you have authority to bind that business. If you do not agree, do not use the Service.',
  },
  {
    title: "2. Description of Service",
    body: "BOSS is an AI-powered business operating system that provides health scoring, workflow automation, an AI workforce, customer relationship management, invoicing, scheduling, and related business management capabilities. The Service is provided on a subscription basis.",
  },
  {
    title: "3. Account Registration",
    body: `<p style="margin-bottom:12px">You must provide accurate information when registering. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.</p>
<p>You must be at least 18 years old to use the Service. Accounts may not be shared across organisations.</p>`,
  },
  {
    title: "4. Subscriptions and Billing",
    body: `<p style="margin-bottom:12px"><strong style="color:var(--warm)">Free trial.</strong> All plans include a 14-day free trial. No credit card is required to start. At the end of the trial you must select a paid plan or your account becomes read-only.</p>
<p style="margin-bottom:12px"><strong style="color:var(--warm)">Billing cycle.</strong> Subscriptions are billed monthly or annually in advance. Prices are listed in USD and exclude applicable taxes.</p>
<p style="margin-bottom:12px"><strong style="color:var(--warm)">Upgrades and downgrades.</strong> Upgrades take effect immediately and are prorated. Downgrades take effect at the end of the current billing period.</p>
<p><strong style="color:var(--warm)">Cancellation.</strong> You may cancel at any time. Upon cancellation your account enters read-only mode at the end of the billing period. Your data is retained for 90 days and then permanently deleted. No partial-period refunds are issued unless required by law.</p>`,
  },
  {
    title: "5. Acceptable Use",
    body: `You agree not to:
<ul style="padding-left:20px;margin-top:8px;display:flex;flex-direction:column;gap:6px">
  <li>Use the Service for any unlawful purpose or in violation of any applicable law</li>
  <li>Transmit spam, malware, or harmful code through the Service</li>
  <li>Attempt to gain unauthorised access to another organisation's data</li>
  <li>Reverse engineer, decompile, or attempt to extract source code</li>
  <li>Use the Service to compete with BOSS or to build a substantially similar product</li>
  <li>Circumvent usage limits or billing mechanisms</li>
  <li>Impersonate any person or entity</li>
</ul>`,
  },
  {
    title: "6. Your Data",
    body: "You retain all rights to the data you input into BOSS (&ldquo;Customer Data&rdquo;). You grant BOSS a limited licence to process Customer Data solely to provide the Service. We will not use Customer Data to train AI models without your explicit consent. See our Privacy Policy for full details on how we handle your data.",
  },
  {
    title: "7. AI Features and Automation",
    body: "BOSS provides AI-generated recommendations, analyses, and automated workflows. These are tools to assist your decision-making, not substitutes for professional business, legal, financial, or medical advice. You are responsible for reviewing AI outputs before acting on them. Automated workflows execute on your instruction and you remain responsible for the business consequences.",
  },
  {
    title: "8. Third-Party Integrations",
    body: "The Service may connect to third-party platforms (Google, Intuit, Stripe, Shopify, Slack, HubSpot, and others). Your use of those services is governed by their own terms. BOSS is not responsible for third-party service failures or data practices.",
  },
  {
    title: "9. Intellectual Property",
    body: "BOSS and its licensors own all rights in the Service, including the software, AI models, brand, and documentation. Nothing in these Terms transfers intellectual property rights to you. You may not use the BOSS name, logo, or trademarks without prior written permission.",
  },
  {
    title: "10. Confidentiality",
    body: "Each party agrees to keep the other's confidential information (including product roadmaps, pricing, and non-public technical details) confidential and not to disclose it to third parties without consent. This obligation survives termination for 3 years.",
  },
  {
    title: "11. Warranties and Disclaimers",
    body: 'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. BOSS DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT AI OUTPUTS WILL BE ACCURATE OR COMPLETE.',
  },
  {
    title: "12. Limitation of Liability",
    body: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, BOSS'S TOTAL LIABILITY FOR ANY CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE WILL NOT EXCEED THE AMOUNTS PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM. IN NO EVENT WILL BOSS BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.",
  },
  {
    title: "13. Indemnification",
    body: "You agree to indemnify, defend, and hold harmless BOSS and its officers, directors, employees, and agents from any claims, liabilities, damages, and expenses (including reasonable legal fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party right.",
  },
  {
    title: "14. Termination",
    body: "BOSS may suspend or terminate your account immediately if you violate these Terms, fail to pay fees when due, or if required by law. Upon termination, your right to use the Service ceases immediately. Provisions that by their nature should survive termination (including IP, limitation of liability, and indemnification) will survive.",
  },
  {
    title: "15. Governing Law and Disputes",
    body: "These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict of law principles. Any dispute will be resolved by binding arbitration under the AAA Commercial Arbitration Rules. Class actions are waived. You may opt out of arbitration within 30 days of account creation by emailing legal@useboss.ai.",
  },
  {
    title: "16. Changes to These Terms",
    body: "We may update these Terms. Material changes will be communicated by email or in-product notice at least 30 days before the effective date. Continued use after the effective date constitutes acceptance of the updated Terms.",
  },
];
