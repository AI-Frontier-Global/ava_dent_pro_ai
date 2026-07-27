import {
  CalendarClock,
  TrendingUp,
  UserPlus,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronLeft,
  Activity,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  Sparkles,
  Brain,
  Users,
  Stethoscope,
  DollarSign,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Store } from '../store';
import { DAYS, TIME_SLOTS, STATUS_STYLES } from '../types';
import type { Page } from '../components/Sidebar';
import { useToast } from '../components/Toast';
import { computeClinicInsights } from '../lib/noShowEngine';

type Props = {
  store: Store;
  onNavigate: (p: Page) => void;
};

function formatJOD(n: number) {
  return n.toLocaleString('ar-JO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function todayName() {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[new Date().getDay()];
}

/* ============ Smooth sparkline path ============ */
function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/* ============ KPI Card with animated sparkline ============ */
function KpiCard({
  label,
  value,
  sub,
  change,
  up,
  spark,
  gradient,
  sparkColor,
  sparkId,
  icon: Icon,
  onClick,
}: {
  label: string;
  value: string;
  sub: string;
  change: string;
  up: boolean;
  spark: number[];
  gradient: string;
  sparkColor: string;
  sparkId: string;
  icon: typeof CalendarClock;
  onClick: () => void;
}) {
  const max = Math.max(...spark, 1);
  const min = Math.min(...spark, 0);
  const range = max - min || 1;
  const pts = spark.map((v, i) => ({
    x: (i / (spark.length - 1)) * 100,
    y: 100 - ((v - min) / range) * 80 - 10,
  }));
  const linePath = smoothPath(pts);
  const areaPath = `${linePath} L 100,100 L 0,100 Z`;

  return (
    <button
      onClick={onClick}
      className="card card-hover group relative overflow-hidden p-5 text-right"
    >
      <div
        className={`pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-20`}
      />
      <div className="relative flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
        >
          <Icon size={22} />
        </div>
        <span
          className={`badge ${up ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'}`}
        >
          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change}
        </span>
      </div>
      <p className="relative mt-4 text-xs font-medium text-slate-500">{label}</p>
      <p className="relative mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="relative mt-0.5 text-[11px] text-slate-400">{sub}</p>
      <div className="relative mt-3 h-12 w-full">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id={`grad-${sparkId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={sparkColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={sparkColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#grad-${sparkId})`} />
          <path
            d={linePath}
            fill="none"
            stroke={sparkColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </button>
  );
}

/* ============ Interactive Revenue Chart ============ */
function RevenueChart({ data }: { data: { day: string; value: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 100;
  const h = 100;
  const padX = 6;
  const pts = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * (w - padX * 2);
    const y = h - (d.value / max) * 75 - 8;
    return { x, y, value: d.value, day: d.day };
  });
  const linePath = smoothPath(pts);
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="h-56 w-full"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rev-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        {[20, 40, 60, 80].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2={w}
            y2={y}
            stroke="#e2e8f0"
            strokeWidth="0.3"
            strokeDasharray="1 1.5"
          />
        ))}
        <path d={areaPath} fill="url(#rev-grad)" />
        <path
          d={linePath}
          fill="none"
          stroke="url(#rev-line)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hover === i ? 2 : 1.2}
              fill="#0d9488"
              stroke="white"
              strokeWidth="0.5"
              className="transition-all duration-200"
            />
            <rect
              x={p.x - (w - padX * 2) / (data.length - 1) / 2}
              y="0"
              width={(w - padX * 2) / (data.length - 1)}
              height={h}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          </g>
        ))}
        {hover !== null && (
          <line
            x1={pts[hover].x}
            y1="0"
            x2={pts[hover].x}
            y2={h}
            stroke="#0d9488"
            strokeWidth="0.4"
            strokeDasharray="1.5 1.5"
          />
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md border border-brand-100 bg-white px-3 py-2 shadow-elev-3"
          style={{
            left: `${(pts[hover].x / w) * 100}%`,
            top: `${(pts[hover].y / h) * 100}%`,
          }}
        >
          <p className="text-[10px] font-medium text-slate-400">{pts[hover].day}</p>
          <p className="text-sm font-bold text-brand-700">
            {formatJOD(pts[hover].value)} د.أ
          </p>
        </div>
      )}
      <div className="mt-2 flex justify-between px-1">
        {data.map((d, i) => (
          <span
            key={d.day}
            className={`text-[10px] font-medium transition-colors ${
              hover === i ? 'text-brand-600' : 'text-slate-400'
            }`}
          >
            {d.day.slice(0, 3)}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============ Donut Chart for appointment status ============ */
function StatusDonut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          {segments.map((seg, i) => {
            const dash = (seg.value / total) * circumference;
            const el = (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="9"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-slate-900">{total}</span>
          <span className="text-[10px] font-medium text-slate-400">إجمالي</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: seg.color }} />
              <span className="text-xs font-medium text-slate-600">{seg.label}</span>
            </div>
            <span className="text-xs font-bold text-slate-800">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ AI Insights Banner ============ */
function AIInsightsBanner({ store, onNavigate }: { store: Store; onNavigate: (p: Page) => void }) {
  const insights = useMemo(() => computeClinicInsights(store.appointments, store.patients), [store.appointments, store.patients]);
  const topRisk = insights.predictions.find((p) => p.riskLevel === 'high') ?? insights.predictions[0];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-700 p-5 text-white shadow-lg">
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-16 right-10 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="text-sm font-bold">رؤى الذكاء الاصطناعي</p>
            <p className="mt-1 max-w-2xl text-sm text-violet-100">{insights.summary}</p>
            {topRisk && topRisk.riskLevel !== 'low' && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                <AlertTriangle size={13} />
                أعلى مخاطر غياب: {topRisk.patientName} ({topRisk.riskScore}%)
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => onNavigate('ai-hub')}
          className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/25"
        >
          <Brain size={16} />
          مركز الذكاء الاصطناعي
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage({ store, onNavigate }: Props) {
  const toast = useToast();
  const todayIdx = new Date().getDay();
  const todayAppts = store.appointments
    .filter((a) => a.day === todayIdx)
    .sort((a, b) => a.startHour - b.startHour);

  const todayTotal = store.invoices
    .filter((inv) => {
      const d = new Date(inv.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    })
    .reduce((sum, inv) => {
      const sub = inv.items.reduce((s, it) => s + it.price * it.qty, 0);
      return sum + sub * (1 + inv.taxRate);
    }, 0);

  const totalRevenue = store.invoices.reduce((sum, inv) => {
    const sub = inv.items.reduce((s, it) => s + it.price * it.qty, 0);
    return sum + sub * (1 + inv.taxRate);
  }, 0);

  const newThisWeek = store.patients.filter((p) => {
    const created = new Date(p.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created >= weekAgo;
  }).length;

  const unconfirmed = store.appointments.filter((a) => a.status === 'محجوز');

  const weeklyData = DAYS.map((d, i) => {
    const dayAppts = store.appointments.filter((a) => a.day === i);
    const dayInvoices = store.invoices.filter((inv) => {
      const created = new Date(inv.createdAt);
      const now = new Date();
      const dayDiff = (now.getTime() - created.getTime()) / 86400000;
      const dayOfWeek = (created.getDay() + 6) % 7;
      return dayDiff <= 7 && dayOfWeek === i;
    });
    const revenue = dayInvoices.reduce((sum, inv) => {
      const sub = inv.items.reduce((s, it) => s + it.price * it.qty, 0);
      return sum + sub * (1 + inv.taxRate);
    }, 0);
    return { day: d, value: revenue };
  });

  const statusSegments = [
    { label: 'مؤكد', value: store.appointments.filter((a) => a.status === 'مؤكد').length, color: '#10b981' },
    { label: 'محجوز', value: store.appointments.filter((a) => a.status === 'محجوز').length, color: '#3b82f6' },
    { label: 'تم', value: store.appointments.filter((a) => a.status === 'تم').length, color: '#64748b' },
    { label: 'ملغى', value: store.appointments.filter((a) => a.status === 'ملغى').length, color: '#f43f5e' },
  ];

  const kpis = [
    {
      label: 'مواعيد اليوم',
      value: todayAppts.length.toString(),
      sub: todayName(),
      change: '+12%',
      up: true,
      spark: [3, 4, 2, 5, 4, 6, 3],
      gradient: 'from-brand-400 to-accent-600',
      sparkColor: '#14b8a6',
      sparkId: 'appts',
      icon: CalendarClock,
      action: () => onNavigate('scheduling'),
    },
    {
      label: 'تحصيل اليوم',
      value: formatJOD(todayTotal),
      sub: 'د.أ · شامل الضريبة',
      change: '+8.2%',
      up: true,
      spark: [20, 35, 28, 42, 38, 55, 48],
      gradient: 'from-success-400 to-success-600',
      sparkColor: '#10b981',
      sparkId: 'collect',
      icon: TrendingUp,
      action: () => onNavigate('billing'),
    },
    {
      label: 'المرضى الجدد',
      value: store.patients.length.toString(),
      sub: `${newThisWeek} هذا الأسبوع`,
      change: '+3',
      up: true,
      spark: [1, 2, 1, 3, 2, 4, 5],
      gradient: 'from-warning-400 to-warning-500',
      sparkColor: '#f59e0b',
      sparkId: 'patients',
      icon: UserPlus,
      action: () => onNavigate('patient-intake'),
    },
    {
      label: 'إجمالي الإيرادات',
      value: formatJOD(totalRevenue),
      sub: 'د.أ · كل الفواتير',
      change: '-2.1%',
      up: false,
      spark: [80, 95, 72, 110, 88, 102, 96],
      gradient: 'from-sky-400 to-blue-600',
      sparkColor: '#0ea5e9',
      sparkId: 'revenue',
      icon: Wallet,
      action: () => onNavigate('payments'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-l from-brand-600 to-accent-700 p-6 text-white shadow-elev-2">
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 right-10 h-40 w-40 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-100">مرحباً، رنا</p>
            <h2 className="mt-1 text-xl font-bold">
              لديك {todayAppts.length} مواعيد اليوم — {todayName()}
            </h2>
            <p className="mt-1 text-sm text-brand-100/80">
              أسبوع العمل: {DAYS[0]} إلى {DAYS[DAYS.length - 1]} · من {TIME_SLOTS[0]}:00 إلى{' '}
              {TIME_SLOTS[TIME_SLOTS.length - 1] + 1}:00
            </p>
          </div>
          <button
            onClick={() => onNavigate('scheduling')}
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/25"
          >
            <Sparkles size={16} />
            عرض جدول اليوم
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} onClick={k.action} />
        ))}
      </div>

      {/* AI insights banner */}
      <AIInsightsBanner store={store} onNavigate={onNavigate} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* مواعيد اليوم */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">مواعيد اليوم</h3>
              <span className="chip bg-brand-50 text-brand-700">{todayAppts.length}</span>
            </div>
            <button
              onClick={() => onNavigate('scheduling')}
              className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              عرض الكل
              <ChevronLeft size={16} />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {todayAppts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <CalendarClock size={24} />
                </div>
                <p className="text-sm font-medium text-slate-500">لا توجد مواعيد مجدولة لهذا اليوم</p>
              </div>
            )}
            {todayAppts.map((a) => {
              const st = STATUS_STYLES[a.status];
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-slate-50/60"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-slate-900">{a.startHour}:00</span>
                    <span className="text-[10px] text-slate-400">{a.startHour < 12 ? 'ص' : 'م'}</span>
                  </div>
                  <div className="h-10 w-px bg-slate-200" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">{a.patientName}</p>
                    <p className="truncate text-xs text-slate-500">{a.reason}</p>
                  </div>
                  <span className={`badge ${st.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {a.status}
                  </span>
                  <button className="btn-icon" aria-label="المزيد">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* العمود اليميني */}
        <div className="space-y-6">
          {/* الرسم البياني */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-brand-600" />
                <h3 className="text-base font-bold text-slate-900">التحصيل الأسبوعي</h3>
              </div>
              <span className="chip bg-success-50 text-success-700">
                <ArrowUpRight size={11} /> +14%
              </span>
            </div>
            <RevenueChart data={weeklyData} />
          </div>

          {/* توزيع حالة المواعيد */}
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users size={18} className="text-teal-600" />
              <h3 className="text-base font-bold text-slate-900">حالة المواعيد</h3>
            </div>
            <StatusDonut segments={statusSegments} />
          </div>
        </div>
      </div>

      {/* التنبيهات وأحدث المرضى */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* التنبيهات */}
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-warning-500" />
              <h3 className="text-base font-bold text-slate-900">تنبيهات</h3>
            </div>
            {unconfirmed.length > 0 && (
              <span className="chip bg-warning-100 text-warning-700">{unconfirmed.length} جديد</span>
            )}
          </div>
          <div className="space-y-2.5">
            {unconfirmed.length === 0 && (
              <div className="flex items-center gap-2 rounded-md bg-success-50 p-3 text-sm text-success-700">
                <CheckCircle2 size={18} />
                جميع المواعيد مؤكدة
              </div>
            )}
            {unconfirmed.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-md border border-warning-200/60 bg-warning-50/60 p-3"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{a.patientName}</p>
                  <p className="text-xs text-slate-500">
                    {DAYS[a.day]} · {a.startHour}:00 — غير مؤكد
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await store.updateAppointmentStatus(a.id, 'مؤكد');
                      toast('تم تأكيد الموعد', 'success');
                    } catch {
                      toast('حدث خطأ أثناء التأكيد', 'error');
                    }
                  }}
                  className="shrink-0 rounded-sm bg-warning-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-warning-600"
                >
                  تأكيد
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* أحدث المرضى */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <UserPlus size={18} className="text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">آخر المرضى المسجلين</h3>
            </div>
            <button
              onClick={() => onNavigate('patient-intake')}
              className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              عرض الكل
              <ChevronLeft size={16} />
            </button>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {store.patients.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-md border border-slate-200/70 p-3.5 transition-all duration-sm hover:border-brand-200 hover:bg-brand-50/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-600 text-sm font-bold text-white">
                  {p.fullName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">{p.fullName}</p>
                  <p className="text-xs text-slate-500" dir="ltr">
                    {p.phone}
                  </p>
                </div>
                <ChevronLeft size={16} className="text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
