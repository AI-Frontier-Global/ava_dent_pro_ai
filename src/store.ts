import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import type {
  Patient,
  Appointment,
  Invoice,
  InvoiceItem,
  FollowUp,
  FollowUpType,
  FollowUpStatus,
  PatientImage,
  ImageType,
  TreatmentPlan,
  TreatmentStep,
  TreatmentStepStatus,
  TreatmentPlanStatus,
  InsurancePolicy,
  InsuranceStatus,
  MembershipPlan,
  PatientMembership,
  BillingCycle,
  ToothRecord,
  ToothCondition,
  InvoicePayment,
  PaymentMethod,
  RecurrenceType,
  ClinicSettings,
} from './types';
import { APPOINTMENT_COLORS } from './types';

const uid = () => Math.random().toString(36).slice(2, 10);

type DbPatient = {
  id: string;
  full_name: string;
  phone: string;
  birth_date: string;
  gender: 'ذكر' | 'أنثى';
  notes: string | null;
  created_at: string;
};

type DbAppointment = {
  id: string;
  patient_id: string;
  patient_name: string;
  day: number;
  start_hour: number;
  duration: number;
  reason: string;
  status: Appointment['status'];
  color: string | null;
  appointment_date: string | null;
  end_hour: number | null;
  recurrence: string | null;
};

type DbInvoice = {
  id: string;
  patient_id: string;
  patient_name: string;
  tax_rate: number;
  created_at: string;
  cliq_link: string | null;
};

type DbInvoiceItem = {
  id: string;
  invoice_id: string;
  service_name: string;
  price: number;
  qty: number;
};

const mapPatient = (p: DbPatient): Patient => ({
  id: p.id,
  fullName: p.full_name,
  phone: p.phone,
  birthDate: p.birth_date,
  gender: p.gender,
  notes: p.notes ?? undefined,
  createdAt: p.created_at,
});

const mapAppointment = (a: DbAppointment): Appointment => ({
  id: a.id,
  patientId: a.patient_id,
  patientName: a.patient_name,
  day: a.day,
  startHour: a.start_hour,
  duration: a.duration,
  reason: a.reason,
  status: a.status,
  color: a.color ?? APPOINTMENT_COLORS[0],
  appointmentDate: a.appointment_date ?? undefined,
  endHour: a.end_hour ?? undefined,
  recurrence: (a.recurrence as RecurrenceType | null) ?? undefined,
});

const mapInvoice = (i: DbInvoice, items: InvoiceItem[]): Invoice => ({
  id: i.id,
  patientId: i.patient_id,
  patientName: i.patient_name,
  items,
  taxRate: Number(i.tax_rate),
  createdAt: i.created_at,
  cliqLink: i.cliq_link,
});

type DbFollowUp = {
  id: string;
  patient_id: string;
  patient_name: string;
  appointment_id: string | null;
  follow_up_date: string;
  type: FollowUpType;
  message: string;
  status: FollowUpStatus;
  created_at: string;
};

const mapFollowUp = (f: DbFollowUp): FollowUp => ({
  id: f.id,
  patientId: f.patient_id,
  patientName: f.patient_name,
  appointmentId: f.appointment_id,
  followUpDate: f.follow_up_date,
  type: f.type,
  message: f.message,
  status: f.status,
  createdAt: f.created_at,
});

export function useStore() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const patientsRef = useRef<Patient[]>([]);
  useEffect(() => {
    patientsRef.current = patients;
  }, [patients]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [pRes, aRes, iRes, itRes, fRes] = await Promise.all([
        supabase.from('patients').select('*').order('created_at', { ascending: false }),
        supabase.from('appointments').select('*'),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('invoice_items').select('*'),
        supabase.from('follow_ups').select('*').order('follow_up_date', { ascending: true }),
      ]);

      if (pRes.error) throw pRes.error;
      if (aRes.error) throw aRes.error;
      if (iRes.error) throw iRes.error;
      if (itRes.error) throw itRes.error;
      if (fRes.error) throw fRes.error;

      const dbPatients = pRes.data as DbPatient[];
      const dbAppts = aRes.data as DbAppointment[];
      const dbInvoices = iRes.data as DbInvoice[];
      const dbItems = itRes.data as DbInvoiceItem[];
      const dbFollowUps = fRes.data as DbFollowUp[];

      setPatients(dbPatients.map(mapPatient));
      setAppointments(dbAppts.map(mapAppointment));
      setInvoices(
        dbInvoices.map((inv) =>
          mapInvoice(
            inv,
            dbItems
              .filter((it) => it.invoice_id === inv.id)
              .map((it) => ({
                id: it.id,
                serviceName: it.service_name,
                price: Number(it.price),
                qty: it.qty,
              })),
          ),
        ),
      );
      setFollowUps(dbFollowUps.map(mapFollowUp));

      const { data: csData, error: csError } = await supabase
        .from('clinic_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (!csError && csData) {
        const r = csData as {
          clinic_name: string;
          phone: string;
          address: string;
          work_start: number;
          work_end: number;
          tax_rate: number;
          currency: string;
          notify_new: boolean;
          notify_cancel: boolean;
          notify_reminder: boolean;
          reminder_hours: number;
        };
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
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'تعذر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Real-time sync: listen for changes from other devices/tabs
  useEffect(() => {
    const channel = supabase
      .channel('clinic-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
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
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
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
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follow_ups' }, (payload) => {
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
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        loadAll();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_settings' }, () => {
        loadAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll]);

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
      const { data, error } = await supabase
        .from('patients')
        .insert(rows)
        .select('*');
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
    setAppointments((prev) => prev.filter((a) => a.patientId !== id));
    setInvoices((prev) => prev.filter((i) => i.patientId !== id));
    setFollowUps((prev) => prev.filter((f) => f.patientId !== id));
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

  const addInvoice = useCallback(async (inv: Omit<Invoice, 'id' | 'createdAt' | 'taxRate'>) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        patient_id: inv.patientId,
        patient_name: inv.patientName,
        tax_rate: clinicSettings?.taxRate ?? 0.16,
        cliq_link: null,
      })
      .select()
      .single();
    if (error) throw error;

    const newInvId = (data as DbInvoice).id;
    const rows = inv.items.map((it) => ({
      invoice_id: newInvId,
      service_name: it.serviceName,
      price: it.price,
      qty: it.qty,
    }));
    const { error: itemError } = await supabase.from('invoice_items').insert(rows);
    if (itemError) throw itemError;

    const newInv = mapInvoice(data as DbInvoice, inv.items);
    setInvoices((prev) => [newInv, ...prev]);
    return newInv;
  }, []);

  const generateCliqLink = useCallback(async (id: string) => {
    const link = 'https://cliq.pay/' + id + '/' + uid();
    const { error } = await supabase.from('invoices').update({ cliq_link: link }).eq('id', id);
    if (error) throw error;
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, cliqLink: link } : inv)));
    return link;
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateInvoice = useCallback(
    async (id: string, items: InvoiceItem[]) => {
      const { error: delError } = await supabase.from('invoice_items').delete().eq('invoice_id', id);
      if (delError) throw delError;
      if (items.length > 0) {
        const rows = items.map((it) => ({
          invoice_id: id,
          service_name: it.serviceName,
          price: it.price,
          qty: it.qty,
        }));
        const { error: itemError } = await supabase.from('invoice_items').insert(rows);
        if (itemError) throw itemError;
      }
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, items } : inv)),
      );
    },
    [],
  );

  const loadInvoicePayments = useCallback(async (invoiceId: string): Promise<InvoicePayment[]> => {
    const { data, error } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Array<{
      id: string;
      invoice_id: string;
      amount: number;
      method: PaymentMethod;
      note: string | null;
      created_at: string;
    }>).map((r) => ({
      id: r.id,
      invoiceId: r.invoice_id,
      amount: Number(r.amount),
      method: r.method,
      note: r.note ?? undefined,
      createdAt: r.created_at,
    }));
  }, []);

  const addInvoicePayment = useCallback(
    async (input: {
      invoiceId: string;
      amount: number;
      method: PaymentMethod;
      note?: string;
    }): Promise<InvoicePayment> => {
      const { data, error } = await supabase
        .from('invoice_payments')
        .insert({
          invoice_id: input.invoiceId,
          amount: input.amount,
          method: input.method,
          note: input.note ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      const r = data as {
        id: string;
        invoice_id: string;
        amount: number;
        method: PaymentMethod;
        note: string | null;
        created_at: string;
      };
      return {
        id: r.id,
        invoiceId: r.invoice_id,
        amount: Number(r.amount),
        method: r.method,
        note: r.note ?? undefined,
        createdAt: r.created_at,
      };
    },
    [],
  );

  const deleteInvoicePayment = useCallback(async (id: string) => {
    const { error } = await supabase.from('invoice_payments').delete().eq('id', id);
    if (error) throw error;
  }, []);

  // ============ Tooth records ============
  const loadToothRecords = useCallback(async (patientId: string): Promise<ToothRecord[]> => {
    const { data, error } = await supabase
      .from('tooth_records')
      .select('*')
      .eq('patient_id', patientId);
    if (error) throw error;
    return (data as Array<{
      id: string;
      patient_id: string;
      tooth_number: number;
      condition: ToothCondition;
      notes: string | null;
      updated_at: string;
    }>).map((r) => ({
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
      const r = data as {
        id: string;
        patient_id: string;
        tooth_number: number;
        condition: ToothCondition;
        notes: string | null;
        updated_at: string;
      };
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

  const loadPatientImages = useCallback(async (patientId: string): Promise<PatientImage[]> => {
    const { data, error } = await supabase
      .from('patient_images')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Array<{
      id: string;
      patient_id: string;
      type: ImageType;
      title: string;
      description: string | null;
      storage_path: string;
      created_at: string;
    }>).map((r) => ({
      id: r.id,
      patientId: r.patient_id,
      type: r.type,
      title: r.title,
      description: r.description ?? undefined,
      storagePath: r.storage_path,
      createdAt: r.created_at,
    }));
  }, []);

  const uploadPatientImage = useCallback(
    async (
      patientId: string,
      file: File,
      meta: { type: ImageType; title: string; description?: string },
    ): Promise<PatientImage> => {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${patientId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('patient-images')
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const { data, error } = await supabase
        .from('patient_images')
        .insert({
          patient_id: patientId,
          type: meta.type,
          title: meta.title,
          description: meta.description ?? null,
          storage_path: path,
        })
        .select()
        .single();
      if (error) {
        await supabase.storage.from('patient-images').remove([path]);
        throw error;
      }
      const r = data as {
        id: string;
        patient_id: string;
        type: ImageType;
        title: string;
        description: string | null;
        storage_path: string;
        created_at: string;
      };
      return {
        id: r.id,
        patientId: r.patient_id,
        type: r.type,
        title: r.title,
        description: r.description ?? undefined,
        storagePath: r.storage_path,
        createdAt: r.created_at,
      };
    },
    [],
  );

  const deletePatientImage = useCallback(async (img: PatientImage) => {
    const { error } = await supabase.from('patient_images').delete().eq('id', img.id);
    if (error) throw error;
    const { error: storageError } = await supabase.storage.from('patient-images').remove([img.storagePath]);
    if (storageError) throw storageError;
  }, []);

  const createSignedImageUrl = useCallback(async (storagePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('patient-images')
      .createSignedUrl(storagePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  }, []);

  // ============ Treatment plans ============
  const loadTreatmentPlans = useCallback(async (): Promise<TreatmentPlan[]> => {
    const [pRes, sRes] = await Promise.all([
      supabase.from('treatment_plans').select('*').order('created_at', { ascending: false }),
      supabase.from('treatment_steps').select('*').order('step_order', { ascending: true }),
    ]);
    if (pRes.error) throw pRes.error;
    if (sRes.error) throw sRes.error;
    const plans = pRes.data as Array<{
      id: string;
      patient_id: string;
      title: string;
      diagnosis: string | null;
      status: TreatmentPlanStatus;
      total_cost: number;
      created_at: string;
    }>;
    const steps = sRes.data as Array<{
      id: string;
      plan_id: string;
      title: string;
      description: string | null;
      cost: number;
      status: TreatmentStepStatus;
      step_order: number;
      due_date: string | null;
      created_at: string;
    }>;
    return plans.map((p) => {
      const patient = patientsRef.current.find((x) => x.id === p.patient_id);
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
  }, []);

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
      const steps = (stepData as Array<{
        id: string;
        plan_id: string;
        title: string;
        description: string | null;
        cost: number;
        status: TreatmentStepStatus;
        step_order: number;
        due_date: string | null;
        created_at: string;
      }>).map((s) => ({
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
      const patient = patientsRef.current.find((x) => x.id === input.patientId);
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
    [],
  );

  const updateTreatmentStepStatus = useCallback(
    async (stepId: string, status: TreatmentStepStatus) => {
      const { error } = await supabase
        .from('treatment_steps')
        .update({ status })
        .eq('id', stepId);
      if (error) throw error;
    },
    [],
  );

  const updateTreatmentPlanStatus = useCallback(
    async (planId: string, status: TreatmentPlanStatus) => {
      const { error } = await supabase
        .from('treatment_plans')
        .update({ status })
        .eq('id', planId);
      if (error) throw error;
    },
    [],
  );

  const deleteTreatmentPlan = useCallback(async (planId: string) => {
    const { error } = await supabase.from('treatment_plans').delete().eq('id', planId);
    if (error) throw error;
  }, []);

  // ============ Insurance ============
  const loadInsurancePolicies = useCallback(async (): Promise<InsurancePolicy[]> => {
    const { data, error } = await supabase
      .from('insurance_policies')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Array<{
      id: string;
      patient_id: string;
      provider: string;
      policy_number: string;
      coverage_percent: number;
      max_annual: number;
      remaining: number;
      status: InsuranceStatus;
      valid_until: string | null;
      created_at: string;
    }>).map((r) => {
      const patient = patientsRef.current.find((x) => x.id === r.patient_id);
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
  }, []);

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
      const r = data as {
        id: string;
        patient_id: string;
        provider: string;
        policy_number: string;
        coverage_percent: number;
        max_annual: number;
        remaining: number;
        status: InsuranceStatus;
        valid_until: string | null;
        created_at: string;
      };
      const patient = patientsRef.current.find((x) => x.id === input.patientId);
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
    [],
  );

  const updateInsuranceStatus = useCallback(
    async (id: string, status: InsuranceStatus) => {
      const { error } = await supabase
        .from('insurance_policies')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    [],
  );

  const deleteInsurancePolicy = useCallback(async (id: string) => {
    const { error } = await supabase.from('insurance_policies').delete().eq('id', id);
    if (error) throw error;
  }, []);

  // ============ Memberships ============
  const loadMembershipPlans = useCallback(async (): Promise<MembershipPlan[]> => {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Array<{
      id: string;
      name: string;
      price: number;
      billing_cycle: BillingCycle;
      features: string[];
      active: boolean;
      created_at: string;
    }>).map((r) => ({
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
      const r = data as {
        id: string;
        name: string;
        price: number;
        billing_cycle: BillingCycle;
        features: string[];
        active: boolean;
        created_at: string;
      };
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
    return (data as Array<{
      id: string;
      patient_id: string;
      plan_id: string;
      status: 'active' | 'cancelled' | 'paused';
      started_at: string;
      next_billing: string | null;
      created_at: string;
      membership_plans: { name: string } | null;
    }>).map((r) => {
      const patient = patientsRef.current.find((x) => x.id === r.patient_id);
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
  }, []);

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
      const r = data as {
        id: string;
        patient_id: string;
        plan_id: string;
        status: 'active' | 'cancelled' | 'paused';
        started_at: string;
        next_billing: string | null;
        created_at: string;
        membership_plans: { name: string } | null;
      };
      const patient = patientsRef.current.find((x) => x.id === input.patientId);
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
    [],
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
    patients,
    appointments,
    invoices,
    followUps,
    loading,
    loadError,
    reload: loadAll,
    addPatient,
    batchAddPatients,
    updatePatient,
    deletePatient,
    addAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    addInvoice,
    generateCliqLink,
    deleteInvoice,
    updateInvoice,
    loadInvoicePayments,
    addInvoicePayment,
    deleteInvoicePayment,
    loadToothRecords,
    upsertToothRecord,
    deleteToothRecord,
    addFollowUp,
    updateFollowUpStatus,
    deleteFollowUp,
    loadPatientImages,
    uploadPatientImage,
    deletePatientImage,
    createSignedImageUrl,
    loadTreatmentPlans,
    addTreatmentPlan,
    updateTreatmentStepStatus,
    updateTreatmentPlanStatus,
    deleteTreatmentPlan,
    loadInsurancePolicies,
    addInsurancePolicy,
    updateInsuranceStatus,
    deleteInsurancePolicy,
    loadMembershipPlans,
    addMembershipPlan,
    updateMembershipPlan,
    deleteMembershipPlan,
    loadPatientMemberships,
    addPatientMembership,
    updatePatientMembershipStatus,
    deletePatientMembership,
    clinicSettings,
    saveClinicSettings,
  };
}

export type Store = ReturnType<typeof useStore>;
