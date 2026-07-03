import Link from "next/link";
import type { ReactNode } from "react";
import { FeedbackButton } from "../../../../src/components/FeedbackButton";
import { requireActiveTenant } from "../../../../src/server/auth";

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: Promise<{ businessId: string }>;
}

const NAV_ITEMS = [
  { href: "/analytics",     label: "Analytics" },
  { href: "",               label: "Command Center" },
  { href: "/customers",     label: "Customers" },
  { href: "/jobs",          label: "Jobs" },
  { href: "/appointments",  label: "Appointments" },
  { href: "/invoices",      label: "Invoices" },
  { href: "/payments",      label: "Payments" },
  { href: "/reviews",       label: "Reviews" },
  { href: "/work",          label: "Work" },
  { href: "/money",         label: "Money" },
  { href: "/operations",    label: "Operations" },
  { href: "/intelligence",  label: "Intelligence" },
  { href: "/decisions",     label: "Decisions" },
  { href: "/scenarios",     label: "Scenarios" },
  { href: "/workflows",     label: "Workflows" },
  { href: "/settings",      label: "Settings" },
];

const GLOBAL_NAV = [
  { href: "/dashboard",   label: "Dashboard" },
  { href: "/businesses",  label: "Businesses" },
];

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { businessId } = await params;
  const base = `/business/${businessId}/workspace`;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-800 bg-neutral-950 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="font-display text-xl tracking-tight hover:text-accent transition-colors">
              BOSS
            </Link>
            <div className="hidden sm:flex gap-1 border-l border-neutral-800 pl-4">
              {GLOBAL_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded px-2 py-1 text-xs text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={`${base}${item.href}`}
                className="rounded px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={`/business/${businessId}/health`}
              className="rounded px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white whitespace-nowrap"
            >
              Health
            </Link>
            <Link
              href="/marketplace"
              className="rounded px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white whitespace-nowrap"
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
            <FeedbackButton businessId={businessId} orgId={orgId} />
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
