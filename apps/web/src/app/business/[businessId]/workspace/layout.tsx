import Link from "next/link";
import type { ReactNode } from "react";

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: { businessId: string };
}

const NAV_ITEMS = [
  { href: "", label: "Overview" },
  { href: "/timeline", label: "Timeline" },
  { href: "/approvals", label: "Approvals" },
  { href: "/automation", label: "Automation" },
  { href: "/intelligence", label: "Intelligence" },
  { href: "/settings", label: "Settings" },
];

export default function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const base = `/business/${params.businessId}/workspace`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-800 bg-neutral-950 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="font-display text-xl tracking-tight">BOSS</span>
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
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
