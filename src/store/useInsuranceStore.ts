import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { InsurancePolicy, InsuranceStatus } from '../types';
import type { DbInsurancePolicy } from './db-types';
import type { PatientsStore } from './usePatientsStore';

export function useInsuranceStore(patientsStore: PatientsStore) {
  const loadInsurancePolicies = useCallback(async (): Promise<InsurancePolicy[]> => {
    const { data, error } = await supabase
      .from('insurance_policies')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as DbInsurancePolicy[]).map((r) => {
      const patient = patientsStore.patientsRef.current.find((x) => x.id === r.patient_id);
      return {
        id: r.id,
        patientId: r.patient_id,
        patientName: patient?.fullName ?? '—',
        provider: r.provider,
        policyNumber: r.policy_number,
        coveragePercent: Number(r.coverage_percent),
        maxAnnual: Number(r.max_annual),
        remaining: Number(r.remaining),
        status: r.status,
        validUntil: r.valid_until ?? undefined,
        createdAt: r.created_at,
      };
    });
  }, [patientsStore]);

  const addInsurancePolicy = useCallback(
    async (input: {
      patientId: string;
      provider: string;
      policyNumber: string;
      coveragePercent: number;
      maxAnnual: number;
      validUntil?: string;
    }): Promise<InsurancePolicy> => {
      const { data, error } = await supabase
        .from('insurance_policies')
        .insert({
          patient_id: input.patientId,
          provider: input.provider,
          policy_number: input.policyNumber,
          coverage_percent: input.coveragePercent,
          max_annual: input.maxAnnual,
          remaining: input.maxAnnual,
          status: 'pending',
          valid_until: input.validUntil ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      const r = data as DbInsurancePolicy;
      const patient = patientsStore.patientsRef.current.find((x) => x.id === input.patientId);
      return {
        id: r.id,
        patientId: r.patient_id,
        patientName: patient?.fullName ?? '—',
        provider: r.provider,
        policyNumber: r.policy_number,
        coveragePercent: Number(r.coverage_percent),
        maxAnnual: Number(r.max_annual),
        remaining: Number(r.remaining),
        status: r.status,
        validUntil: r.valid_until ?? undefined,
        createdAt: r.created_at,
      };
    },
    [patientsStore],
  );

  const updateInsuranceStatus = useCallback(async (id: string, status: InsuranceStatus) => {
    const { error } = await supabase.from('insurance_policies').update({ status }).eq('id', id);
    if (error) throw error;
  }, []);

  const deleteInsurancePolicy = useCallback(async (id: string) => {
    const { error } = await supabase.from('insurance_policies').delete().eq('id', id);
    if (error) throw error;
  }, []);

  return {
    loadInsurancePolicies,
    addInsurancePolicy,
    updateInsuranceStatus,
    deleteInsurancePolicy,
  };
}

export type InsuranceStore = ReturnType<typeof useInsuranceStore>;
