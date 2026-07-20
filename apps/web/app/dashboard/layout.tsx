import Link from "next/link";
import { requireBrowserIdentity } from "../../src/server/auth";

function isNextInternalThrow(err: unknown): boolean {
  const digest = (err as { digest?: string })?.digest ?? "";
  return (
    digest.startsWith("NEXT_REDIRECT") ||
    digest === "NEXT_NOT_FOUND" ||
    digest === "DYNAMIC_SERVER_USAGE"
  );
}

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let identity: Awaited<ReturnType<typeof requireBrowserIdentity>>["identity"];
  const traceId = crypto.randomUUID();

  console.log(`[dashboard/layout] start trace=${traceId}`);
  try {
    const session = await requireBrowserIdentity("/dashboard");
    identity = session.identity;
    console.log(`[dashboard/layout] identity_loaded trace=${traceId} userId=${identity.userId.slice(0, 8)}...`);
  } catch (err) {
    if (isNextInternalThrow(err)) {
      // Next.js redirect/not-found — let the framework handle it.
      throw err;
    }
    console.error(`[dashboard/layout] FATAL trace=${traceId}`, {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      digest: (err as { digest?: string })?.digest,
    });
    throw err; // Re-throw so dashboard/error.tsx can surface the message.
  }

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
