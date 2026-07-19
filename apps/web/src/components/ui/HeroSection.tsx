"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: "21", label: "hours saved weekly" },
  { value: "$18K", label: "avg. monthly cash lift" },
  { value: "4.9x", label: "clearer visibility" },
  { value: "10m", label: "health report setup" },
];

const HERO_SCENES = [
  {
    label: "Healthcare",
    image: "/industry/healthcare.jpeg",
    caption: "Recover missed calls, reduce no-shows, and keep patient follow-up moving.",
  },
  {
    label: "Retail",
    image: "/industry/retail-showroom.jpeg",
    caption: "See store activity, inventory signals, and customer momentum in one view.",
  },
  {
    label: "Construction",
    image: "/industry/construction-field.jpeg",
    caption: "Keep estimates, crews, approvals, and collections from slipping.",
  },
  {
    label: "Operations",
    image: "/industry/executive-team.jpeg",
    caption: "Turn scattered work into a daily operating rhythm for the whole team.",
  },
];

export function HeroSection() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    const el = headlineRef.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(24px)";
    const t = setTimeout(() => {
      el.style.transition = "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveScene((current) => (current + 1) % HERO_SCENES.length);
    }, 4600);

    return () => clearInterval(t);
  }, []);

  const active = HERO_SCENES[activeScene] ?? HERO_SCENES[0]!;

  return (
    <header
      style={{
        minHeight: "100vh",
        padding: "140px 48px 100px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background: "#080808",
      }}
    >
      {/* Radial accent glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: "700px",
          height: "500px",
          top: "10%",
          right: "-80px",
          background: "radial-gradient(ellipse, rgba(200,16,46,0.18) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      {/* Bottom left subtle glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          bottom: "0",
          left: "-100px",
          background: "radial-gradient(ellipse, rgba(200,16,46,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        <div className="l-hero-inner">
          {/* Left: copy */}
          <div>
            {/* Tag */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(200,16,46,0.08)",
                border: "1px solid rgba(200,16,46,0.2)",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 500,
                color: "rgba(200,16,46,0.9)",
                letterSpacing: "0.5px",
                marginBottom: "36px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#C8102E",
                  animation: "heroPulse 2.5s ease-in-out infinite",
                }}
              />
              For owners who need the day to run cleaner
            </div>

            {/* Headline */}
            <h1
              ref={headlineRef}
              style={{
                fontFamily: "var(--font-syne), Syne, sans-serif",
                fontSize: "clamp(44px, 5.5vw, 80px)",
                fontWeight: 800,
                lineHeight: 1.0,
                letterSpacing: "-2.5px",
                color: "#FFFFFF",
                margin: "0 0 28px",
              }}
            >
              Wake up knowing<br />
              what your business{" "}
              <span style={{ color: "#C8102E" }}>needs<br />today.</span>
            </h1>

            {/* Sub */}
            <p
              style={{
                fontSize: "clamp(16px, 1.5vw, 19px)",
                fontWeight: 300,
                color: "rgba(255,255,255,0.55)",
                maxWidth: "440px",
                lineHeight: 1.75,
                margin: "0 0 48px",
              }}
            >
              BOSS finds the missed calls, open invoices, empty slots, and
              follow-ups costing you money, then turns them into a clear daily plan.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
              <Link
                href="/auth/sign-up"
                style={{
                  background: "#C8102E",
                  color: "#fff",
                  padding: "14px 32px",
                  fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  transition: "opacity 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
              >
                Get my free Health Report
              </Link>
              <Link
                href="/waitlist"
                style={{
                  background: "transparent",
                  color: "rgba(255,255,255,0.55)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: "14px 32px",
                  fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                  fontSize: "15px",
                  fontWeight: 400,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  transition: "border-color 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
              >
                Book a live demo
              </Link>
            </div>

            <p style={{ marginTop: "20px", fontSize: "13px", color: "rgba(255,255,255,0.25)" }}>
              No credit card. No software project. Just a clear picture of what to fix first.
            </p>

            {/* Stats row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "24px",
                marginTop: "56px",
                paddingTop: "40px",
                borderTop: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {STATS.map((s) => (
                <div key={s.label}>
                  <p
                    style={{
                      fontFamily: "var(--font-syne), Syne, sans-serif",
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#FFFFFF",
                      margin: "0 0 4px",
                    }}
                  >
                    {s.value}
                  </p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: industry carousel */}
          <aside className="l-hero-carousel" aria-label="Business industry examples">
            <div className="l-hero-carousel-frame">
              {HERO_SCENES.map((scene, index) => (
                <div
                  key={scene.label}
                  className={`l-hero-carousel-image${index === activeScene ? " is-active" : ""}`}
                  style={{ backgroundImage: `url("${scene.image}")` }}
                  aria-hidden={index !== activeScene}
                />
              ))}
              <div
                className="l-hero-carousel-shade"
                aria-hidden="true"
              />
              <div className="l-hero-carousel-content">
                <p className="l-hero-carousel-kicker">Built across real operating environments</p>
                <h2>{active.label}</h2>
                <p>{active.caption}</p>
              </div>
            </div>

            <div className="l-hero-carousel-tabs" role="tablist" aria-label="Carousel industries">
              {HERO_SCENES.map((scene, index) => (
                <button
                  key={scene.label}
                  type="button"
                  role="tab"
                  aria-selected={index === activeScene}
                  aria-label={`Show ${scene.label}`}
                  onClick={() => setActiveScene(index)}
                >
                  <span />
                  {scene.label}
                </button>
              ))}
            </div>

            <div
              className="l-hero-carousel-badge"
              aria-hidden="true"
            >
              AI running now
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @keyframes heroPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </header>
  );
}
