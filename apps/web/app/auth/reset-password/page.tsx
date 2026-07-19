import { AuthShell } from "../../../src/components/auth/AuthShell";

interface ResetPasswordPageProps {
  readonly searchParams: Promise<{ readonly error?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const query = await searchParams;
  return (
    <AuthShell
      eyebrow="Secure recovery"
      title="Choose a new password"
      subtitle="Create a new password, then return to your BOSS workspace."
      titleId="reset-password-title"
    >
        {query.error ? (
          <p className="form-error" role="alert">
            The passwords did not match, the link expired, or the update failed.
          </p>
        ) : null}
        <form action="/api/auth/reset-password" method="post">
          <label>
            New password
            <input
              autoComplete="new-password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </label>
          <label>
            Confirm password
            <input
              autoComplete="new-password"
              minLength={8}
              name="confirmation"
              required
              type="password"
            />
          </label>
          <button type="submit">Update password</button>
        </form>
    </AuthShell>
  );
}
