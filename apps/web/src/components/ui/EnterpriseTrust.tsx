const TRUST_PILLARS = [
  {
    icon: "🔒",
    title: "Bank-grade security",
    desc: "All data encrypted at rest and in transit. SOC 2-aligned practices. Your customer data never leaves your encrypted environment.",
  },
  {
    icon: "🛡",
    title: "Privacy by design",
    desc: "Your business data is never sold, shared, or used to train models for other businesses. What's yours stays yours.",
  },
  {
    icon: "📋",
    title: "Full audit trail",
    desc: "Every action BOSS takes is logged with timestamp, context, and outcome. You can review, export, or dispute anything at any time.",
  },
  {
    icon: "✋",
    title: "Human approval gates",
    desc: "You define what BOSS can do autonomously and what requires your sign-off. Sensitive actions always route to you first.",
  },
  {
    icon: "👤",
    title: "Role-based access",
    desc: "Invite staff with appropriate permissions. Managers see what's relevant. Owners see everything. Data scoped by role.",
  },
  {
    icon: "🏢",
    title: "Multi-business ready",
    desc: "Run multiple businesses from a single login. Each location, brand, or entity stays completely isolated — no data crossover.",
  },
];

export function EnterpriseTrust() {
  return (
    <section
      style={{
        padding: "100px 48px",
        background: "#141417",
      }}
      id="trust"
      aria-labelledby="trust-title"
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "#C8102E",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          Built for businesses that matter
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "48px",
            alignItems: "end",
            marginBottom: "64px",
          }}
        >
          <h2
            id="trust-title"
            style={{
              fontFamily: "var(--font-syne), Syne, sans-serif",
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              margin: 0,
            }}
          >
            Enterprise-grade trust.<br />
            Small business price.
          </h2>
          <p
            style={{
              fontSize: "17px",
              fontWeight: 300,
              color: "rgba(245,240,235,0.55)",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            BOSS handles sensitive customer information for medical practices,
            law firms, and financial services. We are built to the standard
            those industries demand — and every BOSS customer benefits from it.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {TRUST_PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              style={{
                background: "#0a0a0b",
                padding: "36px 32px",
                transition: "background 0.25s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "#141417";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "#0a0a0b";
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  background: "rgba(200,16,46,0.08)",
                  border: "1px solid rgba(200,16,46,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  marginBottom: "20px",
                }}
              >
                {pillar.icon}
              </div>
              <p
                style={{
                  fontFamily: "var(--font-syne), Syne, sans-serif",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#fff",
                  margin: "0 0 10px",
                }}
              >
                {pillar.title}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "rgba(245,240,235,0.5)",
                  lineHeight: 1.65,
                  fontWeight: 300,
                  margin: 0,
                }}
              >
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom assurance bar */}
        <div
          style={{
            marginTop: "32px",
            padding: "20px 28px",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            gap: "40px",
            flexWrap: "wrap",
          }}
        >
          {[
            "99.9% uptime SLA",
            "Data portability — export anytime",
            "No vendor lock-in",
            "Delete your data, any time",
            "24/7 incident response",
          ].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#22c55e", fontSize: "12px" }}>✓</span>
              <span style={{ fontSize: "13px", color: "rgba(245,240,235,0.4)" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #trust > div > div:nth-child(3) {
            grid-template-columns: 1fr 1fr !important;
          }
          #trust > div > div:nth-child(2) {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          #trust > div > div:nth-child(3) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
