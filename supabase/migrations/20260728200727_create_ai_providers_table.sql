/*
# Create ai_providers table

1. New Tables
- `ai_providers`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid())
  - `provider_key` (text, not null) — e.g. 'aws_bedrock', 'google_vertex'
  - `provider_name` (text, not null) — display name
  - `api_key` (text) — encrypted API key (nullable until activated)
  - `is_active` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- RLS enabled, owner-scoped CRUD.
*/

CREATE TABLE IF NOT EXISTS ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_key text NOT NULL,
  provider_name text NOT NULL,
  api_key text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider_key)
);

ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ai_providers" ON ai_providers;
CREATE POLICY "select_own_ai_providers" ON ai_providers FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ai_providers" ON ai_providers;
CREATE POLICY "insert_own_ai_providers" ON ai_providers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_ai_providers" ON ai_providers;
CREATE POLICY "update_own_ai_providers" ON ai_providers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ai_providers" ON ai_providers;
CREATE POLICY "delete_own_ai_providers" ON ai_providers FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
