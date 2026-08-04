import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { FollowUp, FollowUpStatus } from '../types';
import type { DbFollowUp } from './db-types';
import { mapFollowUp } from './db-types';

export function useFollowUpsStore() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);

  const loadFollowUps = useCallback(async () => {
    const { data, error } = await supabase
      .from('follow_ups')
      .select('*')
      .order('follow_up_date', { ascending: true });
    if (error) throw error;
    setFollowUps((data as DbFollowUp[]).map(mapFollowUp));
  }, []);

  const addFollowUp = useCallback(async (f: Omit<FollowUp, 'id' | 'createdAt' | 'status'>) => {
    const { data, error } = await supabase
      .from('follow_ups')
      .insert({
        patient_id: f.patientId,
        patient_name: f.patientName,
        appointment_id: f.appointmentId,
        follow_up_date: f.followUpDate,
        type: f.type,
        message: f.message,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    const newF = mapFollowUp(data as DbFollowUp);
    setFollowUps((prev) =>
      [...prev, newF].sort((a, b) => a.followUpDate.localeCompare(b.followUpDate)),
    );
    return newF;
  }, []);

  const updateFollowUpStatus = useCallback(async (id: string, status: FollowUpStatus) => {
    const { error } = await supabase.from('follow_ups').update({ status }).eq('id', id);
    if (error) throw error;
    setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
  }, []);

  const deleteFollowUp = useCallback(async (id: string) => {
    const { error } = await supabase.from('follow_ups').delete().eq('id', id);
    if (error) throw error;
    setFollowUps((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleRealtimeEvent = useCallback((payload: { eventType: string; new: unknown; old: unknown }) => {
    if (payload.eventType === 'INSERT') {
      setFollowUps((prev) => {
        const f = mapFollowUp(payload.new as DbFollowUp);
        return prev.some((x) => x.id === f.id) ? prev : [...prev, f];
      });
    } else if (payload.eventType === 'UPDATE') {
      const f = mapFollowUp(payload.new as DbFollowUp);
      setFollowUps((prev) => prev.map((x) => (x.id === f.id ? f : x)));
    } else if (payload.eventType === 'DELETE') {
      const id = (payload.old as { id: string }).id;
      setFollowUps((prev) => prev.filter((x) => x.id !== id));
    }
  }, []);

  const removeByPatient = useCallback((patientId: string) => {
    setFollowUps((prev) => prev.filter((f) => f.patientId !== patientId));
  }, []);

  return {
    followUps,
    setFollowUps,
    loadFollowUps,
    addFollowUp,
    updateFollowUpStatus,
    deleteFollowUp,
    handleRealtimeEvent,
    removeByPatient,
  };
}

export type FollowUpsStore = ReturnType<typeof useFollowUpsStore>;
