# BOSS Engineering Operating System

## Authority

Adopted 2026-06-28 as the day-to-day engineering handbook. It governs execution
discipline; the Master Program Plan governs sequencing.

The standard work unit is:

```text
Epic -> Capability -> Batch -> Certification
```

A batch targets one to three engineering sessions and must be independently
testable and certifiable. It produces source, tests, documentation, validation
results, certification, and migration notes when applicable.

Required gates are typecheck, lint, unit/integration tests, build, and
architecture validation. Failures block certification. Core changes also
require an ADR, dependency analysis, and backward-compatibility assessment.

Done means implementation, tests, documentation, certification, and no known
regression. Deferred work, limitations, blockers, and follow-ups belong in the
technical debt register.

Program metrics are capability completion, batch lead time, certification and
regression rates, build/test stability, and open blockers. EOS improvements are
prospective ADR-governed changes.
