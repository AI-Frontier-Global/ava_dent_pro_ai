import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Patient } from '../types';
import type { DbPatient } from './db-types';
import { mapPatient } from './db-types';

export function usePatientsStore() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const patientsRef = useRef<Patient[]>([]);
  useEffect(() => {
    patientsRef.current = patients;
  }, [patients]);

  const loadPatients = useCallback(async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    setPatients((data as DbPatient[]).map(mapPatient));
  }, []);

  const addPatient = useCallback(async (p: Omit<Patient, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('patients')
      .insert({
        full_name: p.fullName,
        phone: p.phone,
        birth_date: p.birthDate,
        gender: p.gender,
        notes: p.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    const newPatient = mapPatient(data as DbPatient);
    setPatients((prev) => [newPatient, ...prev]);
    return newPatient;
  }, []);

  const batchAddPatients = useCallback(
    async (items: Array<Omit<Patient, 'id' | 'createdAt'>>): Promise<{ added: Patient[]; failed: number }> => {
      const rows = items.map((p) => ({
        full_name: p.fullName,
        phone: p.phone,
        birth_date: p.birthDate || null,
        gender: p.gender,
        notes: p.notes ?? null,
      }));
      const { data, error } = await supabase.from('patients').insert(rows).select('*');
      if (error) throw error;
      const added = (data as DbPatient[]).map(mapPatient);
      setPatients((prev) => [...added, ...prev]);
      return { added, failed: items.length - added.length };
    },
    [],
  );

  const updatePatient = useCallback(async (id: string, patch: Partial<Omit<Patient, 'id' | 'createdAt'>>) => {
    const update: Record<string, unknown> = {};
    if (patch.fullName !== undefined) update.full_name = patch.fullName;
    if (patch.phone !== undefined) update.phone = patch.phone;
    if (patch.birthDate !== undefined) update.birth_date = patch.birthDate;
    if (patch.gender !== undefined) update.gender = patch.gender;
    if (patch.notes !== undefined) update.notes = patch.notes;
    if (Object.keys(update).length === 0) return;
    const { error } = await supabase.from('patients').update(update).eq('id', id);
    if (error) throw error;
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const deletePatient = useCallback(async (id: string) => {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) throw error;
    setPatients((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleRealtimeEvent = useCallback((payload: { eventType: string; new: unknown; old: unknown }) => {
    if (payload.eventType === 'INSERT') {
      setPatients((prev) => {
        const p = mapPatient(payload.new as DbPatient);
        return prev.some((x) => x.id === p.id) ? prev : [p, ...prev];
      });
    } else if (payload.eventType === 'UPDATE') {
      const p = mapPatient(payload.new as DbPatient);
      setPatients((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    } else if (payload.eventType === 'DELETE') {
      const id = (payload.old as { id: string }).id;
      setPatients((prev) => prev.filter((x) => x.id !== id));
    }
  }, []);

  return {
    patients,
    patientsRef,
    setPatients,
    loadPatients,
    addPatient,
    batchAddPatients,
    updatePatient,
    deletePatient,
    handleRealtimeEvent,
  };
}

export type PatientsStore = ReturnType<typeof usePatientsStore>;
