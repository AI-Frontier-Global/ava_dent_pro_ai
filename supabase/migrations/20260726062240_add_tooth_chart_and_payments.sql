/*
# Add tooth chart and partial payments

1. New Tables
- `tooth_records`: per-patient tooth conditions.
  - id, patient_id (fk), user_id (owner), tooth_number (int 11-48 FDI),
    condition (text: healthy/cavity/filled/extracted/crown/implant/root_canal),
    notes (text), updated_at
- `invoice_payments`: partial payments tracking for invoices.
  - id, invoice_id (fk -> invoices cascade), user_id (owner),
    amount (numeric), method (text: cash/card/cliq/transfer), note (text), created_at

2. New Columns
- `appointments`: add appointment_date (date), end_hour (int), recurrence (text)
  to support real-date scheduling and recurring appointments.

3. Security
- RLS enabled on new tables; owner-scoped CRUD via auth.uid() = user_id.
- invoice_payments scoped through parent invoice via EXISTS check.

4. Notes
- Idempotent. No data loss.
*/

-- ============ Tooth records ============
CREATE TABLE IF NOT EXISTS tooth_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  tooth_number int NOT NULL,
  condition text NOT NULL DEFAULT 'healthy',
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tooth_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tooth_records" ON tooth_records;
CREATE POLICY "select_own_tooth_records" ON tooth_records FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_tooth_records" ON tooth_records;
CREATE POLICY "insert_own_tooth_records" ON tooth_records FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_tooth_records" ON tooth_records;
CREATE POLICY "update_own_tooth_records" ON tooth_records FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_tooth_records" ON tooth_records;
CREATE POLICY "delete_own_tooth_records" ON tooth_records FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tooth_records_patient_id ON tooth_records(patient_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tooth_records_patient_tooth ON tooth_records(patient_id, tooth_number);

-- ============ Appointment date columns ============
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_date date;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS end_hour int;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recurrence text DEFAULT 'none';

-- Backfill end_hour from duration for existing rows
UPDATE appointments SET end_hour = start_hour + duration WHERE end_hour IS NULL;

-- ============ Invoice payments ============
CREATE TABLE IF NOT EXISTS invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id text REFERENCES invoices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'cash',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_invoice_payments" ON invoice_payments;
CREATE POLICY "select_own_invoice_payments" ON invoice_payments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_payments.invoice_id AND invoices.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_invoice_payments" ON invoice_payments;
CREATE POLICY "insert_own_invoice_payments" ON invoice_payments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_payments.invoice_id AND invoices.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_invoice_payments" ON invoice_payments;
CREATE POLICY "update_own_invoice_payments" ON invoice_payments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_payments.invoice_id AND invoices.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_payments.invoice_id AND invoices.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_invoice_payments" ON invoice_payments;
CREATE POLICY "delete_own_invoice_payments" ON invoice_payments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_payments.invoice_id AND invoices.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
