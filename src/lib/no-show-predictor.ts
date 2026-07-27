// تنبؤ الغياب — طبقة مبسّطة تعيد استخدام محرك noShowEngine الموجود.
// هذا الملف يوفّر واجهة موحّدة لمركز الذكاء الاصطناعي.

import type { Appointment, Patient } from '../types';
import { predictNoShow, type NoShowPrediction } from './noShowEngine';

export interface NoShowSummary {
  predictions: NoShowPrediction[];
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  averageRiskScore: number;
}

export function predictUpcomingNoShows(
  appointments: Appointment[],
  patients: Patient[],
): NoShowSummary {
  const todayIso = new Date().toISOString().slice(0, 10);
  const upcoming = appointments.filter(
    (a) => a.appointmentDate && a.appointmentDate >= todayIso && a.status !== 'تم' && a.status !== 'ملغى',
  );

  const predictions = upcoming
    .map((a) => {
      const patient = patients.find((p) => p.id === a.patientId);
      return predictNoShow(a, patient, appointments);
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  const highRiskCount = predictions.filter((p) => p.riskLevel === 'high').length;
  const mediumRiskCount = predictions.filter((p) => p.riskLevel === 'medium').length;
  const lowRiskCount = predictions.filter((p) => p.riskLevel === 'low').length;
  const averageRiskScore =
    predictions.length > 0
      ? Math.round(predictions.reduce((s, p) => s + p.riskScore, 0) / predictions.length)
      : 0;

  return { predictions, highRiskCount, mediumRiskCount, lowRiskCount, averageRiskScore };
}
