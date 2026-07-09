"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";

export function GoogleSignInButton({ next }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const redirectTo = new URL(
        `/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
        window.location.origin,
      ).toString();

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, queryParams: { access_type: "offline", prompt: "consent" } },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
      // On success Supabase redirects the browser — no further action needed.
    } catch {
      setError("Could not connect to Google. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="auth-oauth">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="auth-google-button"
        aria-label="Sign in with Google"
      >
        {loading ? (
          <span className="auth-spinner" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>
      {error && <p className="auth-oauth-error">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
