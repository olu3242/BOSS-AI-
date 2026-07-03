const RECENT_ACTIVITY = [
  { dot: "#22c55e", text: "Invoice #3021 paid — Johnson & Co. · $3,400" },
  { dot: "#C8102E", text: "New enquiry: roof repair, 3br house — follow-up drafted" },
  { dot: "#3b82f6", text: "Google review responded to — Riverside Dental" },
  { dot: "#f59e0b", text: "Thursday 2pm slot filled from waitlist" },
  { dot: "#22c55e", text: "Payroll verified — 8 team members, no discrepancies" },
];

const REVENUE_BARS = [
  { month: "Jan", value: 68, amount: "$68K" },
  { month: "Feb", value: 72, amount: "$72K" },
  { month: "Mar", value: 81, amount: "$81K" },
  { month: "Apr", value: 78, amount: "$78K" },
  { month: "May", value: 95, amount: "$95K" },
  { month: "Jun", value: 100, amount: "$112K" },
];

export function WorkspacePreview() {
  return (
    <section
      style={{
        padding: "100px 48px",
        background: "#080808",
      }}
      id="workspace"
      aria-labelledby="workspace-title"
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
          Executive workspace
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "48px",
            alignItems: "end",
            marginBottom: "48px",
          }}
        >
          <h2
            id="workspace-title"
            style={{
              fontFamily: "var(--font-syne), Syne, sans-serif",
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              margin: 0,
            }}
          >
            Command your business<br />
            from one screen.
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
            The Executive Workspace puts everything that matters in front of you —
            business health, revenue trajectory, open decisions, recent activity —
            in a single, calm view designed for a busy owner.
          </p>
        </div>

        {/* Full-width workspace mock */}
        <div
          style={{
            border: "1px solid rgba(200,16,46,0.15)",
            background: "rgba(200,16,46,0.04)",
            borderRadius: "12px",
            padding: "2px",
          }}
        >
          <div
            style={{
              background: "#111",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            {/* Titlebar */}
            <div
              style={{
                background: "#0a0a0a",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(200,16,46,0.7)" }} />
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
              <span style={{ marginLeft: "12px", fontSize: "11px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                BOSS · Executive Workspace
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "10px",
                  color: "rgba(34,197,94,0.8)",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#22c55e",
                    display: "inline-block",
                  }}
                />
                AI Workforce Active
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr",
                minHeight: "400px",
              }}
            >
              {/* Sidebar */}
              <div
                style={{
                  borderRight: "1px solid rgba(255,255,255,0.05)",
                  padding: "20px 0",
                  background: "#0d0d0d",
                }}
              >
                {[
                  { icon: "⊞", label: "Executive Overview", active: true },
                  { icon: "📊", label: "Business Health" },
                  { icon: "💰", label: "Revenue & Cash Flow" },
                  { icon: "📅", label: "Scheduling" },
                  { icon: "👥", label: "Customer Pipeline" },
                  { icon: "⚙️", label: "AI Workforce" },
                  { icon: "📋", label: "Audit Trail" },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "9px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: item.active ? "rgba(200,16,46,0.08)" : "transparent",
                      borderRight: item.active ? "2px solid #C8102E" : "2px solid transparent",
                    }}
                  >
                    <span style={{ fontSize: "13px", opacity: item.active ? 1 : 0.4 }}>{item.icon}</span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: item.active ? "#fff" : "rgba(255,255,255,0.3)",
                        fontWeight: item.active ? 500 : 400,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Top stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                  {[
                    { label: "Health Score", value: "87", sub: "/100", color: "#22c55e" },
                    { label: "Revenue MTD", value: "$124K", sub: "+18%", color: "#fff" },
                    { label: "Open Decisions", value: "3", sub: "need review", color: "#f59e0b" },
                    { label: "Tasks Today", value: "47", sub: "automated", color: "#3b82f6" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "6px",
                        padding: "12px 14px",
                      }}
                    >
                      <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {stat.label}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-syne), Syne, sans-serif",
                          fontSize: "22px",
                          fontWeight: 800,
                          color: stat.color,
                          margin: "0 0 2px",
                        }}
                      >
                        {stat.value}
                      </p>
                      <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", margin: 0 }}>{stat.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Revenue chart + activity */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", flex: 1 }}>
                  {/* Revenue bars */}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "6px",
                      padding: "14px",
                    }}
                  >
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Revenue — Last 6 months
                    </p>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
                      {REVENUE_BARS.map((bar) => (
                        <div
                          key={bar.month}
                          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}
                        >
                          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                            <div
                              style={{
                                width: "100%",
                                height: `${bar.value}%`,
                                background: bar.month === "Jun"
                                  ? "linear-gradient(180deg, #C8102E, rgba(200,16,46,0.6))"
                                  : "rgba(255,255,255,0.08)",
                                borderRadius: "2px 2px 0 0",
                                minHeight: "4px",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.2)" }}>{bar.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent activity */}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "6px",
                      padding: "14px",
                      overflow: "hidden",
                    }}
                  >
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Recent Activity
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                      {RECENT_ACTIVITY.map((a, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "7px 0",
                            borderBottom: i < RECENT_ACTIVITY.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                          }}
                        >
                          <div
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: a.dot,
                              flexShrink: 0,
                            }}
                          />
                          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.4 }}>
                            {a.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #workspace > div > div:nth-child(2) {
            grid-template-columns: 1fr !important;
          }
          #workspace > div > div:last-child > div > div:last-child > div:last-child {
            grid-template-columns: 1fr !important;
          }
          #workspace > div > div:last-child > div > div:last-child > div:first-child {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
