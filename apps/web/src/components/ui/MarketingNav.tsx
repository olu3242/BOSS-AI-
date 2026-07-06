"use client";

import { useState } from "react";
import Link from "next/link";

export function MarketingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 48px",
        background: "rgba(10, 10, 11, 0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-syne), Syne, sans-serif",
          fontSize: "20px",
          fontWeight: 800,
          letterSpacing: "-0.5px",
          color: "#fff",
          textDecoration: "none",
        }}
      >
        B<em style={{ fontStyle: "normal", color: "#C8102E" }}>O</em>SS
      </Link>

      {/* Desktop links */}
      <div
        className="hidden sm:flex items-center"
        style={{ gap: "28px" }}
      >
        <a href="#how" style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>
          How it works
        </a>
        <a href="#team" style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>
          Your team
        </a>
        <a href="#pricing" style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>
          Pricing
        </a>
        <Link href="/auth/sign-in" style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>
          Sign in
        </Link>
        <Link
          href="/auth/sign-up"
          style={{
            background: "#C8102E",
            color: "#fff",
            padding: "9px 20px",
            fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Start free — no card needed
        </Link>
      </div>

      {/* Mobile hamburger */}
      <button
        className="sm:hidden"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          padding: "8px",
          fontSize: "20px",
          lineHeight: 1,
        }}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="sm:hidden"
          style={{
            position: "absolute",
            top: "60px",
            left: 0,
            right: 0,
            background: "rgba(10,10,11,0.98)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {[
            { href: "#how", label: "How it works" },
            { href: "#team", label: "Your team" },
            { href: "#pricing", label: "Pricing" },
            { href: "/auth/sign-in", label: "Sign in" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}
            >
              {label}
            </a>
          ))}
          <Link
            href="/auth/sign-up"
            onClick={() => setMenuOpen(false)}
            style={{
              background: "#C8102E",
              color: "#fff",
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Start free
          </Link>
        </div>
      )}
    </nav>
  );
}
