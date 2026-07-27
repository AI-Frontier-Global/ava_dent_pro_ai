/*
# Create treatment plans, insurance, and memberships tables

1. New Tables
- `treatment_plans`: multi-step treatment plans per patient.
  - id, patient_id (fk), user_id (owner), title, diagnosis, status, total_cost, created_at
- `treatment_steps`: individual steps belonging to a plan.
  - id, plan_id (fk -> treatment_plans cascade), user_id (owner),
    title, description, cost, status, step_order, due_date, created_at
- `insurance_policies`: insurance coverage records per patient.
  - id, patient_id (fk), user_id (owner), provider, policy_number,
    coverage_percent, max_annual, remaining, status, valid_until, created_at
- `membership_plans`: recurring billing package templates.
  - id, user_id (owner), name, price, billing_cycle, features (text[]),
    active, created_at
- `patient_memberships`: active subscriptions linking patients to plans.
  - id, patient_id (fk), user_id (owner), plan_id (fk -> membership_plans),
    status, started_at, next_billing, created_at

2. Security
- RLS enabled on all tables; owner-scoped CRUD via auth.uid() = user_id.
- treatment_steps scoped through parent plan via EXISTS check.
- patient_memberships scoped through parent plan via EXISTS check.

3. Notes
- Idempotent: uses IF NOT EXISTS and DROP POLICY IF EXISTS.
- No data is deleted.
*/

-- ============ Treatment plans ============
CREATE TABLE IF NOT EXISTS treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  diagnosis text,
  status text NOT NULL DEFAULT 'active',
  total_cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_treatment_plans" ON treatment_plans;
CREATE POLICY "select_own_treatment_plans" ON treatment_plans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_treatment_plans" ON treatment_plans;
CREATE POLICY "insert_own_treatment_plans" ON treatment_plans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_treatment_plans" ON treatment_plans;
CREATE POLICY "update_own_treatment_plans" ON treatment_plans FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_treatment_plans" ON treatment_plans;
CREATE POLICY "delete_own_treatment_plans" ON treatment_plans FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_user_id ON treatment_plans(user_id);

-- ============ Treatment steps ============
CREATE TABLE IF NOT EXISTS treatment_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES treatment_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  description text,
  cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  step_order int NOT NULL DEFAULT 0,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE treatment_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_treatment_steps" ON treatment_steps;
CREATE POLICY "select_own_treatment_steps" ON treatment_steps FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM treatment_plans WHERE treatment_plans.id = treatment_steps.plan_id AND treatment_plans.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_treatment_steps" ON treatment_steps;
CREATE POLICY "insert_own_treatment_steps" ON treatment_steps FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM treatment_plans WHERE treatment_plans.id = treatment_steps.plan_id AND treatment_plans.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_treatment_steps" ON treatment_steps;
CREATE POLICY "update_own_treatment_steps" ON treatment_steps FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM treatment_plans WHERE treatment_plans.id = treatment_steps.plan_id AND treatment_plans.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM treatment_plans WHERE treatment_plans.id = treatment_steps.plan_id AND treatment_plans.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_treatment_steps" ON treatment_steps;
CREATE POLICY "delete_own_treatment_steps" ON treatment_steps FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM treatment_plans WHERE treatment_plans.id = treatment_steps.plan_id AND treatment_plans.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_treatment_steps_plan_id ON treatment_steps(plan_id);
CREATE INDEX IF NOT EXISTS idx_treatment_steps_user_id ON treatment_steps(user_id);

-- ============ Insurance policies ============
CREATE TABLE IF NOT EXISTS insurance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  provider text NOT NULL,
  policy_number text NOT NULL,
  coverage_percent numeric NOT NULL DEFAULT 0,
  max_annual numeric NOT NULL DEFAULT 0,
  remaining numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  valid_until date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_insurance_policies" ON insurance_policies;
CREATE POLICY "select_own_insurance_policies" ON insurance_policies FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_insurance_policies" ON insurance_policies;
CREATE POLICY "insert_own_insurance_policies" ON insurance_policies FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_insurance_policies" ON insurance_policies;
CREATE POLICY "update_own_insurance_policies" ON insurance_policies FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_insurance_policies" ON insurance_policies;
CREATE POLICY "delete_own_insurance_policies" ON insurance_policies FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_patient_id ON insurance_policies(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_user_id ON insurance_policies(user_id);

-- ============ Membership plans ============
CREATE TABLE IF NOT EXISTS membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  features text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_membership_plans" ON membership_plans;
CREATE POLICY "select_own_membership_plans" ON membership_plans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_membership_plans" ON membership_plans;
CREATE POLICY "insert_own_membership_plans" ON membership_plans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_membership_plans" ON membership_plans;
CREATE POLICY "update_own_membership_plans" ON membership_plans FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_membership_plans" ON membership_plans;
CREATE POLICY "delete_own_membership_plans" ON membership_plans FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_membership_plans_user_id ON membership_plans(user_id);

-- ============ Patient memberships ============
CREATE TABLE IF NOT EXISTS patient_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  plan_id uuid REFERENCES membership_plans(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  started_at date NOT NULL DEFAULT CURRENT_DATE,
  next_billing date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE patient_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_patient_memberships" ON patient_memberships;
CREATE POLICY "select_own_patient_memberships" ON patient_memberships FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_patient_memberships" ON patient_memberships;
CREATE POLICY "insert_own_patient_memberships" ON patient_memberships FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_patient_memberships" ON patient_memberships;
CREATE POLICY "update_own_patient_memberships" ON patient_memberships FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_patient_memberships" ON patient_memberships;
CREATE POLICY "delete_own_patient_memberships" ON patient_memberships FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_patient_memberships_patient_id ON patient_memberships(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_memberships_user_id ON patient_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_memberships_plan_id ON patient_memberships(plan_id);
