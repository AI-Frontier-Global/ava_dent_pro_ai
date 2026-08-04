import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Appointment } from '../types';
import { APPOINTMENT_COLORS } from '../types';
import type { DbAppointment } from './db-types';
import { mapAppointment } from './db-types';

export function useAppointmentsStore() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const loadAppointments = useCallback(async () => {
    const { data, error } = await supabase.from('appointments').select('*');
    if (error) throw error;
    setAppointments((data as DbAppointment[]).map(mapAppointment));
  }, []);

  const addAppointment = useCallback(async (a: Omit<Appointment, 'id' | 'color'>) => {
    const color = APPOINTMENT_COLORS[Math.floor(Math.random() * APPOINTMENT_COLORS.length)];
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: a.patientId,
        patient_name: a.patientName,
        day: a.day,
        start_hour: a.startHour,
        duration: a.duration,
        end_hour: a.startHour + a.duration,
        reason: a.reason,
        status: a.status,
        color,
        appointment_date: a.appointmentDate ?? null,
        recurrence: a.recurrence ?? 'none',
      })
      .select()
      .single();
    if (error) throw error;
    const newAppt = mapAppointment(data as DbAppointment);
    setAppointments((prev) => [...prev, newAppt]);
    return newAppt;
  }, []);

  const updateAppointmentStatus = useCallback(async (id: string, status: Appointment['status']) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) throw error;
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleRealtimeEvent = useCallback((payload: { eventType: string; new: unknown; old: unknown }) => {
    if (payload.eventType === 'INSERT') {
      setAppointments((prev) => {
        const a = mapAppointment(payload.new as DbAppointment);
        return prev.some((x) => x.id === a.id) ? prev : [...prev, a];
      });
    } else if (payload.eventType === 'UPDATE') {
      const a = mapAppointment(payload.new as DbAppointment);
      setAppointments((prev) => prev.map((x) => (x.id === a.id ? a : x)));
    } else if (payload.eventType === 'DELETE') {
      const id = (payload.old as { id: string }).id;
      setAppointments((prev) => prev.filter((x) => x.id !== id));
    }
  }, []);

  const removeByPatient = useCallback((patientId: string) => {
    setAppointments((prev) => prev.filter((a) => a.patientId !== patientId));
  }, []);

  return {
    appointments,
    setAppointments,
    loadAppointments,
    addAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    handleRealtimeEvent,
    removeByPatient,
  };
}

export type AppointmentsStore = ReturnType<typeof useAppointmentsStore>;
