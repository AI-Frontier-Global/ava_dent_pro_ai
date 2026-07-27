/*
# Create clinic_ai_settings table (single-tenant, no auth)

1. Purpose
- Stores the clinic's local Ollama AI assistant configuration so the
  chat widget can route patient questions to a dentistry-specialized
  model running on the clinic's own computer (privacy + offline use).

2. New Tables
- `clinic_ai_settings`
  - `id` (int2, primary key, always 1 — single row config table)
  - `enabled` (boolean, default false) — whether Ollama integration is active
  - `server_url` (text, default 'http://localhost:11434') — Ollama server address
  - `model` (text, default 'llama3.2') — model name to use for chat
  - `system_prompt` (text) — dentistry-specialized system prompt
  - `updated_at` (timestamptz)

3. Security
- Enable RLS.
- Single-tenant no-auth app: allow anon + authenticated full CRUD since
  this is shared clinic configuration intentionally editable from the
  settings page.
*/

CREATE TABLE IF NOT EXISTS clinic_ai_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  server_url text NOT NULL DEFAULT 'http://localhost:11434',
  model text NOT NULL DEFAULT 'llama3.2',
  system_prompt text NOT NULL DEFAULT 'أنت مساعد ذكي متخصص في طب الأسنان، يعمل في عيادة سمايل لطب الأسنان في عمّان، الأردن. تجيب على أسئلة المرضى المتعلقة بخدمات العيادة، المواعيد، الأسعار، وعلاجات الأسنان فقط. لا تجيب على أسئلة خارج نطاق طب الأسنان. كن موجزاً وودوداً واستخدم اللغة العربية دائماً.',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO clinic_ai_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE clinic_ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ai_settings" ON clinic_ai_settings;
CREATE POLICY "anon_select_ai_settings" ON clinic_ai_settings FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ai_settings" ON clinic_ai_settings;
CREATE POLICY "anon_insert_ai_settings" ON clinic_ai_settings FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ai_settings" ON clinic_ai_settings;
CREATE POLICY "anon_update_ai_settings" ON clinic_ai_settings FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ai_settings" ON clinic_ai_settings;
CREATE POLICY "anon_delete_ai_settings" ON clinic_ai_settings FOR DELETE
TO anon, authenticated USING (true);