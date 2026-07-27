/*
# Add bridge_url column to clinic_ai_settings

1. Purpose
- The AI assistant now talks to a "Local Bridge" (Node.js + Express) running
  on the clinic's own computer instead of calling Ollama directly. The bridge
  exposes a management API (status, models, pull, chat) on a local port
  (default http://localhost:3001) that the in-app settings panel and the chat
  widget call from the browser.

2. Changes to existing table `clinic_ai_settings`
- Add `bridge_url` (text, not null, default 'http://localhost:3001') — the
  address of the local bridge agent the clinic runs once.
- Update the default `system_prompt` to the dentistry-specialized prompt
  required by the product spec, and refresh the existing single config row so
  the chat widget sends the correct prompt to the bridge.

3. Security
- No new tables. RLS already enabled with anon + authenticated CRUD.
- No policy changes needed.
*/

ALTER TABLE clinic_ai_settings
  ADD COLUMN IF NOT EXISTS bridge_url text NOT NULL DEFAULT 'http://localhost:3001';

-- Refresh the system prompt to the required dentistry-specialized wording.
UPDATE clinic_ai_settings
SET system_prompt = 'أنت مساعد طبي متخصص في إدارة عيادات الأسنان في الأردن، تجيب باختصار ووضوح.',
    updated_at = now()
WHERE id = 1;

ALTER TABLE clinic_ai_settings
  ALTER COLUMN system_prompt SET DEFAULT 'أنت مساعد طبي متخصص في إدارة عيادات الأسنان في الأردن، تجيب باختصار ووضوح.';