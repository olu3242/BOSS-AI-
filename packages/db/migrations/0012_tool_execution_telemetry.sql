-- Goal 16: Production Provider Adapter Framework
-- Adds per-execution attempt/latency telemetry to tool_executions so retry policy
-- and circuit breaker outcomes can be persisted and audited.

ALTER TABLE tool_executions
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS latency_ms numeric;
