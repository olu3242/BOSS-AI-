import type { Metadata } from "next";
import Link from "next/link";
import "../landing.css";

export const metadata: Metadata = {
  title: "Book a Demo — BOSS",
  description: "See BOSS in action. Book a 30-minute live demo and get your free Business Health Report.",
  robots: { index: true, follow: true },
};

export default function WaitlistPage() {
  return (
    <div className="boss-landing">
      <nav className="l-nav">
        <Link href="/" className="l-logo">
          B<em>O</em>SS
        </Link>
        <div className="l-nav-right">
          <Link href="/" className="l-nav-link">← Back to home</Link>
          <Link href="/auth/sign-up" className="l-nav-btn">Start free instead</Link>
        </div>
      </nav>

      <main style={{ paddingTop: "100px", minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "60px 48px" }}>
          <p className="l-section-label">Book a demo</p>
          <h1 className="l-section-title">
            See BOSS work on your business — live.
          </h1>
          <p className="l-section-sub" style={{ marginBottom: "40px" }}>
            We&apos;ll run a Business Health scan on your business in real time and show
            you exactly what BOSS would fix first. Free, no commitment, 30 minutes.
          </p>

          <WaitlistForm />

          <p style={{ marginTop: "24px", fontSize: "13px", color: "var(--muted)", lineHeight: "1.6" }}>
            Rather start immediately?{" "}
            <Link href="/auth/sign-up" style={{ color: "var(--red)", textDecoration: "none" }}>
              Begin your 14-day free trial
            </Link>{" "}
            — no credit card needed.
          </p>
        </div>
      </main>
    </div>
  );
}

function WaitlistForm() {
  return (
    <form action="/api/waitlist" method="POST" style={formStyle}>
      <div style={fieldStyle}>
        <label htmlFor="name" style={labelStyle}>Your name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Jane Smith"
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label htmlFor="email" style={labelStyle}>Work email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="jane@yourbusiness.com"
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label htmlFor="business" style={labelStyle}>Business name</label>
        <input
          id="business"
          name="business"
          type="text"
          required
          placeholder="Riverside Dental"
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label htmlFor="industry" style={labelStyle}>Industry</label>
        <select id="industry" name="industry" required style={inputStyle}>
          <option value="">Select your industry</option>
          <option>Dental practice</option>
          <option>Law firm</option>
          <option>Home services (plumbing, HVAC, electrical)</option>
          <option>Gym or fitness studio</option>
          <option>Real estate</option>
          <option>Restaurant or café</option>
          <option>Salon or spa</option>
          <option>Cleaning service</option>
          <option>Veterinary clinic</option>
          <option>Retail shop</option>
          <option>Contractor</option>
          <option>Other</option>
        </select>
      </div>
      <div style={fieldStyle}>
        <label htmlFor="employees" style={labelStyle}>Team size</label>
        <select id="employees" name="employees" style={inputStyle}>
          <option value="">Select team size</option>
          <option>Just me</option>
          <option>2–5 people</option>
          <option>6–15 people</option>
          <option>16–50 people</option>
          <option>50+ people</option>
        </select>
      </div>
      <button type="submit" className="l-btn-red" style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}>
        Book my free 30-minute demo
      </button>
    </form>
  );
}

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--warm-dim)",
};

const inputStyle: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  color: "var(--warm)",
  padding: "12px 14px",
  fontSize: "15px",
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
  outline: "none",
  width: "100%",
};
