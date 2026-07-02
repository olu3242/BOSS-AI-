import Link from "next/link";
import type { ReactNode } from "react";
import { FeedbackButton } from "../../../../src/components/FeedbackButton";

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: Promise<{ businessId: string }>;
}

const NAV_ITEMS = [
  { href: "", label: "Command Center" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/approvals", label: "Approvals" },
  { href: "/timeline", label: "Timeline" },
  { href: "/automation", label: "Automation" },
  { href: "/intelligence", label: "Intelligence" },
  { href: "/settings", label: "Settings" },
];

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { businessId } = await params;
  const base = `/business/${businessId}/workspace`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-800 bg-neutral-950 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="font-display text-xl tracking-tight hover:text-accent transition-colors">
            BOSS
          </Link>
          <nav className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={`${base}${item.href}`}
                className="rounded px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/marketplace"
              className="rounded px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              Marketplace
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      <footer className="border-t border-neutral-800 bg-neutral-950 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-xs text-neutral-600">
          <span>BOSS v2.0.0-rc2</span>
          <div className="flex items-center gap-4">
            <FeedbackButton businessId={businessId} />
            <a
              href="mailto:support@boss.ai"
              className="hover:text-neutral-400 transition-colors"
            >
              support@boss.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
