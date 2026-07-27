/*
# Convert clinic tables to multi-user (auth-scoped)

1. Changes
- Add `user_id uuid` (nullable first) to patients, appointments, invoices.
- Backfill any existing NULL rows with a generated UUID so the NOT NULL constraint can be applied.
- Set NOT NULL with DEFAULT auth.uid() so future inserts from signed-in users fill the owner automatically.

2. Security
- Replace anon policies with authenticated-only, owner-scoped CRUD via auth.uid() = user_id.
- invoice_items is scoped through its parent invoice (no user_id column needed).

3. Notes
- Idempotent: uses IF NOT EXISTS for columns and DROP POLICY IF EXISTS before recreating.
- No data is deleted.
*/

-- patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS user_id uuid;
UPDATE patients SET user_id = gen_random_uuid() WHERE user_id IS NULL;
ALTER TABLE patients ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE patients ALTER COLUMN user_id SET NOT NULL;

DROP POLICY IF EXISTS "anon_select_patients" ON patients;
DROP POLICY IF EXISTS "anon_insert_patients" ON patients;
DROP POLICY IF EXISTS "anon_update_patients" ON patients;
DROP POLICY IF EXISTS "anon_delete_patients" ON patients;

CREATE POLICY "select_own_patients" ON patients FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_patients" ON patients FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_patients" ON patients FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_patients" ON patients FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS user_id uuid;
UPDATE appointments SET user_id = gen_random_uuid() WHERE user_id IS NULL;
ALTER TABLE appointments ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE appointments ALTER COLUMN user_id SET NOT NULL;

DROP POLICY IF EXISTS "anon_select_appointments" ON appointments;
DROP POLICY IF EXISTS "anon_insert_appointments" ON appointments;
DROP POLICY IF EXISTS "anon_update_appointments" ON appointments;
DROP POLICY IF EXISTS "anon_delete_appointments" ON appointments;

CREATE POLICY "select_own_appointments" ON appointments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_appointments" ON appointments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_appointments" ON appointments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_appointments" ON appointments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS user_id uuid;
UPDATE invoices SET user_id = gen_random_uuid() WHERE user_id IS NULL;
ALTER TABLE invoices ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE invoices ALTER COLUMN user_id SET NOT NULL;

DROP POLICY IF EXISTS "anon_select_invoices" ON invoices;
DROP POLICY IF EXISTS "anon_insert_invoices" ON invoices;
DROP POLICY IF EXISTS "anon_update_invoices" ON invoices;
DROP POLICY IF EXISTS "anon_delete_invoices" ON invoices;

CREATE POLICY "select_own_invoices" ON invoices FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_invoices" ON invoices FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_invoices" ON invoices FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_invoices" ON invoices FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- invoice_items: scoped through parent invoice
DROP POLICY IF EXISTS "anon_select_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "anon_insert_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "anon_update_invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "anon_delete_invoice_items" ON invoice_items;

CREATE POLICY "select_own_invoice_items" ON invoice_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
  );
CREATE POLICY "insert_own_invoice_items" ON invoice_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
  );
CREATE POLICY "update_own_invoice_items" ON invoice_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
  );
CREATE POLICY "delete_own_invoice_items" ON invoice_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
