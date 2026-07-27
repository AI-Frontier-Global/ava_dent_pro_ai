/*
# Fix patient deletion cascade + clinic settings table
*/

-- ============ Drop & recreate FKs with CASCADE ============

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_patient_id_fkey;
ALTER TABLE invoices
  ADD CONSTRAINT invoices_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS follow_ups_patient_id_fkey;
ALTER TABLE follow_ups
  ADD CONSTRAINT follow_ups_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE patient_images DROP CONSTRAINT IF EXISTS patient_images_patient_id_fkey;
ALTER TABLE patient_images
  ADD CONSTRAINT patient_images_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE treatment_plans DROP CONSTRAINT IF EXISTS treatment_plans_patient_id_fkey;
ALTER TABLE treatment_plans
  ADD CONSTRAINT treatment_plans_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE insurance_policies DROP CONSTRAINT IF EXISTS insurance_policies_patient_id_fkey;
ALTER TABLE insurance_policies
  ADD CONSTRAINT insurance_policies_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE patient_memberships DROP CONSTRAINT IF EXISTS patient_memberships_patient_id_fkey;
ALTER TABLE patient_memberships
  ADD CONSTRAINT patient_memberships_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- ============ Clinic settings table ============
CREATE TABLE IF NOT EXISTS clinic_settings (
  id int PRIMARY KEY DEFAULT 1,
  user_id uuid,
  clinic_name text NOT NULL DEFAULT 'عيادة سمايل لطب الأسنان',
  phone text NOT NULL DEFAULT '065551234',
  address text NOT NULL DEFAULT 'عمّان، الأردن',
  work_start int NOT NULL DEFAULT 9,
  work_end int NOT NULL DEFAULT 17,
  tax_rate numeric NOT NULL DEFAULT 16,
  currency text NOT NULL DEFAULT 'JOD',
  notify_new boolean NOT NULL DEFAULT true,
  notify_cancel boolean NOT NULL DEFAULT true,
  notify_reminder boolean NOT NULL DEFAULT true,
  reminder_hours int NOT NULL DEFAULT 2,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO clinic_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_clinic_settings" ON clinic_settings;
CREATE POLICY "select_own_clinic_settings" ON clinic_settings FOR SELECT
  TO authenticated USING (user_id IS NULL OR auth.uid() = user_id);
DROP POLICY IF EXISTS "upsert_own_clinic_settings" ON clinic_settings;
CREATE POLICY "upsert_own_clinic_settings" ON clinic_settings FOR UPDATE
  TO authenticated USING (user_id IS NULL OR auth.uid() = user_id)
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
