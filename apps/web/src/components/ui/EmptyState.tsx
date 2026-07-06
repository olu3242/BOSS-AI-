import type { ReactNode } from "react";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  dashed?: boolean;
}

export function EmptyState({ icon, title, description, action, dashed = true }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 rounded-xl p-12 text-center ${
        dashed ? "border border-dashed border-border" : "border border-border bg-surface"
      }`}
    >
      {icon && <div className="text-text-muted">{icon}</div>}
      <div className="space-y-1">
        <p className="font-semibold text-text-primary">{title}</p>
        {description && <p className="text-sm text-text-secondary">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
