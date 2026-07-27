/*
# Create ai_model_weights table

1. New Tables
- `ai_model_weights`
  - `id` (smallint, primary key, fixed = 1) — singleton row for the clinic's trained model
  - `model_type` (text, default 'no_show_logistic') — identifies which model
  - `weights` (jsonb) — serialized ModelWeights object {bias, weights, featureNames, ...}
  - `trained_at` (timestamptz) — when the model was last trained
  - `training_examples` (int) — number of examples used
  - `training_accuracy` (real) — training-set accuracy (0..1)
  - `updated_at` (timestamptz) — last upsert time
2. Security
- Enable RLS on `ai_model_weights`.
- This app uses sign-in (authenticated), so scope CRUD to the owner via auth.uid().
- The table is a singleton keyed by id=1 owned by the clinic user.
- Note: since this is a clinic-wide singleton (not per-row ownership), we allow
  any authenticated user of the clinic to read/update the single model row.
  This is intentional for a single-clinic deployment.
*/

CREATE TABLE IF NOT EXISTS ai_model_weights (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  model_type text NOT NULL DEFAULT 'no_show_logistic',
  weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  trained_at timestamptz DEFAULT now(),
  training_examples int NOT NULL DEFAULT 0,
  training_accuracy real NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_model_weights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_ai_model" ON ai_model_weights;
CREATE POLICY "read_ai_model" ON ai_model_weights FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "write_ai_model" ON ai_model_weights;
CREATE POLICY "write_ai_model" ON ai_model_weights FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_ai_model" ON ai_model_weights;
CREATE POLICY "update_ai_model" ON ai_model_weights FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
