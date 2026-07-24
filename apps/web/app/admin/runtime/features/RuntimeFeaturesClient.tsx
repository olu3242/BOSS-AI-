"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../../../../src/lib/apiClient";

// ─── Feature definitions ──────────────────────────────────────────────────────

interface FeatureProbe {
  name: string;
  category: string;
  route: string;
  apiCheck: (orgId: string, businessId?: string) => Promise<unknown>;
  requiresBusiness?: boolean;
}

const FEATURE_PROBES: FeatureProbe[] = [
  {
    name: "Marketplace",
    category: "Platform",
    route: "/marketplace",
    apiCheck: (orgId) => apiClient.getMarketplacePacks(orgId),
  },
  {
    name: "Installed Packs",
    category: "Platform",
    route: "/marketplace",
    apiCheck: (orgId) => apiClient.getInstalledPacks(orgId),
  },
  {
    name: "Business Registry",
    category: "Core",
    route: "/onboarding/setup",
    apiCheck: (orgId) => apiClient.listBusinesses(orgId),
  },
  {
    name: "Workflow Sessions",
    category: "Platform",
    route: "/onboarding/setup",
    apiCheck: async (orgId) => {
      const token = await fetch("/api/auth/token").then((r) => r.json()).then((b: { token?: string }) => b.token ?? "");
      return fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/v1/workflow-sessions/onboarding`, {
        credentials: "include",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      }).then((r) => r.json());
    },
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type FeatureResult = {
  name: string;
  category: string;
  uiStatus: "pass" | "skip";
  apiStatus: "pass" | "fail" | "skip";
  authStatus: "pass" | "fail" | "skip";
  latencyMs: number | null;
  errorCode: string | null;
  httpStatus: number | null;
  overall: "PASS" | "FAIL" | "PARTIAL" | "PENDING";
};

// ─── Component ────────────────────────────────────────────────────────────────

export function RuntimeFeaturesClient() {
  const [results, setResults] = useState<FeatureResult[]>([]);
  const [running, setRunning] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"checking" | "ok" | "error">("checking");
  const [lastRun, setLastRun] = useState<string | null>(null);

  // Resolve org from session
  useEffect(() => {
    fetch("/api/auth/token")
      .then((r) => r.json())
      .then((b: { orgId?: string }) => {
        if (b.orgId) {
          setOrgId(b.orgId);
          setSessionStatus("ok");
        } else {
          setSessionStatus("error");
        }
      })
      .catch(() => setSessionStatus("error"));
  }, []);

  const runChecks = useCallback(async () => {
    if (!orgId) return;
    setRunning(true);
    setResults(FEATURE_PROBES.map((p) => ({
      name: p.name,
      category: p.category,
      uiStatus: "pass",
      apiStatus: "skip",
      authStatus: "skip",
      latencyMs: null,
      errorCode: null,
      httpStatus: null,
      overall: "PENDING",
    })));

    const checks = FEATURE_PROBES.map(async (probe, idx) => {
      const start = Date.now();
      try {
        await probe.apiCheck(orgId);
        const latencyMs = Date.now() - start;
        setResults((prev) => prev.map((r, i) => i === idx
          ? { ...r, apiStatus: "pass", authStatus: "pass", latencyMs, overall: "PASS" }
          : r
        ));
      } catch (err) {
        const latencyMs = Date.now() - start;
        let httpStatus: number | null = null;
        let errorCode = "UNKNOWN_ERROR";
        if (err && typeof err === "object" && "status" in err) {
          httpStatus = (err as { status: number }).status;
          if (httpStatus === 401 || httpStatus === 403) {
            errorCode = "AUTH_FAILED";
          } else if (httpStatus === 404) {
            errorCode = "NOT_FOUND";
          } else if (httpStatus && httpStatus >= 500) {
            errorCode = "SERVER_ERROR";
          } else {
            errorCode = "REQUEST_FAILED";
          }
        }
        setResults((prev) => prev.map((r, i) => i === idx
          ? {
              ...r,
              apiStatus: "fail",
              authStatus: httpStatus === 401 || httpStatus === 403 ? "fail" : "pass",
              latencyMs,
              errorCode,
              httpStatus,
              overall: "FAIL",
            }
          : r
        ));
      }
    });

    await Promise.allSettled(checks);
    setRunning(false);
    setLastRun(new Date().toISOString());
  }, [orgId]);

  const passCount = results.filter((r) => r.overall === "PASS").length;
  const failCount = results.filter((r) => r.overall === "FAIL").length;
  const pendingCount = results.filter((r) => r.overall === "PENDING").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", color: "#f5f0eb", fontFamily: "DM Sans, sans-serif", padding: "2rem" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#c8102e", marginBottom: "0.5rem" }}>
            Admin / Runtime
          </p>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "2rem", fontWeight: 800, margin: "0 0 0.5rem" }}>
            Feature Runtime Matrix
          </h1>
          <p style={{ color: "#6b6b76", margin: 0 }}>
            Live health check across every major platform feature. Run before every deployment.
          </p>
        </div>

        {/* Session + controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          <SessionBadge status={sessionStatus} orgId={orgId} />
          <button
            onClick={runChecks}
            disabled={running || sessionStatus !== "ok"}
            style={{
              background: "#c8102e", color: "#fff", border: "none", borderRadius: 6,
              padding: "0.625rem 1.5rem", fontWeight: 700, cursor: running ? "not-allowed" : "pointer",
              opacity: running ? 0.6 : 1, fontSize: "0.875rem",
            }}
          >
            {running ? "Running checks…" : "Run Health Check"}
          </button>
          {lastRun && (
            <span style={{ fontSize: "0.75rem", color: "#6b6b76" }}>
              Last run: {new Date(lastRun).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Summary bar */}
        {results.length > 0 && (
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <SummaryBadge label="Pass" count={passCount} color="#4ade80" />
            <SummaryBadge label="Fail" count={failCount} color="#f87171" />
            <SummaryBadge label="Pending" count={pendingCount} color="#6b6b76" />
          </div>
        )}

        {/* Matrix table */}
        {results.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #222228" }}>
                  {["Feature", "Category", "UI", "API", "Auth", "Latency", "Error Code", "Status"].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#6b6b76", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.name} style={{ borderBottom: "1px solid #141417" }}>
                    <td style={{ padding: "0.875rem 1rem", fontWeight: 600, color: "#f5f0eb" }}>{r.name}</td>
                    <td style={{ padding: "0.875rem 1rem", color: "#6b6b76", fontSize: "0.75rem" }}>{r.category}</td>
                    <td style={{ padding: "0.875rem 1rem" }}><StatusDot status={r.uiStatus} /></td>
                    <td style={{ padding: "0.875rem 1rem" }}><StatusDot status={r.apiStatus} /></td>
                    <td style={{ padding: "0.875rem 1rem" }}><StatusDot status={r.authStatus} /></td>
                    <td style={{ padding: "0.875rem 1rem", fontVariantNumeric: "tabular-nums", color: r.latencyMs && r.latencyMs > 1000 ? "#fbbf24" : "#f5f0eb" }}>
                      {r.latencyMs != null ? `${r.latencyMs} ms` : "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontFamily: "monospace", fontSize: "0.75rem", color: "#f87171" }}>
                      {r.errorCode ?? "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <OverallBadge status={r.overall} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {results.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem", color: "#6b6b76" }}>
            <p style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>No checks run yet</p>
            <p style={{ fontSize: "0.875rem" }}>Click "Run Health Check" to audit all platform features.</p>
          </div>
        )}

        {/* Instructions */}
        <div style={{ marginTop: "2.5rem", background: "#141417", border: "1px solid #222228", borderRadius: 10, padding: "1.5rem", fontSize: "0.8125rem", color: "#6b6b76", lineHeight: 1.6 }}>
          <strong style={{ color: "#a0a0aa" }}>Release gate:</strong> All features must show PASS status before a production deployment.
          A FAIL in Auth means the session or JWT is broken. A FAIL in API with a 5xx code means the backend service is down.
          Use the Correlation ID in each feature&apos;s error screen to trace through API logs.
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SessionBadge({ status, orgId }: { status: string; orgId: string | null }) {
  const color = status === "ok" ? "#4ade80" : status === "error" ? "#f87171" : "#fbbf24";
  const label = status === "ok" ? `Session OK · ${orgId?.slice(0, 8)}…` : status === "error" ? "Session Invalid" : "Checking session…";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
      {label}
    </div>
  );
}

function SummaryBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#141417", border: `1px solid ${color}33`, borderRadius: 6, padding: "0.375rem 0.875rem" }}>
      <span style={{ fontWeight: 700, color, fontSize: "1rem", fontVariantNumeric: "tabular-nums" }}>{count}</span>
      <span style={{ color: "#6b6b76", fontSize: "0.75rem" }}>{label}</span>
    </div>
  );
}

function StatusDot({ status }: { status: "pass" | "fail" | "skip" }) {
  const map = { pass: "✓", fail: "✗", skip: "—" };
  const color = { pass: "#4ade80", fail: "#f87171", skip: "#444" };
  return <span style={{ color: color[status], fontWeight: 700 }}>{map[status]}</span>;
}

function OverallBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    PASS: { bg: "rgba(74,222,128,0.1)", text: "#4ade80" },
    FAIL: { bg: "rgba(248,113,113,0.1)", text: "#f87171" },
    PARTIAL: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24" },
    PENDING: { bg: "rgba(107,107,118,0.1)", text: "#6b6b76" },
  };
  const style = map[status] ?? { bg: "rgba(107,107,118,0.1)", text: "#6b6b76" };
  return (
    <span style={{
      background: style.bg, color: style.text, border: `1px solid ${style.text}44`,
      borderRadius: 4, padding: "0.2rem 0.625rem", fontSize: "0.7rem", fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.04em",
    }}>
      {status}
    </span>
  );
}
