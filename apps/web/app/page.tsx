import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "../src/components/ui/MarketingNav";
import { HeroSection } from "../src/components/ui/HeroSection";
import { BusinessOutcomes } from "../src/components/ui/BusinessOutcomes";
import { CircularWorkflow } from "../src/components/ui/CircularWorkflow";
import "./landing.css";

export const metadata: Metadata = {
  title: "BOSS — Know What Your Business Needs Today",
  description:
    "Get a free Business Health Report that shows what is costing time, cash, bookings, and follow-up momentum in your business.",
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
              "BOSS gives small business owners a daily health report and clear next actions.",
          }),
        }}
      />

      {/* ── NAV ───────────────────────────────────────────────── */}
      <MarketingNav />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── TRUST BAR ─────────────────────────────────────────── */}
      <div className="l-trust-bar" role="list" aria-label="Trusted by industries">
        <span className="l-trust-label">Built for</span>
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
          Tell us.<br />Analyze. Activate.
        </h2>
        <p className="l-section-sub">
          No complicated software to learn. BOSS starts with a quick health
          report, then helps you act on the highest-impact fixes first.
        </p>
        <CircularWorkflow />
      </section>

      {/* ── DAILY WATCH ───────────────────────────────────────── */}
      <section className="l-section l-bg-card" aria-labelledby="daily-title">
        <p className="l-section-label">The daily payoff</p>
        <h2 id="daily-title" className="l-section-title">
          Your morning brief,<br />ready before coffee.
        </h2>
        <p className="l-section-sub">
          Instead of digging through calls, invoices, calendars, and messages,
          you get the few actions that will actually move the business today.
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

      {/* ── TESTIMONIALS ──────────────────────────────────────── */}
      <section className="l-section" id="proof" aria-labelledby="testimonials-title">
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
            <li><Link href="/features">Features</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><a href="#how">How it works</a></li>
            <li><a href="#proof">Proof</a></li>
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
          <Link href="/legal/privacy">Privacy Policy</Link>
          <Link href="/legal/terms">Terms of Service</Link>
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

