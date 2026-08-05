/*
# Add encrypt/decrypt functions for AI API keys

## Purpose
Provides pgcrypto-based symmetric encryption/decryption for the
clinic_ai_credentials.api_key_encrypted column.

## New Functions
- `encrypt_api_key(plaintext text, key_pass text) RETURNS text`
  Encrypts an API key using pgp_sym_encrypt.
- `decrypt_api_key(encrypted_text text, key_pass text) RETURNS text`
  Decrypts using pgp_sym_decrypt.
- `upsert_clinic_ai_credential(p_clinic_id uuid, p_provider text, p_api_key text, p_model text, p_enabled boolean)`
  SECURITY DEFINER function that encrypts the key and upserts the row.
  This is the ONLY way the browser should write credentials — it never
  handles the encrypted text directly.

## Security
- Both encrypt/decrypt are SECURITY DEFINER so they can use pgcrypto.
- `upsert_clinic_ai_credential` is SECURITY DEFINER and checks clinic membership
  via auth.uid() before writing.
- The encryption key (AI_ENCRYPTION_KEY) is passed from the edge function
  environment variable — it is NOT stored in the database.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION encrypt_api_key(plaintext text, key_pass text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN pgp_sym_encrypt(plaintext, key_pass);
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted_text text, key_pass text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN pgp_sym_decrypt(decode(encrypted_text, 'escape'), key_pass);
END;
$$;

-- SECURITY DEFINER upsert function — browser calls this to save credentials.
-- The browser passes the raw API key; this function encrypts it server-side.
-- The browser never sees the encrypted text.
CREATE OR REPLACE FUNCTION upsert_clinic_ai_credential(
  p_clinic_id uuid,
  p_provider text,
  p_api_key text,
  p_model text,
  p_enabled boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_key_pass text;
  v_encrypted text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify clinic membership with admin/doctor role
  IF NOT EXISTS (
    SELECT 1 FROM clinic_members
    WHERE clinic_members.clinic_id = p_clinic_id
    AND clinic_members.user_id = v_user_id
    AND clinic_members.role IN ('admin', 'doctor')
  ) THEN
    RAISE EXCEPTION 'Not authorized to manage AI credentials for this clinic';
  END IF;

  -- Encrypt the key using pgcrypto directly (key from current_setting)
  v_key_pass := current_setting('app.ai_encryption_key', true);
  IF v_key_pass IS NULL OR v_key_pass = '' THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;

  v_encrypted := pgp_sym_encrypt(p_api_key, v_key_pass);

  INSERT INTO clinic_ai_credentials (clinic_id, provider, api_key_encrypted, model, enabled, updated_at)
  VALUES (p_clinic_id, p_provider, v_encrypted, p_model, p_enabled, now())
  ON CONFLICT (clinic_id, provider)
  DO UPDATE SET
    api_key_encrypted = EXCLUDED.api_key_encrypted,
    model = EXCLUDED.model,
    enabled = EXCLUDED.enabled,
    updated_at = now();
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION encrypt_api_key(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_api_key(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_clinic_ai_credential(uuid, text, text, text, boolean) TO authenticated;
