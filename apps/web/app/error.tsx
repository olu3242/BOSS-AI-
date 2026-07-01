"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <section className="error-panel" role="alert">
        <p className="eyebrow">Dashboard Error</p>
        <h1>Command center could not load</h1>
        <p className="subtle">{error.message}</p>
        <button onClick={reset} type="button">
          Try again
        </button>
      </section>
    </main>
  );
}
