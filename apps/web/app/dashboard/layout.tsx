import Link from "next/link";
import { requireBrowserIdentity } from "../../src/server/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { identity } = await requireBrowserIdentity("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-neutral-950 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl tracking-tight hover:text-accent transition-colors">
            BOSS
          </Link>
          <nav className="flex gap-1">
            <Link href="/dashboard" className="rounded px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-elevated hover:text-text-primary">
              Dashboard
            </Link>
            <Link href="/businesses" className="rounded px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-elevated hover:text-text-primary">
              Businesses
            </Link>
            <Link href="/marketplace" className="rounded px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-elevated hover:text-text-primary">
              Marketplace
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-xs text-text-muted">{identity.email}</span>
            <form action="/api/auth/sign-out" method="post">
              <button className="rounded px-3 py-1.5 text-xs text-text-muted hover:bg-elevated hover:text-text-primary transition-colors" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      <footer className="border-t border-border bg-neutral-950 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-xs text-text-muted">
          <span>BOSS v2.0.0-rc2</span>
        </div>
      </footer>
    </div>
  );
}
