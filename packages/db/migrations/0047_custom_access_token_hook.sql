-- TD-030: Supabase custom access-token hook.
--
-- Supabase calls this function (SECURITY DEFINER, runs as superuser) each time
-- it issues or refreshes a JWT for a user. The return value is merged into the
-- token's claims. We stamp org_id, role, and is_super_admin so every API call
-- can read them from the verified JWT without a DB round-trip.
--
-- Registration (one-time, in Supabase Dashboard):
--   Auth → Hooks → Custom Access Token Hook
--   Schema:  public
--   Function: boss_custom_access_token_hook
--
-- The function signature is fixed by Supabase — do not change argument/return types.

CREATE OR REPLACE FUNCTION public.boss_custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id        text;
  active_org_id  uuid;
  member_role    text;
  is_super       boolean;
  claims         jsonb;
BEGIN
  user_id := event ->> 'user_id';
  claims  := event -> 'claims';

  -- Resolve the user's active organization and their role within it.
  SELECT
    utp.active_organization_id,
    om.role
  INTO active_org_id, member_role
  FROM user_tenant_preferences utp
  LEFT JOIN organization_memberships om
    ON om.organization_id = utp.active_organization_id
    AND om.user_id        = user_id
    AND om.status         = 'active'
  WHERE utp.user_id = user_id;

  -- If the user has no active org yet (e.g. just signed up), leave org_id absent
  -- so the API returns 403 "missing_org_claim" and routes them to onboarding.

  -- Check platform super-admin status (cross-tenant).
  SELECT EXISTS (
    SELECT 1 FROM platform_super_admins
    WHERE platform_super_admins.user_id = boss_custom_access_token_hook.user_id
      AND revoked_at IS NULL
  ) INTO is_super;

  -- Stamp claims — only include org_id/role when an active org exists.
  IF active_org_id IS NOT NULL THEN
    claims := claims
      || jsonb_build_object('org_id', active_org_id::text)
      || jsonb_build_object('role',   COALESCE(member_role, 'viewer'));
  END IF;

  IF is_super THEN
    claims := claims || jsonb_build_object('is_super_admin', true);
  END IF;

  RETURN jsonb_build_object('claims', claims);
END;
$$;

-- Grant execute to the supabase_auth_admin role (required by Supabase hook runtime).
GRANT EXECUTE ON FUNCTION public.boss_custom_access_token_hook(jsonb)
  TO supabase_auth_admin;

-- Revoke from public — only the auth runtime should call this.
REVOKE EXECUTE ON FUNCTION public.boss_custom_access_token_hook(jsonb)
  FROM PUBLIC;
