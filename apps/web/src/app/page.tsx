import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <h1 className="font-display text-4xl">BOSS</h1>
      <p className="text-neutral-400">The Operating System for Small Business.</p>
      <div className="flex gap-4">
        <Link href="/business/new" className="rounded bg-accent px-4 py-2 font-display text-white">
          Set up a business
        </Link>
      </div>
    </main>
  );
}
