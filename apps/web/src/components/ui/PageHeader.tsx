import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
  back?: ReactNode;
}

export function PageHeader({ title, description, action, back }: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        {back && <div className="mb-2">{back}</div>}
        <h1 className="font-display text-2xl font-bold text-text-primary">{title}</h1>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
