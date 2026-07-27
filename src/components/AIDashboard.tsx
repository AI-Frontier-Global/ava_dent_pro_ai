import { useMemo } from 'react';
import { DollarSign, Zap, TrendingUp, Activity } from 'lucide-react';
import type { Store } from '../store';
import { computeClinicKPIs } from '../lib/clinic-analytics';
import { predictUpcomingNoShows } from '../lib/no-show-predictor';
import { getOverallStats, getProviderStats, type ProviderId } from '../lib/cost-tracker';
import { PROVIDER_LABELS, type AIProviderId } from '../lib/unified-ai-service';

interface Props {
  store: Store;
}

export default function AIDashboard({ store }: Props) {
  const kpis = useMemo(
    () => computeClinicKPIs(store.appointments, store.patients, store.invoices),
    [store.appointments, store.patients, store.invoices],
  );

  const noShow = useMemo(
    () => predictUpcomingNoShows(store.appointments, store.patients),
    [store.appointments, store.patients],
  );

  const overall = useMemo(() => getOverallStats(), []);

  const providerIds: ProviderId[] = ['openai', 'anthropic', 'google', 'ollama'];
  const providerStats = useMemo(
    () => providerIds.map((p) => ({ id: p, stats: getProviderStats(p) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overall.totalCalls],
  );

  const cards = [
    {
      label: 'إجمالي استدعاءات AI',
      value: overall.totalCalls,
      icon: Zap,
      color: 'from-violet-500 to-fuchsia-600',
    },
    {
      label: 'إجمالي التكلفة (دولار)',
      value: overall.totalCostUsd.toFixed(4),
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'متوسط الرموز لكل استدعاء',
      value: Math.round(overall.avgTokensPerCall),
      icon: Activity,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      label: 'مرضى عاليو مخاطر الغياب',
      value: noShow.highRiskCount,
      icon: TrendingUp,
      color: 'from-rose-500 to-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="card p-5">
              <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{c.value}</p>
              <p className="text-xs text-slate-500">{c.label}</p>
            </div>
          );
        })}
      </div>

      {/* Clinic KPIs */}
      <div className="card p-6">
        <h3 className="mb-4 text-lg font-bold text-slate-800">مؤشرات العيادة</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPI label="إجمالي المرضى" value={kpis.totalPatients} />
          <KPI label="معدل الإكمال" value={`${kpis.completedRate}%`} />
          <KPI label="معدل الإلغاء" value={`${kpis.cancellationRate}%`} />
          <KPI label="مواعيد قادمة" value={kpis.upcomingCount} />
          <KPI label="الإيرادات" value={`${kpis.totalRevenue.toFixed(0)} د.أ`} />
          <KPI label="متوسط الإيراد/مريض" value={`${kpis.avgRevenuePerPatient.toFixed(0)} د.أ`} />
          <KPI label="نسبة الإشغال" value={`${kpis.utilizationRate}%`} />
          <KPI label="أكثر يوم ازدحاماً" value={kpis.busiestDay ?? '—'} />
        </div>
      </div>

      {/* Provider breakdown */}
      <div className="card p-6">
        <h3 className="mb-4 text-lg font-bold text-slate-800">تحليل الموفرين</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-right text-xs text-slate-500">
                <th className="pb-2 pr-2 font-semibold">الموفر</th>
                <th className="pb-2 px-2 font-semibold">الاستدعاءات</th>
                <th className="pb-2 px-2 font-semibold">الرموز</th>
                <th className="pb-2 px-2 font-semibold">التكلفة ($)</th>
                <th className="pb-2 pl-2 font-semibold">متوسط/استدعاء</th>
              </tr>
            </thead>
            <tbody>
              {providerStats.map(({ id, stats }) => (
                <tr key={id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-2 font-semibold text-slate-700">
                    {PROVIDER_LABELS[id as AIProviderId]}
                  </td>
                  <td className="py-3 px-2 text-slate-600">{stats.totalCalls}</td>
                  <td className="py-3 px-2 text-slate-600">{stats.totalTokens}</td>
                  <td className="py-3 px-2 text-slate-600">{stats.totalCostUsd.toFixed(4)}</td>
                  <td className="py-3 pl-2 text-slate-600">{stats.avgCostPerCall.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* High risk patients */}
      {noShow.predictions.length > 0 && (
        <div className="card p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-800">مرضى عاليو مخاطر الغياب</h3>
          <div className="space-y-2">
            {noShow.predictions
              .filter((p) => p.riskLevel !== 'low')
              .slice(0, 5)
              .map((p) => (
                <div
                  key={p.appointmentId}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5"
                >
                  <span className="font-medium text-slate-700">{p.patientName}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      p.riskLevel === 'high'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {p.riskScore}%
                  </span>
                </div>
              ))}
            {noShow.predictions.filter((p) => p.riskLevel !== 'low').length === 0 && (
              <p className="text-sm text-slate-500">لا توجد مخاطر مرتفعة حالياً.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xl font-bold text-slate-800">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}
