"use client";

import { useEffect, useState } from "react";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Verifying your account...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");
    if (!accessToken || !refreshToken) {
      setMessage("The verification link is incomplete or expired.");
      return;
    }

    void fetch("/api/auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accessToken, refreshToken }),
    }).then((response) => {
      if (!response.ok) {
        setMessage("We could not verify this session. Request a new link.");
        return;
      }
      window.location.replace(
        type === "recovery"
          ? "/auth/reset-password"
          : "/onboarding/organization",
      );
    }).catch(() => {
      setMessage("We could not reach the identity service. Try again.");
    });
  }, []);

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-live="polite">
        <p className="eyebrow">Secure verification</p>
        <h1>{message}</h1>
      </section>
    </main>
  );
}
