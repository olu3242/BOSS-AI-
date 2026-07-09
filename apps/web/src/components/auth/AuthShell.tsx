import type { ReactNode } from "react";

interface AuthShellProps {
  readonly children: ReactNode;
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly titleId: string;
  readonly live?: boolean;
}

export function AuthShell({
  children,
  eyebrow,
  title,
  subtitle,
  titleId,
  live = false,
}: AuthShellProps) {
  return (
    <main className="auth-shell">
      <div className="auth-brand-panel">
        <a className="brand-link" href="/">
          B<em>O</em>SS
        </a>
        <div className="auth-brand-copy">
          <p className="eyebrow">Business clarity</p>
          <h2>Wake up knowing what your business needs today.</h2>
          <p>
            Sign in to review your health report, approve the next best actions,
            and keep the day moving.
          </p>
        </div>
        <div className="auth-proof-grid">
          <span>21 hrs saved weekly</span>
          <span>$18K avg. cash lift</span>
          <span>10 min setup</span>
        </div>
      </div>

      <section
        className="auth-panel"
        aria-labelledby={titleId}
        {...(live ? { "aria-live": "polite" as const } : {})}
      >
        <p className="eyebrow">{eyebrow}</p>
        <h1 id={titleId}>{title}</h1>
        <p className="subtle">{subtitle}</p>
        {children}
      </section>
    </main>
  );
}
