-- Migration 0031: notification_deliveries
-- Canonical delivery log for every outbound notification.
-- Supports audit, retry, and observability for the NotificationService.

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL,
  business_id   uuid,
  channel       text NOT NULL CHECK (channel IN ('sms','email','slack','teams','push','voice','internal')),
  recipient     text NOT NULL,
  template_key  text,
  subject       text,
  body          text NOT NULL,
  provider_key  text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','failed')),
  error_message text,
  attempt_count int NOT NULL DEFAULT 0,
  sent_at       timestamptz,
  delivered_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_org_id ON notification_deliveries(org_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_business_id ON notification_deliveries(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON notification_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_created_at ON notification_deliveries(created_at DESC);
