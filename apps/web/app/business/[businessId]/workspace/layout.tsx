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
  { href: "/workforce",     label: "AI Workforce" },
  { href: "/intelligence",  label: "Intelligence" },
  { href: "/decisions",     label: "Decisions" },
  { href: "/scenarios",     label: "Scenarios" },
  { href: "/workflows",     label: "Workflows" },
  { href: "/settings",      label: "Settings" },
];

const GLOBAL_NAV = [
  { href: "/dashboard",   label: "Dashboard" },
  { href: "/businesses",  label: "Businesses" },

const SIDEBAR_SECTIONS = [
  {
    label: "Intelligence",
    items: [
      { href: "/decisions",      label: "Decisions" },
      { href: "/scenarios",      label: "Scenarios" },
      { href: "/workflows",      label: "Workflows" },
      { href: "/analytics",      label: "Analytics" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/jobs",           label: "Jobs" },
      { href: "/appointments",   label: "Appointments" },
      { href: "/invoices",       label: "Invoices" },
      { href: "/payments",       label: "Payments" },
      { href: "/reviews",        label: "Reviews" },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/customers",      label: "Customers" },
      { href: "/settings",       label: "Settings" },
    ],
  },
];

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { businessId } = await params;
  const base = `/business/${businessId}/workspace`;
  const { organization } = await requireActiveTenant("/auth/sign-in");
  const orgId = organization.id;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-white">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border bg-neutral-950/95 px-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="font-display text-lg font-bold tracking-tight text-white hover:text-accent transition-colors"
          >
            B<span className="text-accent">O</span>SS
          </Link>
          <div className="hidden sm:flex items-center gap-1 border-l border-border pl-4">
            <Link
              href="/dashboard"
              className="rounded px-2.5 py-1 text-xs text-text-muted transition-colors hover:bg-elevated hover:text-text-primary"
            >
              Dashboard
            </Link>
            <Link
              href="/businesses"
              className="rounded px-2.5 py-1 text-xs text-text-muted transition-colors hover:bg-elevated hover:text-text-primary"
            >
              Businesses
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/business/${businessId}/health`}
            className="hidden sm:inline-flex rounded px-2.5 py-1 text-xs text-text-muted transition-colors hover:bg-elevated hover:text-text-primary"
          >
            Health Score
          </Link>
          <FeedbackButton businessId={businessId} orgId={orgId} />
        </div>
      </header>

      <div className="flex flex-1 pt-14">
        {/* Sidebar */}
        <aside className="hidden w-52 shrink-0 border-r border-border bg-neutral-950 sm:block">
          <nav className="sticky top-14 flex flex-col gap-6 overflow-y-auto p-4 pt-6" style={{ maxHeight: "calc(100vh - 56px)" }}>
            {SIDEBAR_SECTIONS.map((section) => (
              <div key={section.label}>
                <p className="mb-1.5 px-2 text-2xs font-semibold uppercase tracking-widest text-text-muted">
                  {section.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={`${base}${item.href}`}
                      className="rounded px-2.5 py-1.5 text-sm text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Mobile nav strip */}
        <div className="sm:hidden w-full border-b border-border overflow-x-auto">
          <div className="flex gap-1 px-3 py-2">
            {SIDEBAR_SECTIONS.flatMap((s) => s.items).map((item) => (
              <Link
                key={item.href}
                href={`${base}${item.href}`}
                className="shrink-0 rounded px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="min-w-0 flex-1 p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
