import { AuthShell } from "../../../src/components/auth/AuthShell";

interface VerifyPageProps {
  readonly searchParams: Promise<{ readonly email?: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const query = await searchParams;
  return (
    <AuthShell
      eyebrow="One more step"
      title="Check your email"
      subtitle="Open the verification link on this device to finish creating your account."
      titleId="verify-title"
    >
        <p className="subtle">
          We sent a verification link{query.email ? ` to ${query.email}` : ""}.
          Open it on this device to finish signing in.
        </p>
        <a className="button-link" href="/auth/sign-in">Return to sign in</a>
    </AuthShell>
  );
}
