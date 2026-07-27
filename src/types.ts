export type Patient = {
  id: string;
  fullName: string;
  phone: string;
  birthDate: string;
  gender: 'ذكر' | 'أنثى';
  notes?: string;
  createdAt: string;
};

export type AppointmentStatus = 'محجوز' | 'مؤكد' | 'تم' | 'ملغى';

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  day: number; // 0 = الأحد ... 4 = الخميس
  startHour: number; // ساعة البداية (9..16)
  duration: number; // بالساعات (افتراضياً 1)
  reason: string;
  status: AppointmentStatus;
  color: string;
  appointmentDate?: string; // ISO date for real-date scheduling
  endHour?: number;
  recurrence?: RecurrenceType;
};

export type InvoiceItem = {
  id: string;
  serviceName: string;
  price: number;
  qty: number;
};

export type Invoice = {
  id: string;
  patientId: string;
  patientName: string;
  items: InvoiceItem[];
  taxRate: number; // 0.16
  createdAt: string;
  cliqLink?: string | null;
};

export type FollowUpType = 'post_visit' | 'reminder' | 'custom';

export type ImageType = 'xray' | 'photo' | 'document';

export type PatientImage = {
  id: string;
  patientId: string;
  type: ImageType;
  title: string;
  description?: string;
  storagePath: string;
  createdAt: string;
};

export const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  xray: 'أشعة',
  photo: 'صورة',
  document: 'مستند',
};

export const IMAGE_TYPE_STYLES: Record<ImageType, { badge: string; icon: string }> = {
  xray: { badge: 'bg-sky-100 text-sky-700', icon: 'text-sky-500' },
  photo: { badge: 'bg-emerald-100 text-emerald-700', icon: 'text-emerald-500' },
  document: { badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-500' },
};

export type TreatmentStepStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';
export type TreatmentPlanStatus = 'active' | 'completed' | 'on_hold';

export type TreatmentStep = {
  id: string;
  planId: string;
  title: string;
  description?: string;
  cost: number;
  status: TreatmentStepStatus;
  stepOrder: number;
  dueDate?: string;
  createdAt: string;
};

export type TreatmentPlan = {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  diagnosis?: string;
  status: TreatmentPlanStatus;
  totalCost: number;
  steps: TreatmentStep[];
  createdAt: string;
};

export const TREATMENT_STEP_STATUS_LABELS: Record<TreatmentStepStatus, string> = {
  pending: 'معلق',
  in_progress: 'قيد التنفيذ',
  done: 'مكتمل',
  cancelled: 'ملغى',
};

export const TREATMENT_STEP_STATUS_STYLES: Record<TreatmentStepStatus, { badge: string; dot: string }> = {
  pending: { badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  in_progress: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  done: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
};

export const TREATMENT_PLAN_STATUS_LABELS: Record<TreatmentPlanStatus, string> = {
  active: 'نشط',
  completed: 'مكتمل',
  on_hold: 'متوقف',
};

export const TREATMENT_PLAN_STATUS_STYLES: Record<TreatmentPlanStatus, { badge: string; dot: string }> = {
  active: { badge: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500' },
  completed: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  on_hold: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
};

export type InsuranceStatus = 'active' | 'expired' | 'rejected' | 'pending';

export type InsurancePolicy = {
  id: string;
  patientId: string;
  patientName: string;
  provider: string;
  policyNumber: string;
  coveragePercent: number;
  maxAnnual: number;
  remaining: number;
  status: InsuranceStatus;
  validUntil?: string;
  createdAt: string;
};

export const INSURANCE_STATUS_LABELS: Record<InsuranceStatus, string> = {
  active: 'ساري',
  expired: 'منتهي',
  rejected: 'مرفوض',
  pending: 'قيد المراجعة',
};

export const INSURANCE_STATUS_STYLES: Record<InsuranceStatus, { badge: string; dot: string }> = {
  active: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  expired: { badge: 'bg-slate-200 text-slate-600', dot: 'bg-slate-400' },
  rejected: { badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  pending: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
};

export const INSURANCE_PROVIDERS = [
  'الخدمات الطبية الملكية',
  'الياسمين للتأمين الصحي',
  'العربية للتأمين',
  'الشرق الأوسط للتأمين الصحي',
  'المتحدة للتأمين',
  'أخرى',
] as const;

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export type MembershipPlan = {
  id: string;
  name: string;
  price: number;
  billingCycle: BillingCycle;
  features: string[];
  active: boolean;
  createdAt: string;
};

export type PatientMembership = {
  id: string;
  patientId: string;
  patientName: string;
  planId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'paused';
  startedAt: string;
  nextBilling?: string;
  createdAt: string;
};

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: 'شهري',
  quarterly: 'ربع سنوي',
  yearly: 'سنوي',
};

export const MEMBERSHIP_STATUS_LABELS: Record<PatientMembership['status'], string> = {
  active: 'نشط',
  cancelled: 'ملغى',
  paused: 'متوقف',
};

export const MEMBERSHIP_STATUS_STYLES: Record<PatientMembership['status'], { badge: string; dot: string }> = {
  active: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  paused: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
};

export type ToothCondition = 'healthy' | 'cavity' | 'filled' | 'extracted' | 'crown' | 'implant' | 'root_canal' | 'missing';

export type ToothRecord = {
  id: string;
  patientId: string;
  toothNumber: number;
  condition: ToothCondition;
  notes?: string;
  updatedAt: string;
};

export const TOOTH_CONDITION_LABELS: Record<ToothCondition, string> = {
  healthy: 'سليم',
  cavity: 'تسوس',
  filled: 'حشوة',
  extracted: 'مقلوع',
  crown: 'تاج',
  implant: 'زراعة',
  root_canal: 'علاج عصب',
  missing: 'مفقود',
};

export const TOOTH_CONDITION_STYLES: Record<ToothCondition, { bg: string; ring: string; label: string }> = {
  healthy: { bg: 'bg-white', ring: 'ring-slate-200', label: 'text-slate-600' },
  cavity: { bg: 'bg-rose-100', ring: 'ring-rose-300', label: 'text-rose-700' },
  filled: { bg: 'bg-sky-100', ring: 'ring-sky-300', label: 'text-sky-700' },
  extracted: { bg: 'bg-slate-300', ring: 'ring-slate-400', label: 'text-slate-700 line-through' },
  crown: { bg: 'bg-amber-100', ring: 'ring-amber-300', label: 'text-amber-700' },
  implant: { bg: 'bg-violet-100', ring: 'ring-violet-300', label: 'text-violet-700' },
  root_canal: { bg: 'bg-teal-100', ring: 'ring-teal-300', label: 'text-teal-700' },
  missing: { bg: 'bg-slate-200', ring: 'ring-slate-300', label: 'text-slate-500' },
};

// FDI tooth numbering: upper right 18-11, upper left 21-28,
// lower left 31-38, lower right 41-48
export const ADULT_TEETH = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
  lowerRight: [41, 42, 43, 44, 45, 46, 47, 48],
};

export type PaymentMethod = 'cash' | 'card' | 'cliq' | 'transfer';

export type InvoicePayment = {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  note?: string;
  createdAt: string;
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'نقداً',
  card: 'بطاقة',
  cliq: 'CliQ',
  transfer: 'تحويل',
};

export const PAYMENT_METHOD_STYLES: Record<PaymentMethod, { badge: string; icon: string }> = {
  cash: { badge: 'bg-emerald-100 text-emerald-700', icon: 'text-emerald-500' },
  card: { badge: 'bg-sky-100 text-sky-700', icon: 'text-sky-500' },
  cliq: { badge: 'bg-violet-100 text-violet-700', icon: 'text-violet-500' },
  transfer: { badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-500' },
};

export type RecurrenceType = 'none' | 'weekly' | 'biweekly' | 'monthly';

export type ClinicSettings = {
  clinicName: string;
  phone: string;
  address: string;
  workStart: number;
  workEnd: number;
  taxRate: number;
  currency: string;
  notifyNew: boolean;
  notifyCancel: boolean;
  notifyReminder: boolean;
  reminderHours: number;
};

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: 'بدون تكرار',
  weekly: 'أسبوعي',
  biweekly: 'كل أسبوعين',
  monthly: 'شهري',
};
export type FollowUpStatus = 'pending' | 'done' | 'cancelled';

export type FollowUp = {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId: string | null;
  followUpDate: string; // ISO date (yyyy-mm-dd)
  type: FollowUpType;
  message: string;
  status: FollowUpStatus;
  createdAt: string;
};

export const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] as const;
export const TIME_SLOTS = [9, 10, 11, 12, 13, 14, 15, 16] as const;

export const APPOINTMENT_COLORS = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
];

export const DENTAL_SERVICES = [
  { name: 'كشف وتشخيص', price: 15 },
  { name: 'تنظيف وإزالة جير', price: 35 },
  { name: 'حشوة ضوئية', price: 45 },
  { name: 'حشوة عادية (أملغمام)', price: 30 },
  { name: 'علاج عصب', price: 120 },
  { name: 'قلع ضرس', price: 40 },
  { name: 'تاج (كراون)', price: 180 },
  { name: 'تقويم أسنان - دفعة', price: 250 },
  { name: 'تبييض الأسنان', price: 150 },
  { name: 'زراعة سن', price: 450 },
];

export const STATUS_STYLES: Record<AppointmentStatus, { badge: string; dot: string }> = {
  'محجوز': { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  'مؤكد': { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  'تم': { badge: 'bg-slate-200 text-slate-600', dot: 'bg-slate-400' },
  'ملغى': { badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
};
