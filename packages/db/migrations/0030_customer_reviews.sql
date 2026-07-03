CREATE TABLE IF NOT EXISTS customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  job_id uuid,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','flagged','hidden')),
  source text NOT NULL DEFAULT 'internal' CHECK (source IN ('internal','google','yelp','facebook')),
  response text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_reviews_org_business ON customer_reviews(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_org_customer ON customer_reviews(org_id, customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON customer_reviews(org_id, rating) WHERE deleted_at IS NULL;

ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY customer_reviews_tenant_policy ON customer_reviews
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
