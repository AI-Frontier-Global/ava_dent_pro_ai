import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { MembershipPlan, PatientMembership, BillingCycle } from '../types';
import type { DbMembershipPlan, DbPatientMembership } from './db-types';
import type { PatientsStore } from './usePatientsStore';

export function useMembershipsStore(patientsStore: PatientsStore) {
  const loadMembershipPlans = useCallback(async (): Promise<MembershipPlan[]> => {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as DbMembershipPlan[]).map((r) => ({
      id: r.id,
      name: r.name,
      price: Number(r.price),
      billingCycle: r.billing_cycle,
      features: r.features ?? [],
      active: r.active,
      createdAt: r.created_at,
    }));
  }, []);

  const addMembershipPlan = useCallback(
    async (input: {
      name: string;
      price: number;
      billingCycle: BillingCycle;
      features: string[];
    }): Promise<MembershipPlan> => {
      const { data, error } = await supabase
        .from('membership_plans')
        .insert({
          name: input.name,
          price: input.price,
          billing_cycle: input.billingCycle,
          features: input.features,
          active: true,
        })
        .select()
        .single();
      if (error) throw error;
      const r = data as DbMembershipPlan;
      return {
        id: r.id,
        name: r.name,
        price: Number(r.price),
        billingCycle: r.billing_cycle,
        features: r.features ?? [],
        active: r.active,
        createdAt: r.created_at,
      };
    },
    [],
  );

  const updateMembershipPlan = useCallback(
    async (id: string, patch: Partial<Pick<MembershipPlan, 'name' | 'price' | 'billingCycle' | 'features' | 'active'>>) => {
      const update: Record<string, unknown> = {};
      if (patch.name !== undefined) update.name = patch.name;
      if (patch.price !== undefined) update.price = patch.price;
      if (patch.billingCycle !== undefined) update.billing_cycle = patch.billingCycle;
      if (patch.features !== undefined) update.features = patch.features;
      if (patch.active !== undefined) update.active = patch.active;
      const { error } = await supabase.from('membership_plans').update(update).eq('id', id);
      if (error) throw error;
    },
    [],
  );

  const deleteMembershipPlan = useCallback(async (id: string) => {
    const { error } = await supabase.from('membership_plans').delete().eq('id', id);
    if (error) throw error;
  }, []);

  const loadPatientMemberships = useCallback(async (): Promise<PatientMembership[]> => {
    const { data, error } = await supabase
      .from('patient_memberships')
      .select('*, membership_plans(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as DbPatientMembership[]).map((r) => {
      const patient = patientsStore.patientsRef.current.find((x) => x.id === r.patient_id);
      return {
        id: r.id,
        patientId: r.patient_id,
        patientName: patient?.fullName ?? '—',
        planId: r.plan_id,
        planName: r.membership_plans?.name ?? '—',
        status: r.status,
        startedAt: r.started_at,
        nextBilling: r.next_billing ?? undefined,
        createdAt: r.created_at,
      };
    });
  }, [patientsStore]);

  const addPatientMembership = useCallback(
    async (input: {
      patientId: string;
      planId: string;
      billingCycle: BillingCycle;
    }): Promise<PatientMembership> => {
      const now = new Date();
      const next = new Date(now);
      if (input.billingCycle === 'monthly') next.setMonth(next.getMonth() + 1);
      else if (input.billingCycle === 'quarterly') next.setMonth(next.getMonth() + 3);
      else next.setFullYear(next.getFullYear() + 1);
      const { data, error } = await supabase
        .from('patient_memberships')
        .insert({
          patient_id: input.patientId,
          plan_id: input.planId,
          status: 'active',
          started_at: now.toISOString().slice(0, 10),
          next_billing: next.toISOString().slice(0, 10),
        })
        .select('*, membership_plans(name)')
        .single();
      if (error) throw error;
      const r = data as DbPatientMembership;
      const patient = patientsStore.patientsRef.current.find((x) => x.id === input.patientId);
      return {
        id: r.id,
        patientId: r.patient_id,
        patientName: patient?.fullName ?? '—',
        planId: r.plan_id,
        planName: r.membership_plans?.name ?? '—',
        status: r.status,
        startedAt: r.started_at,
        nextBilling: r.next_billing ?? undefined,
        createdAt: r.created_at,
      };
    },
    [patientsStore],
  );

  const updatePatientMembershipStatus = useCallback(
    async (id: string, status: 'active' | 'cancelled' | 'paused') => {
      const { error } = await supabase
        .from('patient_memberships')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    [],
  );

  const deletePatientMembership = useCallback(async (id: string) => {
    const { error } = await supabase.from('patient_memberships').delete().eq('id', id);
    if (error) throw error;
  }, []);

  return {
    loadMembershipPlans,
    addMembershipPlan,
    updateMembershipPlan,
    deleteMembershipPlan,
    loadPatientMemberships,
    addPatientMembership,
    updatePatientMembershipStatus,
    deletePatientMembership,
  };
}

export type MembershipsStore = ReturnType<typeof useMembershipsStore>;
