/*
# SaaS Multi-Tenant Schema — Part 2: RLS Policies

Adds row-level security policies to all SaaS tables for tenant isolation.
*/

-- clinic_plans: public read
DROP POLICY IF EXISTS "public_read_clinic_plans" ON clinic_plans;
CREATE POLICY "public_read_clinic_plans" ON clinic_plans FOR SELECT
  TO anon, authenticated USING (true);

-- clinics: members can read, admins can update
DROP POLICY IF EXISTS "members_read_own_clinic" ON clinics;
CREATE POLICY "members_read_own_clinic" ON clinics FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM clinic_members WHERE clinic_members.clinic_id = clinics.id AND clinic_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admins_update_own_clinic" ON clinics;
CREATE POLICY "admins_update_own_clinic" ON clinics FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM clinic_members WHERE clinic_members.clinic_id = clinics.id AND clinic_members.user_id = auth.uid() AND clinic_members.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM clinic_members WHERE clinic_members.clinic_id = clinics.id AND clinic_members.user_id = auth.uid() AND clinic_members.role = 'admin')
  );

-- clinic_members: members can read own clinic members, admins manage
DROP POLICY IF EXISTS "members_read_own_clinic_members" ON clinic_members;
CREATE POLICY "members_read_own_clinic_members" ON clinic_members FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM clinic_members cm WHERE cm.clinic_id = clinic_members.clinic_id AND cm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admins_insert_clinic_members" ON clinic_members;
CREATE POLICY "admins_insert_clinic_members" ON clinic_members FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM clinic_members cm WHERE cm.clinic_id = clinic_members.clinic_id AND cm.user_id = auth.uid() AND cm.role = 'admin')
  );

DROP POLICY IF EXISTS "admins_update_clinic_members" ON clinic_members;
CREATE POLICY "admins_update_clinic_members" ON clinic_members FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM clinic_members cm WHERE cm.clinic_id = clinic_members.clinic_id AND cm.user_id = auth.uid() AND cm.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM clinic_members cm WHERE cm.clinic_id = clinic_members.clinic_id AND cm.user_id = auth.uid() AND cm.role = 'admin')
  );

DROP POLICY IF EXISTS "admins_delete_clinic_members" ON clinic_members;
CREATE POLICY "admins_delete_clinic_members" ON clinic_members FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM clinic_members cm WHERE cm.clinic_id = clinic_members.clinic_id AND cm.user_id = auth.uid() AND cm.role = 'admin')
  );

-- subscriptions: admins can read/update own clinic
DROP POLICY IF EXISTS "admins_read_own_subscription" ON subscriptions;
CREATE POLICY "admins_read_own_subscription" ON subscriptions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM clinic_members WHERE clinic_members.clinic_id = subscriptions.clinic_id AND clinic_members.user_id = auth.uid() AND clinic_members.role = 'admin')
  );

DROP POLICY IF EXISTS "admins_update_own_subscription" ON subscriptions;
CREATE POLICY "admins_update_own_subscription" ON subscriptions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM clinic_members WHERE clinic_members.clinic_id = subscriptions.clinic_id AND clinic_members.user_id = auth.uid() AND clinic_members.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM clinic_members WHERE clinic_members.clinic_id = subscriptions.clinic_id AND clinic_members.user_id = auth.uid() AND clinic_members.role = 'admin')
  );

-- support_tickets: members can read/create own clinic tickets, admins can update
DROP POLICY IF EXISTS "members_read_own_tickets" ON support_tickets;
CREATE POLICY "members_read_own_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM clinic_members WHERE clinic_members.clinic_id = support_tickets.clinic_id AND clinic_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "members_insert_own_tickets" ON support_tickets;
CREATE POLICY "members_insert_own_tickets" ON support_tickets FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM clinic_members WHERE clinic_members.clinic_id = support_tickets.clinic_id AND clinic_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admins_update_own_tickets" ON support_tickets;
CREATE POLICY "admins_update_own_tickets" ON support_tickets FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM clinic_members WHERE clinic_members.clinic_id = support_tickets.clinic_id AND clinic_members.user_id = auth.uid() AND clinic_members.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM clinic_members WHERE clinic_members.clinic_id = support_tickets.clinic_id AND clinic_members.user_id = auth.uid() AND clinic_members.role = 'admin')
  );
