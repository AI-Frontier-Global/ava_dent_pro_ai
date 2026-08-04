import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './lib/supabase';
import { usePatientsStore } from './store/usePatientsStore';
import { useAppointmentsStore } from './store/useAppointmentsStore';
import { useFollowUpsStore } from './store/useFollowUpsStore';
import { useBillingStore } from './store/useBillingStore';
import { useToothRecordsStore } from './store/useToothRecordsStore';
import { useImagingStore } from './store/useImagingStore';
import { useTreatmentsStore } from './store/useTreatmentsStore';
import { useInsuranceStore } from './store/useInsuranceStore';
import { useMembershipsStore } from './store/useMembershipsStore';
import { useClinicSettingsStore } from './store/useClinicSettingsStore';

export function useStore() {
  const patientsStore = usePatientsStore();
  const appointmentsStore = useAppointmentsStore();
  const followUpsStore = useFollowUpsStore();
  const clinicSettingsStore = useClinicSettingsStore();
  const treatmentsStore = useTreatmentsStore(patientsStore);
  const insuranceStore = useInsuranceStore(patientsStore);
  const membershipsStore = useMembershipsStore(patientsStore);

  const clinicSettingsRef = useRef<{ taxRate?: number } | null>(null);
  clinicSettingsRef.current = clinicSettingsStore.clinicSettings
    ? { taxRate: clinicSettingsStore.clinicSettings.taxRate }
    : null;
  const billingStore = useBillingStore(clinicSettingsRef);

  const toothRecordsStore = useToothRecordsStore();
  const imagingStore = useImagingStore();

  const loadAll = useCallback(async () => {
    try {
      await Promise.all([
        patientsStore.loadPatients(),
        appointmentsStore.loadAppointments(),
        billingStore.loadInvoices(),
        followUpsStore.loadFollowUps(),
        clinicSettingsStore.loadClinicSettings(),
      ]);
    } catch (err) {
      throw err;
    }
  }, [
    patientsStore,
    appointmentsStore,
    billingStore,
    followUpsStore,
    clinicSettingsStore,
  ]);

  const loadingRef = useRef(true);
  const loadErrorRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      loadingRef.current = true;
      try {
        await loadAll();
      } catch (err) {
        if (active) loadErrorRef.current = err instanceof Error ? err.message : 'تعذر تحميل البيانات';
      } finally {
        if (active) loadingRef.current = false;
      }
    })();
    return () => {
      active = false;
    };
  }, [loadAll]);

  const [loading, loadError] = useLoadingState(loadingRef, loadErrorRef);

  useEffect(() => {
    const channel = supabase
      .channel('clinic-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
        patientsStore.handleRealtimeEvent(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
        appointmentsStore.handleRealtimeEvent(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follow_ups' }, (payload) => {
        followUpsStore.handleRealtimeEvent(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        void loadAll();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_settings' }, () => {
        void loadAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll, patientsStore, appointmentsStore, followUpsStore]);

  const deletePatient = useCallback(async (id: string) => {
    await patientsStore.deletePatient(id);
    appointmentsStore.removeByPatient(id);
    billingStore.removeByPatient(id);
    followUpsStore.removeByPatient(id);
  }, [patientsStore, appointmentsStore, billingStore, followUpsStore]);

  return {
    patients: patientsStore.patients,
    appointments: appointmentsStore.appointments,
    invoices: billingStore.invoices,
    followUps: followUpsStore.followUps,
    loading,
    loadError,
    reload: loadAll,
    addPatient: patientsStore.addPatient,
    batchAddPatients: patientsStore.batchAddPatients,
    updatePatient: patientsStore.updatePatient,
    deletePatient,
    addAppointment: appointmentsStore.addAppointment,
    updateAppointmentStatus: appointmentsStore.updateAppointmentStatus,
    deleteAppointment: appointmentsStore.deleteAppointment,
    addInvoice: billingStore.addInvoice,
    generateCliqLink: billingStore.generateCliqLink,
    deleteInvoice: billingStore.deleteInvoice,
    updateInvoice: billingStore.updateInvoice,
    loadInvoicePayments: billingStore.loadInvoicePayments,
    addInvoicePayment: billingStore.addInvoicePayment,
    deleteInvoicePayment: billingStore.deleteInvoicePayment,
    loadToothRecords: toothRecordsStore.loadToothRecords,
    upsertToothRecord: toothRecordsStore.upsertToothRecord,
    deleteToothRecord: toothRecordsStore.deleteToothRecord,
    addFollowUp: followUpsStore.addFollowUp,
    updateFollowUpStatus: followUpsStore.updateFollowUpStatus,
    deleteFollowUp: followUpsStore.deleteFollowUp,
    loadPatientImages: imagingStore.loadPatientImages,
    uploadPatientImage: imagingStore.uploadPatientImage,
    deletePatientImage: imagingStore.deletePatientImage,
    createSignedImageUrl: imagingStore.createSignedImageUrl,
    loadTreatmentPlans: treatmentsStore.loadTreatmentPlans,
    addTreatmentPlan: treatmentsStore.addTreatmentPlan,
    updateTreatmentStepStatus: treatmentsStore.updateTreatmentStepStatus,
    updateTreatmentPlanStatus: treatmentsStore.updateTreatmentPlanStatus,
    deleteTreatmentPlan: treatmentsStore.deleteTreatmentPlan,
    loadInsurancePolicies: insuranceStore.loadInsurancePolicies,
    addInsurancePolicy: insuranceStore.addInsurancePolicy,
    updateInsuranceStatus: insuranceStore.updateInsuranceStatus,
    deleteInsurancePolicy: insuranceStore.deleteInsurancePolicy,
    loadMembershipPlans: membershipsStore.loadMembershipPlans,
    addMembershipPlan: membershipsStore.addMembershipPlan,
    updateMembershipPlan: membershipsStore.updateMembershipPlan,
    deleteMembershipPlan: membershipsStore.deleteMembershipPlan,
    loadPatientMemberships: membershipsStore.loadPatientMemberships,
    addPatientMembership: membershipsStore.addPatientMembership,
    updatePatientMembershipStatus: membershipsStore.updatePatientMembershipStatus,
    deletePatientMembership: membershipsStore.deletePatientMembership,
    clinicSettings: clinicSettingsStore.clinicSettings,
    saveClinicSettings: clinicSettingsStore.saveClinicSettings,
  };
}

function useLoadingState(
  loadingRef: React.MutableRefObject<boolean>,
  loadErrorRef: React.MutableRefObject<string | null>,
) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoading(loadingRef.current);
      setLoadError(loadErrorRef.current);
    }, 50);
    return () => clearInterval(interval);
  }, [loadingRef, loadErrorRef]);

  return [loading, loadError] as const;
}

export type Store = ReturnType<typeof useStore>;
