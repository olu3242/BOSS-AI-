"use client";

const OUTCOMES = [
  {
    metric: "2× faster invoicing",
    before: "Invoices sent days late, cash held up weeks",
    after: "Auto-generated, sent same day, paid 40% faster",
    stat: "+$18K/mo",
    statLabel: "avg. cash flow improvement",
  },
  {
    metric: "3 hrs saved per day",
    before: "Owner manually handling calls, messages, follow-ups",
    after: "BOSS handles routine communication end-to-end",
    stat: "21 hrs/wk",
    statLabel: "freed for revenue-generating work",
  },
  {
    metric: "4.9× better ops visibility",
    before: "No idea what's happening until the accountant calls",
    after: "Real-time health score, daily briefing, clear priorities",
    stat: "100%",
    statLabel: "of critical issues surfaced before they escalate",
  },
  {
    metric: "Near-zero no-shows",
    before: "5–8 missed appointments per week, no systematic follow-up",
    after: "Automated reminders, waitlist fill, confirmation tracking",
    stat: "−74%",
    statLabel: "no-show rate within 30 days",
  },
  {
    metric: "4.7+ avg. review score",
    before: "Happy customers not asked, unhappy ones louder online",
    after: "BOSS asks at peak satisfaction, responds fast to all",
    stat: "+0.8 stars",
    statLabel: "average Google rating improvement",
  },
  {
    metric: "Zero cold leads",
    before: "Quotes go out, silence follows, opportunities die",
    after: "BOSS follows up on every lead until it converts or closes",
    stat: "31%",
    statLabel: "more leads converted in first 60 days",
  },
];

export function BusinessOutcomes() {
  return (
    <section
      style={{
        padding: "76px 48px",
        background: "#0a0a0b",
      }}
      id="outcomes"
      aria-labelledby="outcomes-title"
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
          Measurable transformation
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "end", marginBottom: "44px" }}>
          <h2
            id="outcomes-title"
            style={{
              fontFamily: "var(--font-syne), Syne, sans-serif",
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              margin: 0,
            }}
          >
            What changes when<br />
            BOSS runs your business.
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
            These are real outcomes from real small businesses. Not projections.
            The improvements happen because BOSS works the problems
            your team doesn&apos;t have time for.
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
          {OUTCOMES.map((o) => (
            <div
              key={o.metric}
              style={{
                background: "#141417",
                padding: "36px 32px",
                transition: "background 0.25s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "#1c1c21";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "#141417";
              }}
            >
              {/* Metric headline */}
              <p
                style={{
                  fontFamily: "var(--font-syne), Syne, sans-serif",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#fff",
                  margin: "0 0 20px",
                  letterSpacing: "-0.5px",
                }}
              >
                {o.metric}
              </p>

              {/* Before / After */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "rgba(245,240,235,0.3)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginTop: "2px",
                      flexShrink: 0,
                    }}
                  >
                    Before
                  </span>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "rgba(245,240,235,0.45)",
                      fontStyle: "italic",
                      fontWeight: 300,
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {o.before}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "#C8102E",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginTop: "2px",
                      flexShrink: 0,
                    }}
                  >
                    After
                  </span>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "rgba(245,240,235,0.7)",
                      fontWeight: 400,
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {o.after}
                  </p>
                </div>
              </div>

              {/* Stat */}
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  paddingTop: "20px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-syne), Syne, sans-serif",
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#C8102E",
                    margin: "0 0 4px",
                    letterSpacing: "-1px",
                  }}
                >
                  {o.stat}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "rgba(245,240,235,0.35)",
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {o.statLabel}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #outcomes > div > div:last-child {
            grid-template-columns: 1fr 1fr !important;
          }
          #outcomes > div > div:first-of-type {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          #outcomes > div > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
