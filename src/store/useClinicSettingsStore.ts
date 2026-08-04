import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ClinicSettings } from '../types';
import type { DbClinicSettings } from './db-types';

export function useClinicSettingsStore() {
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);

  const loadClinicSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('clinic_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (!error && data) {
      const r = data as DbClinicSettings;
      setClinicSettings({
        clinicName: r.clinic_name,
        phone: r.phone,
        address: r.address,
        workStart: r.work_start,
        workEnd: r.work_end,
        taxRate: Number(r.tax_rate),
        currency: r.currency,
        notifyNew: r.notify_new,
        notifyCancel: r.notify_cancel,
        notifyReminder: r.notify_reminder,
        reminderHours: r.reminder_hours,
      });
    }
  }, []);

  const saveClinicSettings = useCallback(async (s: ClinicSettings) => {
    const { error } = await supabase
      .from('clinic_settings')
      .upsert(
        {
          id: 1,
          clinic_name: s.clinicName,
          phone: s.phone,
          address: s.address,
          work_start: s.workStart,
          work_end: s.workEnd,
          tax_rate: s.taxRate,
          currency: s.currency,
          notify_new: s.notifyNew,
          notify_cancel: s.notifyCancel,
          notify_reminder: s.notifyReminder,
          reminder_hours: s.reminderHours,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );
    if (error) throw error;
    setClinicSettings(s);
  }, []);

  return {
    clinicSettings,
    setClinicSettings,
    loadClinicSettings,
    saveClinicSettings,
  };
}

export type ClinicSettingsStore = ReturnType<typeof useClinicSettingsStore>;
