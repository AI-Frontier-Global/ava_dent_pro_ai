import type { Appointment, Patient } from '../types';
import { extractFeatures, predictWithModel, featureContribution, FEATURE_LABELS } from './mlModel';
import type { ModelWeights } from './mlModel';

export type RiskLevel = 'low' | 'medium' | 'high';

export type NoShowPrediction = {
  appointmentId: string;
  patientId: string;
  patientName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  factors: { label: string; weight: number }[];
  recommendation: string;
};

export type AIClinicInsights = {
  noShowRate: number;
  confirmedRate: number;
  completedRate: number;
  cancellationRate: number;
  totalAppointments: number;
  upcoming: number;
  highRiskCount: number;
  predictions: NoShowPrediction[];
  busiestDay: string | null;
  busiestHour: number | null;
  averageGapDays: number | null;
  summary: string;
};

const RISK_WEIGHTS = {
  noShowHistory: 30,
  unconfirmed: 25,
  afternoonSlot: 10,
  weekday: 10,
  newPatient: 8,
  ageFactor: 5,
  longGap: 7,
  serviceType: 5,
} as const;

function getAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

function dayName(day: number): string {
  return ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][day] ?? '';
}

export function predictNoShow(
  appointment: Appointment,
  patient: Patient | undefined,
  allAppointments: Appointment[],
): NoShowPrediction {
  const factors: { label: string; weight: number }[] = [];
  let score = 0;

  const patientHistory = allAppointments.filter(
    (a) => a.patientId === appointment.patientId && a.id !== appointment.id,
  );

  const noShows = patientHistory.filter((a) => a.status === 'ملغى').length;
  const totalHistory = patientHistory.length;
  if (totalHistory > 0) {
    const noShowRate = noShows / totalHistory;
    const contribution = Math.round(noShowRate * RISK_WEIGHTS.noShowHistory);
    score += contribution;
    if (noShows > 0) {
      factors.push({ label: `${noShows} موعد ملغى سابقاً`, weight: contribution });
    }
  }

  if (appointment.status === 'محجوز') {
    score += RISK_WEIGHTS.unconfirmed;
    factors.push({ label: 'لم يتم تأكيد الموعد', weight: RISK_WEIGHTS.unconfirmed });
  }

  if (appointment.startHour >= 14) {
    score += RISK_WEIGHTS.afternoonSlot;
    factors.push({ label: 'موعد بعد الظهر', weight: RISK_WEIGHTS.afternoonSlot });
  }

  if (appointment.day === 3 || appointment.day === 4) {
    score += RISK_WEIGHTS.weekday;
    factors.push({ label: `موعد يوم ${dayName(appointment.day)}`, weight: RISK_WEIGHTS.weekday });
  }

  if (totalHistory === 0) {
    score += RISK_WEIGHTS.newPatient;
    factors.push({ label: 'مريض جديد (أول زيارة)', weight: RISK_WEIGHTS.newPatient });
  }

  const age = patient?.birthDate ? getAge(patient.birthDate) : null;
  if (age !== null && age < 30) {
    score += RISK_WEIGHTS.ageFactor;
    factors.push({ label: 'عمر أقل من 30', weight: RISK_WEIGHTS.ageFactor });
  }

  if (appointment.appointmentDate) {
    const createdApprox = patient?.createdAt ?? new Date().toISOString();
    const gapDays = Math.floor(
      (new Date(appointment.appointmentDate).getTime() - new Date(createdApprox).getTime()) /
        (24 * 3600 * 1000),
    );
    if (gapDays > 90) {
      score += RISK_WEIGHTS.longGap;
      factors.push({ label: 'فترة طويلة منذ آخر زيارة', weight: RISK_WEIGHTS.longGap });
    }
  }

  const highRiskServices = ['تقويم أسنان - دفعة', 'زراعة سن', 'علاج عصب'];
  if (highRiskServices.includes(appointment.reason)) {
    score += RISK_WEIGHTS.serviceType;
    factors.push({ label: `نوع علاج مكلف: ${appointment.reason}`, weight: RISK_WEIGHTS.serviceType });
  }

  score = Math.min(score, 95);

  const riskLevel: RiskLevel = score >= 70 ? 'high' : score >= 35 ? 'medium' : 'low';

  let recommendation = '';
  if (riskLevel === 'high') {
    recommendation = 'اتصل بالمريض هاتفياً للتأكيد قبل 24 ساعة وأرسل تذكيراً مزدوجاً على واتساب';
  } else if (riskLevel === 'medium') {
    recommendation = 'أرسل تذكير تأكيد على واتساب قبل يوم، وتذكيراً قبل ساعتين';
  } else {
    recommendation = 'تذكير عادي قبل ساعتين كافٍ';
  }

  factors.sort((a, b) => b.weight - a.weight);

  return {
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    patientName: appointment.patientName,
    riskScore: score,
    riskLevel,
    factors: factors.slice(0, 4),
    recommendation,
  };
}

export function computeClinicInsights(
  appointments: Appointment[],
  patients: Patient[],
): AIClinicInsights {
  const total = appointments.length;
  const completed = appointments.filter((a) => a.status === 'تم').length;
  const cancelled = appointments.filter((a) => a.status === 'ملغى').length;
  const confirmed = appointments.filter((a) => a.status === 'مؤكد').length;
  const booked = appointments.filter((a) => a.status === 'محجوز').length;

  const noShowRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
  const confirmedRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
  const completedRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const cancellationRate = noShowRate;

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const upcoming = appointments.filter(
    (a) => a.appointmentDate && a.appointmentDate >= todayIso && a.status !== 'تم' && a.status !== 'ملغى',
  ).length;

  const upcomingAppts = appointments.filter(
    (a) => a.appointmentDate && a.appointmentDate >= todayIso && a.status !== 'تم' && a.status !== 'ملغى',
  );
  const predictions = upcomingAppts
    .map((a) => {
      const patient = patients.find((p) => p.id === a.patientId);
      return predictNoShow(a, patient, appointments);
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  const highRiskCount = predictions.filter((p) => p.riskLevel === 'high').length;

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
      busiestDay = dayName(day);
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

  let averageGapDays: number | null = null;
  const patientGaps: number[] = [];
  const byPatient = new Map<string, Appointment[]>();
  appointments.forEach((a) => {
    if (!a.appointmentDate) return;
    const arr = byPatient.get(a.patientId) ?? [];
    arr.push(a);
    byPatient.set(a.patientId, arr);
  });
  byPatient.forEach((arr) => {
    arr.sort((a, b) => (a.appointmentDate ?? '').localeCompare(b.appointmentDate ?? ''));
    for (let i = 1; i < arr.length; i++) {
      const gap = Math.floor(
        (new Date(arr[i].appointmentDate!).getTime() - new Date(arr[i - 1].appointmentDate!).getTime()) /
          (24 * 3600 * 1000),
      );
      if (gap > 0) patientGaps.push(gap);
    }
  });
  if (patientGaps.length > 0) {
    averageGapDays = Math.round(patientGaps.reduce((s, g) => s + g, 0) / patientGaps.length);
  }

  const summary = buildSummary({
    total, noShowRate, completedRate, upcoming, highRiskCount, busiestDay, busiestHour,
  });

  return {
    noShowRate,
    confirmedRate,
    completedRate,
    cancellationRate,
    totalAppointments: total,
    upcoming,
    highRiskCount,
    predictions,
    busiestDay,
    busiestHour,
    averageGapDays,
    summary,
  };
}

function buildSummary(opts: {
  total: number;
  noShowRate: number;
  completedRate: number;
  upcoming: number;
  highRiskCount: number;
  busiestDay: string | null;
  busiestHour: number | null;
}): string {
  const parts: string[] = [];
  parts.push(`إجمالي المواعيد ${opts.total}`);
  if (opts.noShowRate > 25) {
    parts.push(`معدل الإلغاء مرتفع (${opts.noShowRate}%) — يُنصح بتكثيف التذكيرات`);
  } else if (opts.noShowRate > 0) {
    parts.push(`معدل الإلغاء ${opts.noShowRate}%`);
  }
  parts.push(`معدل الإكمال ${opts.completedRate}%`);
  if (opts.upcoming > 0) parts.push(`${opts.upcoming} موعد قادم`);
  if (opts.highRiskCount > 0) {
    parts.push(`${opts.highRiskCount} مريض عالي مخاطر الغياب يحتاجون تأكيداً`);
  }
  if (opts.busiestDay) parts.push(`أكثر يوم ازدحاماً: ${opts.busiestDay}`);
  if (opts.busiestHour !== null) parts.push(`أكثر ساعة ازدحاماً: ${opts.busiestHour}:00`);
  return parts.join(' · ');
}

export const RISK_STYLES: Record<RiskLevel, { badge: string; bar: string; label: string; text: string }> = {
  low: { badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', label: 'منخفض', text: 'text-emerald-600' },
  medium: { badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500', label: 'متوسط', text: 'text-amber-600' },
  high: { badge: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500', label: 'مرتفع', text: 'text-rose-600' },
};

/* ============ ML-based prediction ============ */

export function predictNoShowWithModel(
  appointment: Appointment,
  patient: Patient | undefined,
  allAppointments: Appointment[],
  model: ModelWeights,
): NoShowPrediction {
  const features = extractFeatures(appointment, patient, allAppointments);
  const prob = predictWithModel(model, features);
  const score = Math.round(prob * 100);
  const riskLevel: RiskLevel = score >= 70 ? 'high' : score >= 35 ? 'medium' : 'low';

  const contributions = featureContribution(model, features)
    .filter((c) => Math.abs(c.contribution) > 0.01)
    .slice(0, 4)
    .map((c) => ({
      label: FEATURE_LABELS[c.name] ?? c.name,
      weight: Math.round(Math.abs(c.contribution) * 100),
    }));

  const recommendation = buildRecommendation(riskLevel);

  return {
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    patientName: appointment.patientName,
    riskScore: score,
    riskLevel,
    factors: contributions,
    recommendation,
  };
}

function buildRecommendation(riskLevel: RiskLevel): string {
  if (riskLevel === 'high') {
    return 'اتصل بالمريض هاتفياً للتأكيد قبل 24 ساعة وأرسل تذكيراً مزدوجاً على واتساب';
  } else if (riskLevel === 'medium') {
    return 'أرسل تذكير تأكيد على واتساب قبل يوم، وتذكيراً قبل ساعتين';
  }
  return 'تذكير عادي قبل ساعتين كافٍ';
}

export type { ModelWeights };
