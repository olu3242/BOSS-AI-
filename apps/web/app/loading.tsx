export default function Loading() {
  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">BOSS</p>
        <h1>Loading your workspace</h1>
        <p className="subtle">Restoring your secure business context.</p>
      </header>
      <section className="grid metrics" aria-label="Loading metrics">
        {["health", "constraints", "recommendations", "profit"].map((item) => (
          <div className="card skeleton" key={item} />
        ))}
      </section>
    </main>
  );
}
