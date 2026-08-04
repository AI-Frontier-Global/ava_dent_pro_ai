import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ToothRecord, ToothCondition } from '../types';
import type { DbToothRecord } from './db-types';

export function useToothRecordsStore() {
  const loadToothRecords = useCallback(async (patientId: string): Promise<ToothRecord[]> => {
    const { data, error } = await supabase
      .from('tooth_records')
      .select('*')
      .eq('patient_id', patientId);
    if (error) throw error;
    return (data as DbToothRecord[]).map((r) => ({
      id: r.id,
      patientId: r.patient_id,
      toothNumber: r.tooth_number,
      condition: r.condition,
      notes: r.notes ?? undefined,
      updatedAt: r.updated_at,
    }));
  }, []);

  const upsertToothRecord = useCallback(
    async (input: {
      patientId: string;
      toothNumber: number;
      condition: ToothCondition;
      notes?: string;
    }): Promise<ToothRecord> => {
      const { data, error } = await supabase
        .from('tooth_records')
        .upsert(
          {
            patient_id: input.patientId,
            tooth_number: input.toothNumber,
            condition: input.condition,
            notes: input.notes ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: ['patient_id', 'tooth_number'] },
        )
        .select()
        .single();
      if (error) throw error;
      const r = data as DbToothRecord;
      return {
        id: r.id,
        patientId: r.patient_id,
        toothNumber: r.tooth_number,
        condition: r.condition,
        notes: r.notes ?? undefined,
        updatedAt: r.updated_at,
      };
    },
    [],
  );

  const deleteToothRecord = useCallback(async (id: string) => {
    const { error } = await supabase.from('tooth_records').delete().eq('id', id);
    if (error) throw error;
  }, []);

  return { loadToothRecords, upsertToothRecord, deleteToothRecord };
}

export type ToothRecordsStore = ReturnType<typeof useToothRecordsStore>;
