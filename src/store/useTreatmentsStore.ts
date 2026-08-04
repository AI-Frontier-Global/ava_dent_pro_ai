import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TreatmentPlan, TreatmentStepStatus, TreatmentPlanStatus } from '../types';
import type { DbTreatmentPlan, DbTreatmentStep } from './db-types';
import type { PatientsStore } from './usePatientsStore';

export function useTreatmentsStore(patientsStore: PatientsStore) {
  const loadTreatmentPlans = useCallback(async (): Promise<TreatmentPlan[]> => {
    const [pRes, sRes] = await Promise.all([
      supabase.from('treatment_plans').select('*').order('created_at', { ascending: false }),
      supabase.from('treatment_steps').select('*').order('step_order', { ascending: true }),
    ]);
    if (pRes.error) throw pRes.error;
    if (sRes.error) throw sRes.error;
    const plans = pRes.data as DbTreatmentPlan[];
    const steps = sRes.data as DbTreatmentStep[];
    return plans.map((p) => {
      const patient = patientsStore.patientsRef.current.find((x) => x.id === p.patient_id);
      return {
        id: p.id,
        patientId: p.patient_id,
        patientName: patient?.fullName ?? '—',
        title: p.title,
        diagnosis: p.diagnosis ?? undefined,
        status: p.status,
        totalCost: Number(p.total_cost),
        createdAt: p.created_at,
        steps: steps
          .filter((s) => s.plan_id === p.id)
          .map((s) => ({
            id: s.id,
            planId: s.plan_id,
            title: s.title,
            description: s.description ?? undefined,
            cost: Number(s.cost),
            status: s.status,
            stepOrder: s.step_order,
            dueDate: s.due_date ?? undefined,
            createdAt: s.created_at,
          })),
      };
    });
  }, [patientsStore]);

  const addTreatmentPlan = useCallback(
    async (
      input: {
        patientId: string;
        title: string;
        diagnosis?: string;
        steps: Array<{ title: string; description?: string; cost: number; dueDate?: string }>;
      },
    ): Promise<TreatmentPlan> => {
      const totalCost = input.steps.reduce((s, x) => s + x.cost, 0);
      const { data, error } = await supabase
        .from('treatment_plans')
        .insert({
          patient_id: input.patientId,
          title: input.title,
          diagnosis: input.diagnosis ?? null,
          status: 'active',
          total_cost: totalCost,
        })
        .select()
        .single();
      if (error) throw error;
      const plan = data as { id: string; created_at: string };
      const stepRows = input.steps.map((s, i) => ({
        plan_id: plan.id,
        title: s.title,
        description: s.description ?? null,
        cost: s.cost,
        status: 'pending' as TreatmentStepStatus,
        step_order: i,
        due_date: s.dueDate ?? null,
      }));
      const { data: stepData, error: stepErr } = await supabase
        .from('treatment_steps')
        .insert(stepRows)
        .select('*');
      if (stepErr) throw stepErr;
      const steps = (stepData as DbTreatmentStep[]).map((s) => ({
        id: s.id,
        planId: s.plan_id,
        title: s.title,
        description: s.description ?? undefined,
        cost: Number(s.cost),
        status: s.status,
        stepOrder: s.step_order,
        dueDate: s.due_date ?? undefined,
        createdAt: s.created_at,
      }));
      const patient = patientsStore.patientsRef.current.find((x) => x.id === input.patientId);
      return {
        id: plan.id,
        patientId: input.patientId,
        patientName: patient?.fullName ?? '—',
        title: input.title,
        diagnosis: input.diagnosis,
        status: 'active',
        totalCost,
        steps,
        createdAt: plan.created_at,
      };
    },
    [patientsStore],
  );

  const updateTreatmentStepStatus = useCallback(async (stepId: string, status: TreatmentStepStatus) => {
    const { error } = await supabase.from('treatment_steps').update({ status }).eq('id', stepId);
    if (error) throw error;
  }, []);

  const updateTreatmentPlanStatus = useCallback(async (planId: string, status: TreatmentPlanStatus) => {
    const { error } = await supabase.from('treatment_plans').update({ status }).eq('id', planId);
    if (error) throw error;
  }, []);

  const deleteTreatmentPlan = useCallback(async (planId: string) => {
    const { error } = await supabase.from('treatment_plans').delete().eq('id', planId);
    if (error) throw error;
  }, []);

  return {
    loadTreatmentPlans,
    addTreatmentPlan,
    updateTreatmentStepStatus,
    updateTreatmentPlanStatus,
    deleteTreatmentPlan,
  };
}

export type TreatmentsStore = ReturnType<typeof useTreatmentsStore>;
