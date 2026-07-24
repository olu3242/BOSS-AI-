import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Exclude Playwright E2E specs — they are run via `pnpm test:e2e`, not vitest.
    exclude: ["e2e/**", "**/node_modules/**"],
  },
});
