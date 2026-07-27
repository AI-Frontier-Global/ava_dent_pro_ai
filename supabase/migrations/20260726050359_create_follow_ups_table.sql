/*
# Patient follow-ups table
Stores post-visit follow-up tasks and their status. WhatsApp reminders are generated
on-demand as wa.me deep links (no external API needed), so no message log table is required.
*/

CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name text NOT NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  follow_up_date date NOT NULL,
  type text NOT NULL DEFAULT 'post_visit' CHECK (type IN ('post_visit', 'reminder', 'custom')),
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_follow_ups" ON follow_ups FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_follow_ups" ON follow_ups FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_follow_ups" ON follow_ups FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_follow_ups" ON follow_ups FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_follow_ups_user_id ON follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON follow_ups(follow_up_date);
