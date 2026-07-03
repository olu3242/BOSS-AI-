const WORKFORCE_STATS = [
  {
    value: "214",
    label: "tasks completed",
    sublabel: "this week, per business",
    icon: "✓",
  },
  {
    value: "21hrs",
    label: "saved per owner",
    sublabel: "every single week",
    icon: "⏱",
  },
  {
    value: "4 min",
    label: "avg. response time",
    sublabel: "was 3 hours before BOSS",
    icon: "⚡",
  },
  {
    value: "100%",
    label: "of routines automated",
    sublabel: "zero manual follow-up",
    icon: "🔁",
  },
];

const WORKFORCE_ACTIVITIES = [
  { time: "2:17 AM", activity: "Followed up with 3 leads from yesterday's enquiries", status: "Done" },
  { time: "3:41 AM", activity: "Sent invoice reminders to 4 overdue accounts", status: "Done" },
  { time: "5:05 AM", activity: "Analysed this week's revenue vs 4-week average", status: "Done" },
  { time: "6:30 AM", activity: "Prepared your morning brief with 3 priority actions", status: "Done" },
  { time: "7:14 AM", activity: "You wake up. BOSS has already worked 5 hours.", status: "Live" },
];

export function AiWorkforceSection() {
  return (
    <section
      style={{
        padding: "100px 48px",
        background: "#0a0a0b",
      }}
      id="workforce"
      aria-labelledby="workforce-title"
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
          Your AI workforce
        </p>
        <h2
          id="workforce-title"
          style={{
            fontFamily: "var(--font-syne), Syne, sans-serif",
            fontSize: "clamp(32px, 4vw, 52px)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-1.5px",
            margin: "0 0 16px",
          }}
        >
          Your business,<br />
          working while you sleep.
        </h2>
        <p
          style={{
            fontSize: "17px",
            fontWeight: 300,
            color: "rgba(245,240,235,0.55)",
            maxWidth: "520px",
            lineHeight: 1.7,
            margin: "0 0 64px",
          }}
        >
          BOSS doesn&apos;t clock out. Every night it reviews your pipeline,
          chases outstanding items, prepares for tomorrow — so the first thing
          you see in the morning is a clear list of what matters, not a backlog.
        </p>

        {/* Stats grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: "48px",
          }}
        >
          {WORKFORCE_STATS.map((s) => (
            <div
              key={s.label}
              style={{
                background: "#141417",
                padding: "36px 28px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  background: "rgba(200,16,46,0.08)",
                  border: "1px solid rgba(200,16,46,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  marginBottom: "20px",
                }}
              >
                {s.icon}
              </div>
              <p
                style={{
                  fontFamily: "var(--font-syne), Syne, sans-serif",
                  fontSize: "36px",
                  fontWeight: 800,
                  color: "#fff",
                  margin: "0 0 4px",
                  letterSpacing: "-1px",
                }}
              >
                {s.value}
              </p>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "rgba(245,240,235,0.7)",
                  margin: "0 0 4px",
                }}
              >
                {s.label}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "rgba(245,240,235,0.3)",
                  margin: 0,
                }}
              >
                {s.sublabel}
              </p>
            </div>
          ))}
        </div>

        {/* Activity timeline */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.06)",
            background: "#141417",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "#1c1c21",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 500, color: "rgba(245,240,235,0.6)" }}>
              Overnight activity — Riverside Dental
            </span>
            <span style={{ fontSize: "11px", color: "rgba(245,240,235,0.3)" }}>Last night</span>
          </div>
          {WORKFORCE_ACTIVITIES.map((a, i) => (
            <div
              key={a.time}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                padding: "16px 24px",
                borderBottom: i < WORKFORCE_ACTIVITIES.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: a.status === "Live" ? "rgba(200,16,46,0.04)" : "transparent",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "rgba(245,240,235,0.25)",
                  fontFamily: "monospace",
                  flexShrink: 0,
                  width: "48px",
                }}
              >
                {a.time}
              </span>
              <p
                style={{
                  fontSize: "13px",
                  color: a.status === "Live" ? "rgba(245,240,235,0.9)" : "rgba(245,240,235,0.5)",
                  margin: 0,
                  flex: 1,
                  fontWeight: a.status === "Live" ? 500 : 300,
                }}
              >
                {a.activity}
              </p>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: a.status === "Live" ? "#C8102E" : "rgba(34,197,94,0.7)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  flexShrink: 0,
                }}
              >
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #workforce > div > div:first-of-type {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 500px) {
          #workforce > div > div:first-of-type {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
