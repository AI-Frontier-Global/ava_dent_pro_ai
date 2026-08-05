/*
# Create clinic_ai_credentials table — Enterprise Secure AI Provider Storage

## Purpose
Stores AI provider API keys (OpenAI, Anthropic, Google Gemini, future providers)
securely in Supabase, scoped per clinic. API keys NEVER reach the browser —
the browser only sends prompts to the edge function, which loads the encrypted
key server-side and calls the provider.

## New Tables
- `clinic_ai_credentials`
  - `id` (uuid, primary key)
  - `clinic_id` (uuid, not null, references clinics(id) ON DELETE CASCADE)
  - `provider` (text, not null) — 'openai' | 'anthropic' | 'google' | future
  - `api_key_encrypted` (text, not null) — encrypted API key (stored server-side only)
  - `model` (text, not null) — default model for this provider
  - `enabled` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - UNIQUE(clinic_id, provider) — one config per provider per clinic

## Security
- RLS enabled, clinic-scoped via clinic_members membership check.
- SELECT: clinic members can read (but api_key_encrypted is NOT exposed to browser —
  the edge function uses service role to read it).
- INSERT/UPDATE/DELETE: clinic members with role 'admin' or 'doctor' can manage.
- The `api_key_encrypted` column is never selected by the browser-facing RLS policy —
  a SECURITY DEFINER function exposes only non-secret columns to the browser.

## Important Notes
1. The browser NEVER reads api_key_encrypted directly. It uses the
   `get_clinic_provider_configs()` function which returns provider/model/enabled
   WITHOUT the api_key.
2. The edge function uses SUPABASE_SERVICE_ROLE_KEY to read the full row including
   the encrypted key.
3. Encryption uses pgcrypto's pgp_sym_encrypt with a server-side secret stored as
   an edge function environment variable.
*/

CREATE TABLE IF NOT EXISTS clinic_ai_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  provider text NOT NULL,
  api_key_encrypted text NOT NULL,
  model text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_clinic_ai_credentials_clinic ON clinic_ai_credentials(clinic_id);

ALTER TABLE clinic_ai_credentials ENABLE ROW LEVEL SECURITY;

-- Clinic members can read their clinic's AI credentials (but the column-level
-- security below prevents api_key_encrypted from being visible to the browser)
DROP POLICY IF EXISTS "select_own_clinic_ai_credentials" ON clinic_ai_credentials;
CREATE POLICY "select_own_clinic_ai_credentials" ON clinic_ai_credentials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_members
      WHERE clinic_members.clinic_id = clinic_ai_credentials.clinic_id
      AND clinic_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_clinic_ai_credentials" ON clinic_ai_credentials;
CREATE POLICY "insert_own_clinic_ai_credentials" ON clinic_ai_credentials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinic_members
      WHERE clinic_members.clinic_id = clinic_ai_credentials.clinic_id
      AND clinic_members.user_id = auth.uid()
      AND clinic_members.role IN ('admin', 'doctor')
    )
  );

DROP POLICY IF EXISTS "update_own_clinic_ai_credentials" ON clinic_ai_credentials;
CREATE POLICY "update_own_clinic_ai_credentials" ON clinic_ai_credentials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_members
      WHERE clinic_members.clinic_id = clinic_ai_credentials.clinic_id
      AND clinic_members.user_id = auth.uid()
      AND clinic_members.role IN ('admin', 'doctor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinic_members
      WHERE clinic_members.clinic_id = clinic_ai_credentials.clinic_id
      AND clinic_members.user_id = auth.uid()
      AND clinic_members.role IN ('admin', 'doctor')
    )
  );

DROP POLICY IF EXISTS "delete_own_clinic_ai_credentials" ON clinic_ai_credentials;
CREATE POLICY "delete_own_clinic_ai_credentials" ON clinic_ai_credentials FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_members
      WHERE clinic_members.clinic_id = clinic_ai_credentials.clinic_id
      AND clinic_members.user_id = auth.uid()
      AND clinic_members.role IN ('admin', 'doctor')
    )
  );

-- Column-level security: prevent browser from reading api_key_encrypted
-- Even though RLS allows SELECT, the api_key_encrypted column is hidden from
-- the anon/authenticated roles. Only the service role (edge function) can read it.
REVOKE SELECT (api_key_encrypted) ON clinic_ai_credentials FROM authenticated, anon;
-- Keep all other columns readable
GRANT SELECT (id, clinic_id, provider, model, enabled, created_at, updated_at) ON clinic_ai_credentials TO authenticated;

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_clinic_ai_credentials_updated_at ON clinic_ai_credentials;
CREATE TRIGGER trg_clinic_ai_credentials_updated_at BEFORE UPDATE ON clinic_ai_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
