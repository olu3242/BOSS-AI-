import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BOSS — Business Operating System for Small Business";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#080808",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Red glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200,16,46,0.3) 0%, transparent 70%)",
          }}
        />
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 48 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: -2 }}>
            B<span style={{ color: "#C8102E" }}>O</span>SS
          </span>
        </div>
        {/* Headline */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.0,
            letterSpacing: -3,
            maxWidth: 800,
            marginBottom: 24,
          }}
        >
          The operating system for small business.
        </div>
        {/* Sub */}
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.5)", maxWidth: 680 }}>
          AI team that runs jobs, chases invoices, books appointments — 24/7.
        </div>
        {/* CTA badge */}
        <div
          style={{
            marginTop: 48,
            background: "#C8102E",
            color: "#fff",
            padding: "14px 28px",
            fontSize: 20,
            fontWeight: 600,
            borderRadius: 6,
          }}
        >
          Start free — no card needed
        </div>
      </div>
    ),
    { ...size }
  );
}
