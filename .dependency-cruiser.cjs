/**
 * Architecture boundary rules for BOSS (see CLAUDE.md "Two Laws" and
 * docs/execution/CODING_STANDARDS.md). Run via `pnpm arch:boundaries`.
 */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies make the bounded-context graph impossible to reason about.",
      from: {},
      to: { circular: true },
    },
    {
      name: "mcp-never-imports-loop",
      severity: "error",
      comment: "MCP (Brain) must never depend on Loop Runtime (Engine) — Law 1.",
      from: { path: "^packages/mcp" },
      to: { path: "^packages/loop" },
    },
    {
      name: "loop-never-imports-mcp",
      severity: "error",
      comment: "Loop Runtime must never depend on MCP directly — it receives data, it doesn't reach for it.",
      from: { path: "^packages/loop" },
      to: { path: "^packages/mcp" },
    },
    {
      name: "loop-never-imports-industry-packs",
      severity: "error",
      comment: "Loop contains zero business knowledge — it cannot import a capability pack directly.",
      from: { path: "^packages/loop" },
      to: { path: "^industry-packs" },
    },
    {
      name: "industry-packs-only-depend-on-registries-and-types",
      severity: "error",
      comment: "Capability packs are declarative data — they may only depend on @boss/registries and @boss/types.",
      from: { path: "^industry-packs" },
      to: {
        path: "^packages/(?!registries|types)",
      },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
    },
    doNotFollow: {
      path: "node_modules",
    },
    exclude: {
      path: "(^|/)(dist|\\.next|node_modules)(/|$)",
    },
  },
};
