export const BOSS_UI_VERSION = "0.1.0";

export type MetricTone = "positive" | "warning" | "critical" | "neutral";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function humanizeKey(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function toneForScore(score: number): MetricTone {
  if (score >= 75) return "positive";
  if (score >= 50) return "warning";
  return "critical";
}

export function toneForPriority(priority: string): MetricTone {
  if (priority === "critical" || priority === "high") return "critical";
  if (priority === "medium") return "warning";
  if (priority === "low") return "neutral";
  return "positive";
}
