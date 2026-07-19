/**
 * Next.js instrumentation hook — runs once at server startup, before any request.
 * Used to validate required environment variables and connectivity so config problems
 * surface immediately as a startup error rather than as runtime failures for users.
 */
export async function register() {
  // Only run in the Node.js runtime, not in Edge.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { runPreflight } = await import("./src/server/preflight");
  await runPreflight();
}
