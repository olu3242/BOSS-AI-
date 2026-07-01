/**
 * Placeholder org id used until real auth (TD-006) exists. Every page reads
 * this instead of deriving org_id from a JWT, matching the same honest
 * placeholder used by the HTTP API's `x-org-id` header (ADR-0012).
 */
export const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";
