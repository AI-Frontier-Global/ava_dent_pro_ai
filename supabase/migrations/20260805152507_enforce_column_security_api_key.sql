/*
# Enforce column-level security on api_key_encrypted

PostgreSQL column privileges are additive to table-level grants.
To truly hide api_key_encrypted from the browser, we must:
1. REVOKE the table-level SELECT from authenticated and anon.
2. GRANT column-level SELECT on only the non-secret columns.
3. Also restrict INSERT/UPDATE so the browser can't write the encrypted key
   directly (must use the SECURITY DEFINER upsert function instead).
*/

-- Step 1: Revoke table-level privileges from browser roles
REVOKE SELECT ON clinic_ai_credentials FROM authenticated, anon;
REVOKE INSERT ON clinic_ai_credentials FROM authenticated, anon;
REVOKE UPDATE ON clinic_ai_credentials FROM authenticated, anon;
REVOKE DELETE ON clinic_ai_credentials FROM authenticated, anon;

-- Step 2: Grant column-level SELECT on only non-secret columns
GRANT SELECT (id, clinic_id, provider, model, enabled, created_at, updated_at) ON clinic_ai_credentials TO authenticated;

-- Step 3: No INSERT/UPDATE/UPDATE on api_key_encrypted for browser roles.
-- The browser must use the SECURITY DEFINER function upsert_clinic_ai_credential()
-- which encrypts the key server-side. But we still need INSERT/UPDATE on the
-- non-secret columns for direct updates to model/enabled.
GRANT UPDATE (model, enabled) ON clinic_ai_credentials TO authenticated;
GRANT INSERT (clinic_id, provider, model, enabled) ON clinic_ai_credentials TO authenticated;
GRANT DELETE ON clinic_ai_credentials TO authenticated;

-- Note: RLS policies still enforce clinic membership on all operations.
-- The column-level grants just add another layer: even if RLS allows the row,
-- the api_key_encrypted column is not readable by the browser.
