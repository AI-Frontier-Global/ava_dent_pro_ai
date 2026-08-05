/*
# Fix column-level security on clinic_ai_credentials

The previous migration's REVOKE was overridden by the table-level GRANT.
This migration explicitly revokes SELECT on api_key_encrypted from both
anon and authenticated roles, ensuring the browser can NEVER read the
encrypted API key. Only the service role (edge function) can access it.
*/

-- Revoke all privileges on the api_key_encrypted column from browser-facing roles
REVOKE SELECT (api_key_encrypted) ON clinic_ai_credentials FROM authenticated, anon;
REVOKE INSERT (api_key_encrypted) ON clinic_ai_credentials FROM authenticated, anon;
REVOKE UPDATE (api_key_encrypted) ON clinic_ai_credentials FROM authenticated, anon;

-- Verify: only non-secret columns are selectable by authenticated
GRANT SELECT (id, clinic_id, provider, model, enabled, created_at, updated_at) ON clinic_ai_credentials TO authenticated;
