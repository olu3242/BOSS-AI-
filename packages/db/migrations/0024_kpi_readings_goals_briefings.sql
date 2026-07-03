-- Goal 19: KPI time-series, Business Goals/OKRs, and Executive Briefings

-- ─── KPI Readings ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kpi_readings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL,
  business_id  uuid NOT NULL,
  kpi_key      text NOT NULL,
  label        text NOT NULL,
  value        numeric,
  unit         text NOT NULL DEFAULT 'unit',
  trend        text NOT NULL DEFAULT 'unknown',
  source       text NOT NULL DEFAULT 'registry_default',
  measured_at  timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

CREATE INDEX IF NOT EXISTS kpi_readings_business_measured
  ON kpi_readings (org_id, business_id, measured_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS kpi_readings_kpi_key
  ON kpi_readings (org_id, business_id, kpi_key, measured_at DESC)
  WHERE deleted_at IS NULL;

-- ─── Business Goals / OKRs ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_goals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL,
  business_id   uuid NOT NULL,
  category      text NOT NULL,
  title         text NOT NULL,
  description   text NOT NULL DEFAULT '',
  kpi_key       text,
  target_value  numeric,
  current_value numeric,
  unit          text,
  due_date      timestamptz,
  started_at    timestamptz,
  completed_at  timestamptz,
  milestones    jsonb NOT NULL DEFAULT '[]',
  status        text NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE INDEX IF NOT EXISTS business_goals_business
  ON business_goals (org_id, business_id, status)
  WHERE deleted_at IS NULL;

-- ─── Executive Briefings ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS executive_briefings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL,
  business_id      uuid NOT NULL,
  period           text NOT NULL,
  headline         text NOT NULL,
  summary          text NOT NULL,
  top_priorities   jsonb NOT NULL DEFAULT '[]',
  key_metrics      jsonb NOT NULL DEFAULT '[]',
  alerts           jsonb NOT NULL DEFAULT '[]',
  recommendations  jsonb NOT NULL DEFAULT '[]',
  period_start     timestamptz NOT NULL,
  period_end       timestamptz NOT NULL,
  generated_at     timestamptz NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz
);

CREATE INDEX IF NOT EXISTS executive_briefings_business_generated
  ON executive_briefings (org_id, business_id, generated_at DESC)
  WHERE deleted_at IS NULL;
