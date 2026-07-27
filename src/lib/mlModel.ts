import type { Appointment, Patient } from '../types';

// Logistic regression model trained in-browser via gradient descent.
// Features are extracted from each appointment's context; the label is
// whether the appointment ended up cancelled ("ملغى").

export type FeatureVector = number[];

export type TrainingExample = {
  features: FeatureVector;
  label: 0 | 1;
};

export type ModelWeights = {
  bias: number;
  weights: number[];
  featureNames: string[];
  trainedAt: string;
  iterations: number;
  trainingAccuracy: number;
  trainingExamples: number;
  learningRate: number;
};

export const FEATURE_NAMES = [
  'no_show_rate',      // patient's historical cancellation rate
  'total_visits',      // patient's total prior appointments
  'is_unconfirmed',    // status === 'محجوز'
  'is_afternoon',      // startHour >= 14
  'is_late_week',      // day === 3 || 4
  'is_new_patient',    // no prior history
  'age_under_30',      // age < 30
  'long_gap',          // days since last visit > 90
  'high_cost_service', // expensive treatment
  'hour',              // startHour normalized
] as const;

const HIGH_COST_SERVICES = ['تقويم أسنان - دفعة', 'زراعة سن', 'علاج عصب'];

function getAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

export function extractFeatures(
  appointment: Appointment,
  patient: Patient | undefined,
  allAppointments: Appointment[],
): FeatureVector {
  const history = allAppointments.filter(
    (a) => a.patientId === appointment.patientId && a.id !== appointment.id,
  );
  const noShows = history.filter((a) => a.status === 'ملغى').length;
  const noShowRate = history.length > 0 ? noShows / history.length : 0;

  const age = patient?.birthDate ? getAge(patient.birthDate) : null;

  let longGap = 0;
  if (appointment.appointmentDate && history.length > 0) {
    const lastVisit = history
      .map((a) => a.appointmentDate)
      .filter((d): d is string => !!d)
      .sort()
      .pop();
    if (lastVisit) {
      const gap = Math.floor(
        (new Date(appointment.appointmentDate).getTime() - new Date(lastVisit).getTime()) /
          (24 * 3600 * 1000),
      );
      if (gap > 90) longGap = 1;
    }
  } else if (appointment.appointmentDate && patient?.createdAt) {
    const gap = Math.floor(
      (new Date(appointment.appointmentDate).getTime() - new Date(patient.createdAt).getTime()) /
        (24 * 3600 * 1000),
    );
    if (gap > 90) longGap = 1;
  }

  return [
    noShowRate,
    Math.min(history.length / 10, 1), // normalized 0..1
    appointment.status === 'محجوز' ? 1 : 0,
    appointment.startHour >= 14 ? 1 : 0,
    appointment.day === 3 || appointment.day === 4 ? 1 : 0,
    history.length === 0 ? 1 : 0,
    age !== null && age < 30 ? 1 : 0,
    longGap,
    HIGH_COST_SERVICES.includes(appointment.reason) ? 1 : 0,
    (appointment.startHour - 9) / 8, // normalized 0..1 (9..17)
  ];
}

export function buildTrainingSet(
  appointments: Appointment[],
  patients: Patient[],
): TrainingExample[] {
  const patientMap = new Map(patients.map((p) => [p.id, p]));
  // Use only appointments that have a terminal state (تم or ملغى) as labeled examples.
  return appointments
    .filter((a) => a.status === 'تم' || a.status === 'ملغى')
    .map((a) => {
      const patient = patientMap.get(a.patientId);
      // To avoid leakage, build features using only appointments BEFORE this one.
      const priorAppointments = appointments.filter(
        (x) =>
          x.patientId === a.patientId &&
          x.id !== a.id &&
          x.appointmentDate &&
          a.appointmentDate &&
          x.appointmentDate < a.appointmentDate,
      );
      const features = extractFeatures(a, patient, priorAppointments);
      return { features, label: (a.status === 'ملغى' ? 1 : 0) as 0 | 1 };
    });
}

function sigmoid(z: number): number {
  if (z >= 0) {
    return 1 / (1 + Math.exp(-z));
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

export function trainLogisticRegression(
  examples: TrainingExample[],
  options?: { learningRate?: number; iterations?: number; l2?: number },
): ModelWeights {
  const learningRate = options?.learningRate ?? 0.1;
  const iterations = options?.iterations ?? 500;
  const l2 = options?.l2 ?? 0.001;

  const nFeatures = FEATURE_NAMES.length;
  let bias = 0;
  let weights = new Array(nFeatures).fill(0);

  if (examples.length === 0) {
    return {
      bias,
      weights,
      featureNames: [...FEATURE_NAMES],
      trainedAt: new Date().toISOString(),
      iterations: 0,
      trainingAccuracy: 0,
      trainingExamples: 0,
      learningRate,
    };
  }

  for (let iter = 0; iter < iterations; iter++) {
    const gradBias = [0];
    const gradWeights = new Array(nFeatures).fill(0);

    for (const ex of examples) {
      const z = bias + weights.reduce((s, w, i) => s + w * ex.features[i], 0);
      const pred = sigmoid(z);
      const error = pred - ex.label;
      gradBias[0] += error;
      for (let i = 0; i < nFeatures; i++) {
        gradWeights[i] += error * ex.features[i];
      }
    }

    const m = examples.length;
    bias -= (learningRate / m) * gradBias[0];
    for (let i = 0; i < nFeatures; i++) {
      weights[i] -= (learningRate / m) * (gradWeights[i] + l2 * weights[i]);
    }
  }

  // Compute training accuracy
  let correct = 0;
  for (const ex of examples) {
    const z = bias + weights.reduce((s, w, i) => s + w * ex.features[i], 0);
    const pred = sigmoid(z) >= 0.5 ? 1 : 0;
    if (pred === ex.label) correct++;
  }
  const trainingAccuracy = correct / examples.length;

  return {
    bias,
    weights,
    featureNames: [...FEATURE_NAMES],
    trainedAt: new Date().toISOString(),
    iterations,
    trainingAccuracy,
    trainingExamples: examples.length,
    learningRate,
  };
}

export function predictWithModel(
  model: ModelWeights,
  features: FeatureVector,
): number {
  if (features.length !== model.weights.length) return 0.5;
  const z = model.bias + model.weights.reduce((s, w, i) => s + w * (features[i] ?? 0), 0);
  return sigmoid(z);
}

export function featureContribution(
  model: ModelWeights,
  features: FeatureVector,
): { name: string; value: number; contribution: number }[] {
  return model.featureNames
    .map((name, i) => ({
      name,
      value: features[i] ?? 0,
      contribution: model.weights[i] * (features[i] ?? 0),
    }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
}

export const FEATURE_LABELS: Record<string, string> = {
  no_show_rate: 'نسبة الغياب السابقة',
  total_visits: 'عدد الزيارات السابقة',
  is_unconfirmed: 'موعد غير مؤكد',
  is_afternoon: 'موعد بعد الظهر',
  is_late_week: 'نهاية الأسبوع',
  is_new_patient: 'مريض جديد',
  age_under_30: 'عمر أقل من 30',
  long_gap: 'فترة طويلة منذ آخر زيارة',
  high_cost_service: 'علاج مكلف',
  hour: 'ساعة الموعد',
};
