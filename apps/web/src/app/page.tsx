import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-24">
      <div>
        <p className="text-sm font-medium text-accent uppercase tracking-wide">BOSS</p>
        <h1 className="mt-2 font-display text-5xl text-white">The Operating System for Small Business</h1>
        <p className="mt-4 text-lg text-neutral-400">
          Understand your business in 60 seconds. Get AI-driven recommendations. Approve actions in one click.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/business/new"
          className="rounded bg-accent px-6 py-3 font-display text-white text-center"
        >
          Set up your business →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-8 border-t border-neutral-800">
        <div>
          <p className="text-2xl font-bold text-white">15 min</p>
          <p className="mt-1 text-sm text-neutral-400">From signup to first health score</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">0–100</p>
          <p className="mt-1 text-sm text-neutral-400">Business health score, always current</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">1 click</p>
          <p className="mt-1 text-sm text-neutral-400">To approve AI recommendations</p>
        </div>
      </div>
    </main>
  );
}
