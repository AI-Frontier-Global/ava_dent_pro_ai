// تحليلات العيادة — مؤشرات أداء مجمّعة من بيانات المواعيد والمرضى.

import type { Appointment, Patient, Invoice } from '../types';

export interface ClinicKPI {
  totalPatients: number;
  totalAppointments: number;
  completedRate: number;
  cancellationRate: number;
  confirmedRate: number;
  upcomingCount: number;
  totalRevenue: number;
  avgRevenuePerPatient: number;
  utilizationRate: number;
  busiestDay: string | null;
  busiestHour: number | null;
}

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function computeClinicKPIs(
  appointments: Appointment[],
  patients: Patient[],
  invoices: Invoice[],
): ClinicKPI {
  const total = appointments.length;
  const completed = appointments.filter((a) => a.status === 'تم').length;
  const cancelled = appointments.filter((a) => a.status === 'ملغى').length;
  const confirmed = appointments.filter((a) => a.status === 'مؤكد').length;

  const todayIso = new Date().toISOString().slice(0, 10);
  const upcoming = appointments.filter(
    (a) => a.appointmentDate && a.appointmentDate >= todayIso && a.status !== 'تم' && a.status !== 'ملغى',
  ).length;

  const totalRevenue = invoices.reduce(
    (s, inv) => s + inv.items.reduce((is, it) => is + it.price * it.qty, 0) * (1 + inv.taxRate),
    0,
  );

  const dayCounts = new Map<number, number>();
  const hourCounts = new Map<number, number>();
  appointments.forEach((a) => {
    dayCounts.set(a.day, (dayCounts.get(a.day) ?? 0) + 1);
    hourCounts.set(a.startHour, (hourCounts.get(a.startHour) ?? 0) + 1);
  });
  let busiestDay: string | null = null;
  let maxDay = 0;
  dayCounts.forEach((count, day) => {
    if (count > maxDay) {
      maxDay = count;
      busiestDay = DAY_NAMES[day] ?? null;
    }
  });
  let busiestHour: number | null = null;
  let maxHour = 0;
  hourCounts.forEach((count, hour) => {
    if (count > maxHour) {
      maxHour = count;
      busiestHour = hour;
    }
  });

  // نسبة الإشغال: المواعيد المؤكدة+المكتملة مقسومة على إجمالي الساعات المتاحة (8 ساعات × 5 أيام)
  const workSlots = 8 * 5;
  const filledSlots = appointments.filter((a) => a.status === 'تم' || a.status === 'مؤكد').length;
  const utilizationRate = workSlots > 0 ? Math.min(Math.round((filledSlots / workSlots) * 100), 100) : 0;

  return {
    totalPatients: patients.length,
    totalAppointments: total,
    completedRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
    confirmedRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
    upcomingCount: upcoming,
    totalRevenue,
    avgRevenuePerPatient: patients.length > 0 ? totalRevenue / patients.length : 0,
    utilizationRate,
    busiestDay,
    busiestHour,
  };
}
