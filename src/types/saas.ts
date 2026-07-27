export type PlanId = 'basic' | 'pro' | 'enterprise';

export type ClinicPlan = {
  id: PlanId;
  name: string;
  nameAr: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxUsers: number;
  maxPatients: number;
  features: string[];
  popular: boolean;
  sortOrder: number;
};

export type ClinicRole = 'admin' | 'doctor' | 'receptionist' | 'assistant';

export const ROLE_LABELS: Record<ClinicRole, string> = {
  admin: 'مدير العيادة',
  doctor: 'طبيب',
  receptionist: 'موظف الاستقبال',
  assistant: 'مساعد',
};

export const ROLE_STYLES: Record<ClinicRole, { badge: string; dot: string }> = {
  admin: { badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  doctor: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  receptionist: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  assistant: { badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
};

export type Clinic = {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  planId: PlanId;
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  trialEndsAt: string | null;
  country: string;
  currency: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  createdAt: string;
};

export type ClinicMember = {
  id: string;
  clinicId: string;
  userId: string;
  role: ClinicRole;
  fullName: string | null;
  email: string | null;
  createdAt: string;
};

export type Subscription = {
  id: string;
  clinicId: string;
  planId: PlanId;
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  billingCycle: 'monthly' | 'yearly';
  paymentMethod: string | null;
  paymentProvider: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  amount: number;
  currency: string;
};

export type SupportTicket = {
  id: string;
  clinicId: string;
  subject: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  category: string;
  reply: string | null;
  createdAt: string;
};

export const TICKET_STATUS_LABELS: Record<SupportTicket['status'], string> = {
  open: 'مفتوح',
  pending: 'قيد الانتظار',
  resolved: 'تم الحل',
  closed: 'مغلق',
};

export const TICKET_STATUS_STYLES: Record<SupportTicket['status'], { badge: string; dot: string }> = {
  open: { badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  pending: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  resolved: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  closed: { badge: 'bg-slate-200 text-slate-600', dot: 'bg-slate-400' },
};

export const TICKET_PRIORITY_LABELS: Record<SupportTicket['priority'], string> = {
  low: 'منخفضة',
  normal: 'عادية',
  high: 'عالية',
  urgent: 'عاجلة',
};

export const TICKET_PRIORITY_STYLES: Record<SupportTicket['priority'], { badge: string }> = {
  low: { badge: 'bg-slate-100 text-slate-600' },
  normal: { badge: 'bg-sky-100 text-sky-700' },
  high: { badge: 'bg-amber-100 text-amber-700' },
  urgent: { badge: 'bg-rose-100 text-rose-700' },
};

export const CURRENCIES: Record<string, { symbol: string; name: string; nameAr: string }> = {
  JOD: { symbol: 'د.أ', name: 'Jordanian Dinar', nameAr: 'دينار أردني' },
  SAR: { symbol: 'ر.س', name: 'Saudi Riyal', nameAr: 'ريال سعودي' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', nameAr: 'درهم إماراتي' },
  EGP: { symbol: 'ج.م', name: 'Egyptian Pound', nameAr: 'جنيه مصري' },
  USD: { symbol: '$', name: 'US Dollar', nameAr: 'دولار أمريكي' },
};

export const COUNTRIES: Record<string, { name: string; nameAr: string; currency: string }> = {
  JO: { name: 'Jordan', nameAr: 'الأردن', currency: 'JOD' },
  SA: { name: 'Saudi Arabia', nameAr: 'السعودية', currency: 'SAR' },
  AE: { name: 'UAE', nameAr: 'الإمارات', currency: 'AED' },
  EG: { name: 'Egypt', nameAr: 'مصر', currency: 'EGP' },
};

export const PAYMENT_PROVIDERS = [
  { id: 'stripe', name: 'Stripe', nameAr: 'بطاقة ائتمان (Stripe)', icon: '💳' },
  { id: 'paypal', name: 'PayPal', nameAr: 'PayPal', icon: '🅿️' },
  { id: 'mada', name: 'Mada', nameAr: 'مدى', icon: '🏦' },
  { id: 'fawry', name: 'Fawry', nameAr: 'فوري', icon: '📱' },
  { id: 'cliq', name: 'CliQ', nameAr: 'CliQ', icon: '⚡' },
] as const;
