type Trend = "up" | "down" | "neutral";

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  trend?: Trend;
  loading?: boolean;
}

const TREND_STYLE: Record<Trend, string> = {
  up:      "text-status-success",
  down:    "text-status-danger",
  neutral: "text-text-muted",
};

const TREND_ARROW: Record<Trend, string> = {
  up:      "↑",
  down:    "↓",
  neutral: "—",
};

export function StatTile({ label, value, delta, trend = "neutral", loading = false }: Props) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-elevated" />
        <div className="mt-3 h-7 w-32 animate-pulse rounded bg-elevated" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-text-primary">{value}</p>
      {delta && trend && (
        <p className={`mt-1 text-xs font-medium ${TREND_STYLE[trend]}`}>
          {TREND_ARROW[trend]} {delta}
        </p>
      )}
    </div>
  );
}
