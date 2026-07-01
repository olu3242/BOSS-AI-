interface VerifyPageProps {
  readonly searchParams: Promise<{ readonly email?: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const query = await searchParams;
  return (
    <main className="auth-shell">
      <a className="brand-link" href="/">BOSS</a>
      <section className="auth-panel" aria-labelledby="verify-title">
        <p className="eyebrow">One more step</p>
        <h1 id="verify-title">Check your email</h1>
        <p className="subtle">
          We sent a verification link{query.email ? ` to ${query.email}` : ""}.
          Open it on this device to finish signing in.
        </p>
        <a className="button-link" href="/auth/sign-in">Return to sign in</a>
      </section>
    </main>
  );
}
