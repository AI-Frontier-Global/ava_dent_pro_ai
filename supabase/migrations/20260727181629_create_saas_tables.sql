/*
# SaaS Multi-Tenant Schema — Part 1: Tables Only

Creates all SaaS tables without policies to avoid forward-reference errors.
Policies will be added in the next migration.
*/

-- 1. CLINIC PLANS
CREATE TABLE IF NOT EXISTS clinic_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  name_ar text NOT NULL,
  price_monthly integer NOT NULL DEFAULT 0,
  price_yearly integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  max_users integer NOT NULL DEFAULT 5,
  max_patients integer NOT NULL DEFAULT 1000,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  popular boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

INSERT INTO clinic_plans (id, name, name_ar, price_monthly, price_yearly, max_users, max_patients, features, popular, sort_order) VALUES
  ('basic', 'Basic', 'الأساسية', 29, 290, 3, 500,
    '["إدارة المرضى","الجدولة والمواعيد","الفواتير الأساسية","تقارير بسيطة","دعم بالبريد الإلكتروني"]'::jsonb,
    false, 1),
  ('pro', 'Pro', 'الاحترافية', 79, 790, 10, 5000,
    '["كل ميزات الباقة الأساسية","مساعد الذكاء الاصطناعي","التصوير والأشعة","خطط العلاج","التأمين الصحي","خطط العضوية","تقارير متقدمة","دعم ذو أولوية"]'::jsonb,
    true, 2),
  ('enterprise', 'Enterprise', 'المؤسسية', 199, 1990, 50, 50000,
    '["كل ميزات الباقة الاحترافية","سلسلة عيادات متعددة","API مخصص","تكامل مع أنظمة خارجية","مدير حساب مخصص","تدريب الفريق","SLA ضمان مستوى الخدمة","تقارير مخصصة"]'::jsonb,
    false, 3)
ON CONFLICT (id) DO NOTHING;

-- 2. CLINICS
CREATE TABLE IF NOT EXISTS clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  subdomain text UNIQUE,
  plan_id text NOT NULL DEFAULT 'basic' REFERENCES clinic_plans(id),
  status text NOT NULL DEFAULT 'trialing',
  trial_ends_at timestamptz,
  country text NOT NULL DEFAULT 'JO',
  currency text NOT NULL DEFAULT 'JOD',
  phone text,
  email text,
  address text,
  logo_url text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinics_slug ON clinics(slug);
CREATE INDEX IF NOT EXISTS idx_clinics_subdomain ON clinics(subdomain);

-- 3. CLINIC MEMBERS
CREATE TABLE IF NOT EXISTS clinic_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'doctor',
  full_name text,
  email text,
  invited_by uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_clinic_members_user ON clinic_members(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_members_clinic ON clinic_members(clinic_id);

-- 4. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
  plan_id text NOT NULL DEFAULT 'basic' REFERENCES clinic_plans(id),
  status text NOT NULL DEFAULT 'trialing',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  payment_method text,
  payment_provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_clinic ON subscriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 5. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  category text NOT NULL DEFAULT 'general',
  reply text,
  replied_by uuid,
  replied_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_clinic ON support_tickets(clinic_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- 6. Enable RLS on all tables
ALTER TABLE clinic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- 7. updated_at trigger helper
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clinics_updated_at ON clinics;
CREATE TRIGGER trg_clinics_updated_at BEFORE UPDATE ON clinics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
