/*
# Create patient images archive (X-rays & photos)

1. New Storage Bucket
- `patient-images`: private bucket for dental X-rays, intra-oral photos and documents.
  Files are access-controlled via RLS on storage.objects (owner = auth.uid()).

2. New Tables
- `patient_images`: metadata for each uploaded image belonging to a patient.
  - id (uuid pk)
  - patient_id (uuid fk -> patients, cascade on delete)
  - user_id (uuid, not null, default auth.uid()) — owner
  - type (text: 'xray' | 'photo' | 'document')
  - title (text)
  - description (text, optional)
  - storage_path (text — path inside the bucket)
  - created_at (timestamptz)

3. Security
- RLS enabled on patient_images; owner-scoped CRUD via auth.uid() = user_id.
- Storage policies on storage.objects restrict read/write/delete to the
  object owner (auth.uid() = owner) within the patient-images bucket.

4. Notes
- Idempotent: uses IF NOT EXISTS and DROP POLICY IF EXISTS.
- The bucket is private; the frontend generates signed URLs for display.
*/

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-images', 'patient-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (owner-scoped)
DROP POLICY IF EXISTS "select_own_patient_images_storage" ON storage.objects;
CREATE POLICY "select_own_patient_images_storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'patient-images' AND auth.uid() = owner);

DROP POLICY IF EXISTS "insert_own_patient_images_storage" ON storage.objects;
CREATE POLICY "insert_own_patient_images_storage" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patient-images' AND auth.uid() = owner);

DROP POLICY IF EXISTS "update_own_patient_images_storage" ON storage.objects;
CREATE POLICY "update_own_patient_images_storage" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'patient-images' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'patient-images' AND auth.uid() = owner);

DROP POLICY IF EXISTS "delete_own_patient_images_storage" ON storage.objects;
CREATE POLICY "delete_own_patient_images_storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'patient-images' AND auth.uid() = owner);

-- Metadata table
CREATE TABLE IF NOT EXISTS patient_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  type text NOT NULL DEFAULT 'xray',
  title text NOT NULL,
  description text,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE patient_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_patient_images" ON patient_images;
CREATE POLICY "select_own_patient_images" ON patient_images FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_patient_images" ON patient_images;
CREATE POLICY "insert_own_patient_images" ON patient_images FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_patient_images" ON patient_images;
CREATE POLICY "update_own_patient_images" ON patient_images FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_patient_images" ON patient_images;
CREATE POLICY "delete_own_patient_images" ON patient_images FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_patient_images_patient_id ON patient_images(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_images_user_id ON patient_images(user_id);
