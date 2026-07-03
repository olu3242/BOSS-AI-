import type { Metadata } from "next";
import Link from "next/link";
import "../../landing.css";

export const metadata: Metadata = {
  title: "You're booked — BOSS",
  robots: { index: false, follow: false },
};

export default function WaitlistSuccessPage() {
  return (
    <div className="boss-landing">
      <nav className="l-nav">
        <Link href="/" className="l-logo">
          B<em>O</em>SS
        </Link>
      </nav>

      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 48px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "520px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "rgba(200,16,46,0.1)",
              border: "1px solid rgba(200,16,46,0.25)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              margin: "0 auto 32px",
            }}
            aria-hidden="true"
          >
            ✓
          </div>
          <p className="l-section-label">You&apos;re on the list</p>
          <h1 className="l-section-title">
            We&apos;ll be in touch within one business day.
          </h1>
          <p className="l-section-sub" style={{ margin: "0 auto 40px", textAlign: "center" }}>
            Someone from our team will reach out to confirm your demo time and
            send you a calendar invite. In the meantime, you can start your
            free trial right now.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/sign-up" className="l-btn-red">
              Start free trial now
            </Link>
            <Link href="/" className="l-btn-ghost">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
