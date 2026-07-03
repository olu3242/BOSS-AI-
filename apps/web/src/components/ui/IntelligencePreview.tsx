const PRIORITY_DECISIONS = [
  {
    urgency: "High",
    urgencyColor: "#ef4444",
    title: "Thursday has 4 open slots",
    desc: "Current waitlist can fill all 4. Send outreach now to capture $2,800 in revenue.",
    action: "Approve & send",
  },
  {
    urgency: "Medium",
    urgencyColor: "#f59e0b",
    title: "$4,200 in invoices overdue 14+ days",
    desc: "3 clients haven't responded. Friendly escalation drafted and ready.",
    action: "Review drafts",
  },
  {
    urgency: "Review",
    urgencyColor: "#3b82f6",
    title: "Q2 revenue trending 12% below target",
    desc: "Two root causes identified. Recommended actions available.",
    action: "See analysis",
  },
];

const INSIGHTS = [
  { label: "Health Score", value: "87", unit: "/100", color: "#22c55e", trend: "+4 this week" },
  { label: "Revenue MTD", value: "$124,800", unit: "", color: "#fff", trend: "+18% vs last month" },
  { label: "Tasks automated", value: "214", unit: "", color: "#fff", trend: "this week" },
  { label: "Avg. response time", value: "4 min", unit: "", color: "#fff", trend: "vs 3 hrs before" },
];

export function IntelligencePreview() {
  return (
    <section
      style={{
        padding: "100px 48px",
        background: "#141417",
      }}
      id="intelligence"
      aria-labelledby="intel-title"
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
          Business intelligence
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
            id="intel-title"
            style={{
              fontFamily: "var(--font-syne), Syne, sans-serif",
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              margin: 0,
            }}
          >
            Every morning,<br />
            your business brief.
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
            BOSS analyses everything overnight — revenue, pipeline, scheduling gaps,
            unpaid invoices, customer sentiment — and gives you exactly what
            needs your attention and in what order.
          </p>
        </div>

        {/* Dashboard mock */}
        <div
          style={{
            background: "#0a0a0b",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {/* Top bar */}
          <div
            style={{
              background: "#080808",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(200,16,46,0.7)" }} />
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
              <span style={{ marginLeft: "8px", fontSize: "11px", color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                BOSS · Executive Intelligence — Thursday, 7:14 AM
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  animation: "intel-pulse 2s ease-in-out infinite",
                }}
              />
              <span style={{ fontSize: "11px", color: "rgba(34,197,94,0.8)" }}>AI running</span>
            </div>
          </div>

          <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Left: Key metrics */}
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "rgba(255,255,255,0.25)",
                  marginBottom: "14px",
                }}
              >
                Business Overview
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                {INSIGHTS.map((ins) => (
                  <div
                    key={ins.label}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "8px",
                      padding: "14px",
                    }}
                  >
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginBottom: "6px" }}>{ins.label}</p>
                    <p
                      style={{
                        fontFamily: "var(--font-syne), Syne, sans-serif",
                        fontSize: "20px",
                        fontWeight: 800,
                        color: ins.color,
                        margin: "0 0 4px",
                      }}
                    >
                      {ins.value}
                      {ins.unit && (
                        <span style={{ fontSize: "12px", fontWeight: 400, color: "rgba(255,255,255,0.3)" }}>
                          {ins.unit}
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", margin: 0 }}>{ins.trend}</p>
                  </div>
                ))}
              </div>

              {/* Health bar */}
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", margin: 0 }}>Business Health Score</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "18px", fontWeight: 800, color: "#22c55e", fontFamily: "var(--font-syne)" }}>87</span>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>/100</span>
                  </div>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: "87%",
                      background: "linear-gradient(90deg, #16a34a, #22c55e)",
                      borderRadius: "2px",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>3 areas to improve</span>
                  <span style={{ fontSize: "10px", color: "#22c55e" }}>Strong</span>
                </div>
              </div>
            </div>

            {/* Right: Priority decisions */}
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "rgba(255,255,255,0.25)",
                  marginBottom: "14px",
                }}
              >
                Priority Decisions · 3 need your attention
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {PRIORITY_DECISIONS.map((d) => (
                  <div
                    key={d.title}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "8px",
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 600,
                          color: d.urgencyColor,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          background: `${d.urgencyColor}15`,
                          padding: "2px 8px",
                          borderRadius: "2px",
                        }}
                      >
                        {d.urgency}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#fff",
                        margin: "0 0 4px",
                      }}
                    >
                      {d.title}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.4)",
                        lineHeight: 1.5,
                        margin: "0 0 10px",
                      }}
                    >
                      {d.desc}
                    </p>
                    <button
                      style={{
                        background: "rgba(200,16,46,0.08)",
                        border: "1px solid rgba(200,16,46,0.2)",
                        color: "#C8102E",
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "5px 12px",
                        cursor: "pointer",
                        fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                        letterSpacing: "0.3px",
                      }}
                    >
                      {d.action} →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes intel-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (max-width: 900px) {
          #intelligence > div > div:last-child > div:last-child {
            grid-template-columns: 1fr !important;
          }
          #intelligence > div > div:first-of-type {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
