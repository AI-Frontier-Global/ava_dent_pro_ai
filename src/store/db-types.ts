import type {
  Appointment,
  InvoiceItem,
  FollowUp,
  FollowUpType,
  FollowUpStatus,
  RecurrenceType,
} from '../types';
import { APPOINTMENT_COLORS } from '../types';

export type DbPatient = {
  id: string;
  full_name: string;
  phone: string;
  birth_date: string;
  gender: 'ذكر' | 'أنثى';
  notes: string | null;
  created_at: string;
};

export type DbAppointment = {
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

export type DbInvoice = {
  id: string;
  patient_id: string;
  patient_name: string;
  tax_rate: number;
  created_at: string;
  cliq_link: string | null;
};

export type DbInvoiceItem = {
  id: string;
  invoice_id: string;
  service_name: string;
  price: number;
  qty: number;
};

export type DbFollowUp = {
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

export type DbInvoicePayment = {
  id: string;
  invoice_id: string;
  amount: number;
  method: 'cash' | 'card' | 'cliq' | 'transfer';
  note: string | null;
  created_at: string;
};

export type DbToothRecord = {
  id: string;
  patient_id: string;
  tooth_number: number;
  condition: 'healthy' | 'cavity' | 'filled' | 'extracted' | 'crown' | 'implant' | 'root_canal' | 'missing';
  notes: string | null;
  updated_at: string;
};

export type DbPatientImage = {
  id: string;
  patient_id: string;
  type: 'xray' | 'photo' | 'document';
  title: string;
  description: string | null;
  storage_path: string;
  created_at: string;
};

export type DbTreatmentPlan = {
  id: string;
  patient_id: string;
  title: string;
  diagnosis: string | null;
  status: 'active' | 'completed' | 'on_hold';
  total_cost: number;
  created_at: string;
};

export type DbTreatmentStep = {
  id: string;
  plan_id: string;
  title: string;
  description: string | null;
  cost: number;
  status: 'pending' | 'in_progress' | 'done' | 'cancelled';
  step_order: number;
  due_date: string | null;
  created_at: string;
};

export type DbInsurancePolicy = {
  id: string;
  patient_id: string;
  provider: string;
  policy_number: string;
  coverage_percent: number;
  max_annual: number;
  remaining: number;
  status: 'active' | 'expired' | 'rejected' | 'pending';
  valid_until: string | null;
  created_at: string;
};

export type DbMembershipPlan = {
  id: string;
  name: string;
  price: number;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  active: boolean;
  created_at: string;
};

export type DbPatientMembership = {
  id: string;
  patient_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'paused';
  started_at: string;
  next_billing: string | null;
  created_at: string;
  membership_plans: { name: string } | null;
};

export type DbClinicSettings = {
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

export const uid = () => Math.random().toString(36).slice(2, 10);

export const mapPatient = (p: DbPatient) => ({
  id: p.id,
  fullName: p.full_name,
  phone: p.phone,
  birthDate: p.birth_date,
  gender: p.gender,
  notes: p.notes ?? undefined,
  createdAt: p.created_at,
});

export const mapAppointment = (a: DbAppointment): Appointment => ({
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

export const mapInvoice = (
  i: DbInvoice,
  items: InvoiceItem[],
) => ({
  id: i.id,
  patientId: i.patient_id,
  patientName: i.patient_name,
  items,
  taxRate: Number(i.tax_rate),
  createdAt: i.created_at,
  cliqLink: i.cliq_link,
});

export const mapFollowUp = (f: DbFollowUp): FollowUp => ({
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
