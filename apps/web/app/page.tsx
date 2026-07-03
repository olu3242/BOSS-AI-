import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "../src/components/ui/MarketingNav";
import { HeroSection } from "../src/components/ui/HeroSection";
import { BusinessOutcomes } from "../src/components/ui/BusinessOutcomes";
import { IntelligencePreview } from "../src/components/ui/IntelligencePreview";
import { AiWorkforceSection } from "../src/components/ui/AiWorkforceSection";
import { EnterpriseTrust } from "../src/components/ui/EnterpriseTrust";
import { WorkspacePreview } from "../src/components/ui/WorkspacePreview";
import "./landing.css";

export const metadata: Metadata = {
  title: "BOSS — Your Business Operating System | AI Team for Small Business",
  description:
    "Stop drowning in paperwork. BOSS is your AI team that handles bookings, follow-ups, payments, and reviews — 24/7 — so you can focus on what you built this for.",
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <div className="boss-landing">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "BOSS",
            applicationCategory: "BusinessApplication",
            description:
              "Business Operating System Suite — AI team for small business owners.",
            offers: [
              { "@type": "Offer", price: "99", priceCurrency: "USD", name: "Starter" },
              { "@type": "Offer", price: "299", priceCurrency: "USD", name: "Growth" },
            ],
          }),
        }}
      />

      {/* ── NAV ───────────────────────────────────────────────── */}
      <MarketingNav />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── TRUST BAR ─────────────────────────────────────────── */}
      <div className="l-trust-bar" role="list" aria-label="Trusted by industries">
        <span className="l-trust-label">Trusted by</span>
        <div className="l-trust-items">
          {[
            "Dental practices", "Law firms", "Home service companies",
            "Gyms & studios", "Real estate teams", "Restaurants", "Retail shops",
          ].map((industry) => (
            <span key={industry} className="l-trust-item" role="listitem">{industry}</span>
          ))}
        </div>
      </div>

      {/* ── BUSINESS OUTCOMES ─────────────────────────────────── */}
      <BusinessOutcomes />

      {/* ── PAIN POINTS ───────────────────────────────────────── */}
      <section className="l-section" id="pain" aria-labelledby="pain-title">
        <p className="l-section-label">Sound familiar?</p>
        <h2 id="pain-title" className="l-section-title">
          The things that keep<br />you up at night.
        </h2>
        <p className="l-section-sub">
          You didn&apos;t open a business to chase invoices and send follow-up
          texts. Here&apos;s what BOSS takes off your plate.
        </p>
        <div className="l-pain-grid">
          {PAIN_POINTS.map((p) => (
            <article key={p.problem} className="l-pain-card">
              <p className="l-pain-quote" dangerouslySetInnerHTML={{ __html: p.problem }} />
              <div className="l-pain-answer">{p.solution}</div>
            </article>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="l-section l-bg-card" id="how" aria-labelledby="how-title">
        <p className="l-section-label">How it works</p>
        <h2 id="how-title" className="l-section-title">
          Set up once.<br />Let BOSS run it.
        </h2>
        <p className="l-section-sub">
          No complicated software to learn. BOSS asks you a few questions
          about your business and gets to work.
        </p>
        <div className="l-steps" role="list">
          {HOW_STEPS.map((s, i) => (
            <div key={s.title} className="l-step" role="listitem">
              <div className="l-step-num" aria-hidden="true">{i + 1}</div>
              <div className="l-step-title">{s.title}</div>
              <p className="l-step-desc">{s.desc}</p>
              <div className="l-step-time">{s.time}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── INTELLIGENCE PREVIEW ──────────────────────────────── */}
      <IntelligencePreview />

      {/* ── AI TEAM ───────────────────────────────────────────── */}
      <section className="l-section" id="team" aria-labelledby="team-title">
        <p className="l-section-label">Your AI team</p>
        <h2 id="team-title" className="l-section-title">
          Like hiring a full team —<br />for less than one employee.
        </h2>
        <p className="l-section-sub">
          Each team member has a clear job. They work around the clock, learn
          your business, and never call in sick.
        </p>
        <div className="l-employee-grid">
          {AI_TEAM.map((member) => (
            <article key={member.name} className="l-employee-card">
              <div className="l-emp-avatar" aria-hidden="true">{member.emoji}</div>
              <div className="l-emp-name">{member.name}</div>
              <p className="l-emp-handles">{member.handles}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── AI WORKFORCE ──────────────────────────────────────── */}
      <AiWorkforceSection />

      {/* ── DAILY WATCH ───────────────────────────────────────── */}
      <section className="l-section l-bg-card" aria-labelledby="daily-title">
        <p className="l-section-label">Every single day</p>
        <h2 id="daily-title" className="l-section-title">
          BOSS checks in on<br />your business overnight.
        </h2>
        <p className="l-section-sub">
          While you sleep, BOSS reviews everything — and in the morning, it
          tells you what needs your attention and what it already handled.
        </p>
        <div className="l-watch-card">
          <div className="l-watch-header">
            <span className="l-watch-header-title">Tuesday morning report — Riverside Dental</span>
            <span className="l-watch-live">
              <span className="l-live-dot" aria-hidden="true" />
              This morning, 7:14 AM
            </span>
          </div>
          {DAILY_ITEMS.map((item) => (
            <div key={item.title} className="l-watch-item">
              <div className="l-watch-icon" aria-hidden="true">{item.icon}</div>
              <div className="l-watch-content">
                <div className="l-watch-item-title">{item.title}</div>
                <p className="l-watch-item-desc">{item.desc}</p>
              </div>
              <div className={`l-watch-action${item.auto ? " l-watch-action-auto" : ""}`}>
                {item.action}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WORKSPACE PREVIEW ─────────────────────────────────── */}
      <WorkspacePreview />

      {/* ── INDUSTRIES ────────────────────────────────────────── */}
      <section className="l-section" aria-labelledby="industries-title">
        <p className="l-section-label">Built for your industry</p>
        <h2 id="industries-title" className="l-section-title">
          BOSS knows your business<br />before you even explain it.
        </h2>
        <p className="l-section-sub">
          Every industry runs differently. BOSS comes pre-loaded with the
          knowledge and routines that actually match how your business works.
        </p>
        <div className="l-industry-row" role="list">
          {INDUSTRIES.map((ind, i) => (
            <span
              key={ind}
              className="l-industry-chip"
              role="listitem"
              {...(i === 0 ? { "data-active": "" } : {})}
            >
              {ind}
            </span>
          ))}
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────── */}
      <section className="l-section l-bg-card" id="pricing" aria-labelledby="pricing-title">
        <p className="l-section-label">Simple pricing</p>
        <h2 id="pricing-title" className="l-section-title">
          Pay less than a part-time hire.<br />Get a full team.
        </h2>
        <p className="l-section-sub">No setup fees. No long contracts. Cancel any time.</p>
        <div className="l-pricing-grid">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`l-plan${plan.popular ? " l-plan-popular" : ""}`}
            >
              <div className="l-plan-name">{plan.name}</div>
              <div className="l-plan-price">
                {plan.price}<span>{plan.period}</span>
              </div>
              <p className="l-plan-tagline">{plan.tagline}</p>
              <ul className="l-plan-features">
                {plan.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <Link href={plan.cta === "Talk to our team" ? "/waitlist" : "/auth/sign-up"} className="l-plan-btn">
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────── */}
      <section className="l-section" aria-labelledby="testimonials-title">
        <p className="l-section-label">Real customers</p>
        <h2 id="testimonials-title" className="l-section-title">
          They stopped running.<br />Their business started.
        </h2>
        <div className="l-quote-grid">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="l-quote-card">
              <blockquote>
                <p className="l-quote-text" dangerouslySetInnerHTML={{ __html: `"${t.quote}"` }} />
              </blockquote>
              <figcaption className="l-quote-author">
                <div className="l-quote-avatar" aria-hidden="true">{t.emoji}</div>
                <div>
                  <div className="l-quote-name">{t.name}</div>
                  <div className="l-quote-biz">{t.biz}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── ENTERPRISE TRUST ──────────────────────────────────── */}
      <EnterpriseTrust />

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="l-section l-bg-card" aria-labelledby="faq-title">
        <p className="l-section-label">Questions</p>
        <h2 id="faq-title" className="l-section-title">
          Things people ask<br />before they sign up.
        </h2>
        <div className="l-faq-list">
          {FAQS.map((faq) => (
            <details key={faq.q} className="l-faq-item">
              <summary>
                {faq.q}
                <span className="l-faq-icon" aria-hidden="true">+</span>
              </summary>
              <p className="l-faq-answer">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="l-section l-final-cta" aria-labelledby="cta-title">
        <p className="l-section-label">Get started today</p>
        <h2 id="cta-title" className="l-section-title">
          Find out what&apos;s holding your business back — free.
        </h2>
        <p className="l-section-sub">
          Get your Business Health Report in 10 minutes. No credit card, no
          commitment. Just a clear picture of where BOSS can help.
        </p>
        <div className="l-final-cta-btns">
          <Link href="/auth/sign-up" className="l-btn-red">
            Get my free Business Health Report
          </Link>
          <Link href="/waitlist" className="l-btn-ghost">
            Book a live demo instead
          </Link>
        </div>
        <p className="l-final-note">14-day free trial · Cancel any time · Setup support included</p>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="l-footer">
        <div>
          <div className="l-logo" aria-label="BOSS">B<em>O</em>SS</div>
          <p className="l-footer-tagline">
            The AI team for small business owners.<br />
            Built by BOSS.
          </p>
        </div>
        <nav aria-label="Product links">
          <p className="l-footer-col-title">Product</p>
          <ul className="l-footer-links">
            <li><a href="#how">How it works</a></li>
            <li><a href="#team">Your AI team</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#pain">Industries</a></li>
          </ul>
        </nav>
        <nav aria-label="Company links">
          <p className="l-footer-col-title">Company</p>
          <ul className="l-footer-links">
            <li><Link href="/waitlist">Book a demo</Link></li>
            <li><Link href="/auth/sign-up">Start free trial</Link></li>
            <li><Link href="/auth/sign-in">Sign in</Link></li>
          </ul>
        </nav>
      </footer>
      <div className="l-footer-bottom">
        <span className="l-footer-copy">© 2026 BOSS — Business Operating System Suite. All rights reserved.</span>
        <div className="l-footer-legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </div>
  );
}

/* ── Static data ───────────────────────────────────────────────── */

const PAIN_POINTS = [
  {
    problem: `"I missed a <strong>call from a new customer</strong> and by the time I called back, they'd already booked someone else."`,
    solution: "BOSS answers, books, and follows up automatically",
  },
  {
    problem: `"We have <strong>five no-shows a week</strong> and I don't have time to chase everyone for reminders."`,
    solution: "BOSS sends reminders and re-fills empty spots",
  },
  {
    problem: `"A happy customer mentioned us — I keep forgetting to <strong>ask them to leave a review</strong>."`,
    solution: "BOSS asks at exactly the right moment, every time",
  },
  {
    problem: `"I quoted a job two weeks ago. I have <strong>no idea if they're still interested</strong> — I just haven't gotten back to them."`,
    solution: "BOSS follows up with your leads so nothing goes cold",
  },
  {
    problem: `"We have <strong>unpaid invoices sitting there</strong> and I hate having that awkward money conversation."`,
    solution: "BOSS handles payment reminders professionally",
  },
  {
    problem: `"I genuinely don't know if we're <strong>actually making money</strong> until I talk to my accountant."`,
    solution: "BOSS gives you a clear picture of your numbers every day",
  },
];

const HOW_STEPS = [
  {
    title: "Tell BOSS about your business",
    desc: "Answer a short questionnaire about how your business runs — what you sell, who your customers are, what you're struggling with.",
    time: "10 minutes to complete",
  },
  {
    title: "Get your Business Health Report",
    desc: "BOSS immediately shows you where your business is losing time and money, ranked by impact. You'll see things you suspected — and things you didn't.",
    time: "Ready in seconds",
  },
  {
    title: "Switch on your AI team",
    desc: "Pick from a roster of AI team members — a receptionist, a bookkeeper, a sales helper — and turn them on with one click.",
    time: "Live in under 5 minutes",
  },
  {
    title: "Watch your business improve",
    desc: "BOSS handles the daily tasks and reports what it's doing. You approve anything important and stay in control of every decision that matters.",
    time: "Results from day one",
  },
];

const AI_TEAM = [
  { emoji: "☎️", name: "Receptionist", handles: "Answers enquiries, books appointments, recovers missed calls — 24/7." },
  { emoji: "📈", name: "Sales Helper", handles: "Follows up with leads, sends quotes, and nudges warm prospects before they go cold." },
  { emoji: "📒", name: "Bookkeeper", handles: "Keeps your numbers current, spots cash flow issues early, chases unpaid invoices." },
  { emoji: "⭐", name: "Review Manager", handles: "Asks happy customers for reviews, responds to feedback, monitors your reputation." },
  { emoji: "🗓️", name: "Scheduler", handles: "Fills gaps in your calendar, sends reminders, and recovers no-shows automatically." },
  { emoji: "🤝", name: "Customer Manager", handles: "Checks in with past customers, re-engages people who went quiet, builds loyalty." },
  { emoji: "✍️", name: "Proposal Writer", handles: "Turns a quick brief into a professional quote or proposal, ready to send in minutes." },
  { emoji: "📊", name: "Business Advisor", handles: "Gives you a weekly plain-English summary of how your business is actually doing." },
];

const DAILY_ITEMS = [
  {
    icon: "💬",
    title: "3 new enquiries came in overnight",
    desc: "BOSS replied to all three, collected their details, and asked about their availability. Two are ready to book.",
    action: "Done automatically",
    auto: true,
  },
  {
    icon: "⚠️",
    title: "Thursday has 4 empty slots left",
    desc: "BOSS drafted messages to 6 patients on your waitlist. Ready to send — want it to go out now?",
    action: "Approve & send",
    auto: false,
  },
  {
    icon: "💰",
    title: "$2,400 in invoices unpaid for 14+ days",
    desc: "BOSS drafted a friendly follow-up for each. These patients usually respond when reminded by text.",
    action: "Review drafts",
    auto: false,
  },
  {
    icon: "⭐",
    title: "Sarah M. left you a 5-star review on Google",
    desc: "BOSS drafted a thank-you reply. Takes 30 seconds to personalize and post.",
    action: "Post reply",
    auto: false,
  },
];

const INDUSTRIES = [
  "🦷 Dental practices",
  "⚖️ Law firms",
  "🔧 Plumbing & HVAC",
  "🏋️ Gyms & fitness studios",
  "🏠 Real estate",
  "🍽️ Restaurants & cafés",
  "💇 Salons & spas",
  "🏡 Cleaning services",
  "🐾 Veterinary clinics",
  "📐 Contractors",
  "👓 Optometry",
  "+ many more",
];

const PLANS = [
  {
    name: "Starter",
    price: "$99",
    period: "/mo",
    tagline: "For solo owners just getting started with AI.",
    features: [
      "3 AI team members of your choice",
      "Business Health Report",
      "Daily morning briefing",
      "Up to 5 automations running",
      "Email support",
    ],
    popular: false,
    cta: "Start 14-day free trial",
  },
  {
    name: "Growth",
    price: "$299",
    period: "/mo",
    tagline: "For businesses ready to run like a well-oiled machine.",
    features: [
      "All 8 AI team members",
      "Unlimited automations",
      "Daily & real-time briefings",
      "Industry-specific playbooks",
      "Phone & email support",
    ],
    popular: true,
    cta: "Start 14-day free trial",
  },
  {
    name: "Multi-location",
    price: "Custom",
    period: "",
    tagline: "For businesses with multiple locations or franchise setups.",
    features: [
      "Everything in Growth",
      "Per-location dashboards",
      "Cross-location reporting",
      "Dedicated account manager",
      "Custom onboarding & training",
    ],
    popular: false,
    cta: "Talk to our team",
  },
];

const TESTIMONIALS = [
  {
    quote: `I used to spend an hour every morning going through missed calls and messages. Now BOSS handles all of it and I just <strong>check my morning report with my coffee.</strong>`,
    name: "Dr. Marcus Webb",
    biz: "Webb Family Dental, Austin TX",
    emoji: "🦷",
  },
  {
    quote: `We were losing 6–8 appointments a week to no-shows. BOSS got that down to <strong>almost nothing in the first month.</strong> That's real money back.`,
    name: "Renée Okafor",
    biz: "Apex Fitness Studio, Chicago IL",
    emoji: "🏋️",
  },
  {
    quote: `My Google rating went from 3.9 to 4.7 in two months. BOSS was asking the right customers at the right time. <strong>I never even had to think about it.</strong>`,
    name: "Tom Escalante",
    biz: "Escalante Plumbing, San Antonio TX",
    emoji: "🔧",
  },
];

const FAQS = [
  {
    q: "Do I need to be tech-savvy to use BOSS?",
    a: "Not at all. If you can send a text message, you can use BOSS. Setup is a 10-minute questionnaire about your business — no software to install, no complicated settings. Our onboarding team also walks you through it if you'd like.",
  },
  {
    q: "Will BOSS actually talk to my customers?",
    a: "Yes, but always in your voice. You review and approve the tone and templates before anything goes out. BOSS learns how you communicate and mirrors it. You can also set it so anything customer-facing gets your approval first.",
  },
  {
    q: "What if BOSS does something I don't want?",
    a: "BOSS will always ask for your approval before doing anything significant. Routine tasks like sending pre-approved reminders happen automatically. Anything that involves money, a customer complaint, or an unusual decision is always flagged to you first.",
  },
  {
    q: "How long does it take to see results?",
    a: "Most customers see the first improvement within 48 hours — usually a recovered lead or no-show prevention. Within 30 days, you'll have a clear picture of what BOSS has saved you in time and money.",
  },
  {
    q: "Is my business data safe?",
    a: "Yes. Your data is encrypted, stored securely, and never shared or sold. BOSS is built for businesses that handle sensitive customer information — including medical and legal practices.",
  },
  {
    q: "Can I cancel if it's not for me?",
    a: "Absolutely. No long-term contracts, no cancellation fees. Cancel any time from your account settings. We'd also love to hear what wasn't working so we can improve.",
  },
];
