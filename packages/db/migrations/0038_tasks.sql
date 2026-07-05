-- Migration 0038: Tasks (standalone)
-- Enriches the task concept with full lifecycle, priority, due dates, and parent hierarchy.
-- Rollback: DROP TABLE IF EXISTS tasks CASCADE;

CREATE TABLE IF NOT EXISTS tasks (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid        NOT NULL,
  business_id    uuid        NOT NULL,
  title          text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  description    text,
  status         text        NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo','in_progress','blocked','done','cancelled')),
  priority       text        NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to    text,
  due_at         timestamptz,
  completed_at   timestamptz,
  parent_task_id uuid        REFERENCES tasks(id) ON DELETE SET NULL,
  tags           text[]      NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_tasks_org_business
  ON tasks(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status
  ON tasks(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned
  ON tasks(org_id, assigned_to) WHERE deleted_at IS NULL AND assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_parent
  ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL AND deleted_at IS NULL;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tasks_tenant_policy ON tasks
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
