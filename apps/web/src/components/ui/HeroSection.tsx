"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const STATS = [
  { value: "28", label: "capabilities" },
  { value: "531", label: "tests passing" },
  { value: "100%", label: "uptime target" },
  { value: "24/7", label: "AI workforce" },
];

const PREVIEW_METRICS = [
  { label: "Revenue (MTD)", value: "$124,800", delta: "+18%", up: true },
  { label: "Jobs Completed", value: "47", delta: "+6", up: true },
  { label: "Open Invoices", value: "$31,200", delta: "12 pending", up: false },
  { label: "Avg. Review", value: "4.8 ★", delta: "+0.3", up: true },
];

export function HeroSection() {
  const headlineRef = useRef<HTMLHeadingElement>(null);

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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
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
              AI-powered · always on
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
              The operating<br />
              system for{" "}
              <span style={{ color: "#C8102E" }}>small<br />business.</span>
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
              BOSS gives every small business an AI team that runs jobs, chases invoices,
              books appointments, and surfaces decisions — 24/7.
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
                Start free — no card needed
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
                Watch 2-min demo
              </Link>
            </div>

            <p style={{ marginTop: "20px", fontSize: "13px", color: "rgba(255,255,255,0.25)" }}>
              Takes 10 minutes to set up. No tech skills needed.
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

          {/* Right: product preview */}
          <div className="hidden lg:block" style={{ position: "relative" }}>
            {/* Outer glow frame */}
            <div
              style={{
                background: "rgba(200,16,46,0.06)",
                border: "1px solid rgba(200,16,46,0.15)",
                borderRadius: "16px",
                padding: "2px",
              }}
            >
              {/* Dashboard mockup */}
              <div
                style={{
                  background: "#111111",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* Mock top bar */}
                <div
                  style={{
                    background: "#0a0a0a",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(200,16,46,0.6)" }} />
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                  <span style={{ marginLeft: "8px", fontSize: "11px", color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                    BOSS · Executive Dashboard
                  </span>
                </div>

                {/* Mock content */}
                <div style={{ padding: "20px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>
                    Business Analytics
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {PREVIEW_METRICS.map((m) => (
                      <div
                        key={m.label}
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "8px",
                          padding: "14px",
                        }}
                      >
                        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "6px" }}>{m.label}</p>
                        <p style={{ fontSize: "18px", fontWeight: 700, color: "#FFFFFF", fontFamily: "var(--font-syne), Syne, sans-serif", margin: "0 0 4px" }}>
                          {m.value}
                        </p>
                        <p style={{ fontSize: "10px", color: m.up ? "rgba(34,197,94,0.9)" : "rgba(255,255,255,0.3)" }}>
                          {m.delta}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Mock health bar */}
                  <div style={{ marginTop: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>Business Health Score</p>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "#22c55e" }}>87</p>
                    </div>
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "87%", background: "linear-gradient(90deg, #16a34a, #22c55e)", borderRadius: "2px" }} />
                    </div>
                  </div>

                  {/* Mock AI activity */}
                  <div style={{ marginTop: "10px" }}>
                    {[
                      { dot: "#C8102E", text: "Invoice #2847 sent to Johnson & Co." },
                      { dot: "#22c55e", text: "Appointment confirmed for Thursday 2pm" },
                      { dot: "#3b82f6", text: "Review response drafted and ready" },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: item.dot, flexShrink: 0 }} />
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div
              style={{
                position: "absolute",
                bottom: "-16px",
                right: "-16px",
                background: "#C8102E",
                color: "#fff",
                padding: "10px 16px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "8px",
                boxShadow: "0 8px 32px rgba(200,16,46,0.4)",
                letterSpacing: "0.3px",
              }}
            >
              🤖 AI running now
            </div>
          </div>
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
