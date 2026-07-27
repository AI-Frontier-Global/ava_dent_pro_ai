import { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import {
  TrendingUp,
  Users,
  Calendar,
  Receipt,
  Download,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Stethoscope,
  Star,
} from 'lucide-react';
import type { Store } from '../store';
import { DENTAL_SERVICES, DAYS } from '../types';
import type { Invoice } from '../types';
import { useToast } from '../components/Toast';

type Props = { store: Store };

type Range = 'week' | 'month' | 'quarter' | 'year';

export default function ReportsPage({ store }: Props) {
  const toast = useToast();
  const [range, setRange] = useState<Range>('month');

  const now = new Date();
  const rangeDays = range === 'week' ? 7 : range === 'month' ? 30 : range === 'quarter' ? 90 : 365;
  const rangeStart = new Date(now.getTime() - rangeDays * 86400000);

  const inRange = (iso: string) => new Date(iso) >= rangeStart;

  // Filtered data
  const rangeInvoices = useMemo(
    () => store.invoices.filter((inv) => inRange(inv.createdAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.invoices, rangeStart],
  );
  const rangeAppointments = useMemo(
    () => store.appointments.filter((a) => (a.appointmentDate ? inRange(a.appointmentDate) : true)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.appointments, rangeStart],
  );

  // KPIs
  const totalRevenue = useMemo(
    () =>
      rangeInvoices.reduce((sum, inv) => {
        const sub = inv.items.reduce((s, it) => s + it.price * it.qty, 0);
        return sum + sub * (1 + inv.taxRate);
      }, 0),
    [rangeInvoices],
  );
  const totalPatients = store.patients.length;
  const newPatients = useMemo(
    () => store.patients.filter((p) => p.createdAt && inRange(p.createdAt)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.patients, rangeStart],
  );
  const completedAppts = rangeAppointments.filter((a) => a.status === 'تم').length;
  const cancelledAppts = rangeAppointments.filter((a) => a.status === 'ملغى').length;
  const avgInvoice = rangeInvoices.length > 0 ? totalRevenue / rangeInvoices.length : 0;

  // Revenue trend (daily buckets)
  const trendData = useMemo(() => {
    const buckets: { label: string; value: number }[] = [];
    const bucketCount = range === 'week' ? 7 : range === 'month' ? 30 : range === 'quarter' ? 12 : 12;
    const isDaily = range === 'week' || range === 'month';
    if (isDaily) {
      for (let i = bucketCount - 1; i >= 0; i--) {
        const dayStart = new Date(now.getTime() - i * 86400000);
        const dayEnd = new Date(dayStart.getTime() + 86400000);
        const label = dayStart.toLocaleDateString('ar-JO', { day: 'numeric', month: isDaily && range === 'week' ? 'short' : undefined });
        const value = store.invoices
          .filter((inv) => {
            const d = new Date(inv.createdAt);
            return d >= dayStart && d < dayEnd;
          })
          .reduce((sum, inv) => {
            const sub = inv.items.reduce((s, it) => s + it.price * it.qty, 0);
            return sum + sub * (1 + inv.taxRate);
          }, 0);
        buckets.push({ label, value });
      }
    } else {
      // weekly buckets for quarter/year
      const weeks = bucketCount;
      for (let i = weeks - 1; i >= 0; i--) {
        const wStart = new Date(now.getTime() - i * 7 * 86400000);
        const wEnd = new Date(wStart.getTime() + 7 * 86400000);
        const value = store.invoices
          .filter((inv) => {
            const d = new Date(inv.createdAt);
            return d >= wStart && d < wEnd;
          })
          .reduce((sum, inv) => {
            const sub = inv.items.reduce((s, it) => s + it.price * it.qty, 0);
            return sum + sub * (1 + inv.taxRate);
          }, 0);
        buckets.push({ label: `أسبوع ${weeks - i}`, value });
      }
    }
    return buckets;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.invoices, range]);

  const maxTrend = Math.max(...trendData.map((t) => t.value), 1);

  // Top services by revenue
  const serviceStats = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    rangeInvoices.forEach((inv) => {
      inv.items.forEach((it) => {
        const cur = map.get(it.serviceName) ?? { count: 0, revenue: 0 };
        cur.count += it.qty;
        cur.revenue += it.price * it.qty * (1 + inv.taxRate);
        map.set(it.serviceName, cur);
      });
    });
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [rangeInvoices]);

  const maxServiceRev = Math.max(...serviceStats.map((s) => s.revenue), 1);

  // Appointments by day
  const apptByDay = useMemo(() => {
    return DAYS.map((d, i) => ({
      day: d,
      count: rangeAppointments.filter((a) => a.day === i).length,
    }));
  }, [rangeAppointments]);
  const maxApptDay = Math.max(...apptByDay.map((d) => d.count), 1);

  // Appointment status distribution
  const statusDist = useMemo(() => {
    const statuses = ['محجوز', 'مؤكد', 'تم', 'ملغى'] as const;
    return statuses.map((s) => ({
      status: s,
      count: rangeAppointments.filter((a) => a.status === s).length,
    }));
  }, [rangeAppointments]);
  const totalAppts = statusDist.reduce((s, x) => s + x.count, 0) || 1;

  const rangeLabels: Record<Range, string> = {
    week: 'آخر أسبوع',
    month: 'آخر شهر',
    quarter: 'آخر ربع سنة',
    year: 'آخر سنة',
  };

  // ====== Export functions ======
  const exportCSV = () => {
    const rows: string[] = [];
    rows.push('Report Type,Dental Clinic Analytics');
    rows.push(`Period,${rangeLabels[range]}`);
    rows.push(`Generated,${now.toLocaleString('en-GB')}`);
    rows.push('');
    rows.push('=== KPIs ===');
    rows.push(`Total Revenue (JOD),${totalRevenue.toFixed(2)}`);
    rows.push(`Total Invoices,${rangeInvoices.length}`);
    rows.push(`Average Invoice (JOD),${avgInvoice.toFixed(2)}`);
    rows.push(`Total Patients,${totalPatients}`);
    rows.push(`New Patients,${newPatients}`);
    rows.push(`Completed Appointments,${completedAppts}`);
    rows.push(`Cancelled Appointments,${cancelledAppts}`);
    rows.push('');
    rows.push('=== Top Services ===');
    rows.push('Service,Count,Revenue (JOD)');
    serviceStats.forEach((s) => rows.push(`${s.name},${s.count},${s.revenue.toFixed(2)}`));
    rows.push('');
    rows.push('=== Appointments by Day ===');
    rows.push('Day,Count');
    apptByDay.forEach((d) => rows.push(`${d.day},${d.count}`));
    rows.push('');
    rows.push('=== Appointment Status ===');
    rows.push('Status,Count,Percentage');
    statusDist.forEach((s) => rows.push(`${s.status},${s.count},${((s.count / totalAppts) * 100).toFixed(1)}%`));
    rows.push('');
    rows.push('=== Invoices Detail ===');
    rows.push('Invoice ID,Patient,Date,Subtotal,Tax,Total');
    rangeInvoices.forEach((inv) => {
      const sub = inv.items.reduce((s, it) => s + it.price * it.qty, 0);
      const tax = sub * inv.taxRate;
      rows.push(`${inv.id},${inv.patientName},${new Date(inv.createdAt).toLocaleDateString('en-GB')},${sub.toFixed(2)},${tax.toFixed(2)},${(sub + tax).toFixed(2)}`);
    });

    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dental-report-${range}-${now.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('تم تصدير التقرير CSV', 'success');
  };

  const exportPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Smile Clinic', pageW - 15, 13, { align: 'right' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Analytics & Reports', pageW - 15, 20, { align: 'right' });

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORT', 15, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${rangeLabels[range]} — ${now.toLocaleDateString('en-GB')}`, 15, 24);

    // KPIs
    let y = 42;
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Key Performance Indicators', 15, y);
    y += 6;

    const kpis = [
      ['Total Revenue', `${totalRevenue.toFixed(2)} JOD`],
      ['Total Invoices', String(rangeInvoices.length)],
      ['Average Invoice', `${avgInvoice.toFixed(2)} JOD`],
      ['Total Patients', String(totalPatients)],
      ['New Patients', String(newPatients)],
      ['Completed Appointments', String(completedAppts)],
      ['Cancelled Appointments', String(cancelledAppts)],
    ];

    doc.setFontSize(10);
    kpis.forEach(([label, value]) => {
      doc.setFont('helvetica', 'normal');
      doc.text(label, 18, y);
      doc.setFont('helvetica', 'bold');
      doc.text(value, 100, y);
      y += 6;
    });

    // Top services
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Top Services by Revenue', 15, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFillColor(240, 250, 248);
    doc.rect(15, y - 5, pageW - 30, 8, 'F');
    doc.setTextColor(13, 148, 136);
    doc.text('Service', 18, y);
    doc.text('Count', 120, y);
    doc.text('Revenue (JOD)', pageW - 18, y, { align: 'right' });
    y += 8;
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    serviceStats.forEach((s) => {
      doc.text(s.name, 18, y);
      doc.text(String(s.count), 120, y);
      doc.text(s.revenue.toFixed(2), pageW - 18, y, { align: 'right' });
      y += 6;
    });

    // Appointments by day
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Appointments by Day', 15, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    apptByDay.forEach((d) => {
      doc.text(`${d.day}: ${d.count}`, 18, y);
      y += 5;
    });

    // Status
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Appointment Status Distribution', 15, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    statusDist.forEach((s) => {
      const pct = ((s.count / totalAppts) * 100).toFixed(1);
      doc.text(`${s.status}: ${s.count} (${pct}%)`, 18, y);
      y += 5;
    });

    // Footer
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageH - 15, pageW, 15, 'F');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text('Generated by Smile Clinic Management System', pageW / 2, pageH - 8, { align: 'center' });

    doc.save(`dental-report-${range}-${now.toISOString().slice(0, 10)}.pdf`);
    toast('تم تصدير التقرير PDF', 'success');
  };

  const kpis = [
    { label: 'إجمالي الإيرادات', value: `${totalRevenue.toFixed(0)} د.أ`, icon: Wallet, color: 'from-brand-500 to-accent-600', bg: 'bg-brand-50', text: 'text-brand-700' },
    { label: 'عدد الفواتير', value: String(rangeInvoices.length), icon: Receipt, color: 'from-sky-500 to-blue-600', bg: 'bg-sky-50', text: 'text-sky-700' },
    { label: 'متوسط الفاتورة', value: `${avgInvoice.toFixed(0)} د.أ`, icon: TrendingUp, color: 'from-success-500 to-green-600', bg: 'bg-success-50', text: 'text-success-700' },
    { label: 'مرضى جدد', value: String(newPatients), icon: Users, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <BarChart3 size={18} className="text-brand-600" />
          <span>تقارير وتحليلات أداء العيادة</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Range selector */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-elev-1">
            {(['week', 'month', 'quarter', 'year'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  range === r ? 'bg-brand-600 text-white shadow-elev-1' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {rangeLabels[r]}
              </button>
            ))}
          </div>
          {/* Export buttons */}
          <button onClick={exportPDF} className="btn-accent !py-2 text-xs">
            <FileText size={15} />
            PDF
          </button>
          <button onClick={exportCSV} className="btn-secondary !py-2 text-xs">
            <Download size={15} />
            CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="card group p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${k.bg} ${k.text}`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">{k.label}</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue trend chart */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-brand-600" />
            <h3 className="text-base font-bold text-slate-800">اتجاه الإيرادات</h3>
          </div>
          <span className="text-xs text-slate-400">{rangeLabels[range]}</span>
        </div>
        <div className="flex h-48 items-end gap-1.5">
          {trendData.map((d, i) => (
            <div key={i} className="group relative flex flex-1 flex-col items-center justify-end">
              <div className="absolute -top-8 z-10 hidden whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-[10px] font-semibold text-white group-hover:block">
                {d.value.toFixed(0)} د.أ
              </div>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-brand-400 to-accent-500 transition-all duration-300 hover:from-brand-500 hover:to-accent-600"
                style={{ height: `${(d.value / maxTrend) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }}
              />
              {(range === 'week' || (range === 'month' && i % 5 === 0) || i === trendData.length - 1) && (
                <span className="mt-1.5 text-[9px] text-slate-400">{d.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top services */}
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Stethoscope size={18} className="text-sky-600" />
            <h3 className="text-base font-bold text-slate-800">أكثر الخدمات إيراداً</h3>
          </div>
          <div className="space-y-3">
            {serviceStats.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">لا توجد بيانات في هذه الفترة</p>
            ) : (
              serviceStats.map((s, i) => (
                <div key={s.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-warning-100 text-warning-700' : 'bg-slate-100 text-slate-500'}`}>
                        {i + 1}
                      </span>
                      {s.name}
                    </span>
                    <span className="font-semibold text-slate-600">{s.revenue.toFixed(0)} د.أ</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-sky-400 to-brand-500 transition-all duration-500"
                      style={{ width: `${(s.revenue / maxServiceRev) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Appointment status distribution */}
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-violet-600" />
            <h3 className="text-base font-bold text-slate-800">توزيع حالات المواعيد</h3>
          </div>
          {totalAppts === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">لا توجد مواعيد في هذه الفترة</p>
          ) : (
            <>
              {/* Donut chart */}
              <div className="flex items-center justify-center py-4">
                <div className="relative h-40 w-40">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    {(() => {
                      let offset = 0;
                      const colors: Record<string, string> = {
                        'محجوز': '#f59e0b',
                        'مؤكد': '#0ea5e9',
                        'تم': '#10b981',
                        'ملغى': '#f43f5e',
                      };
                      return statusDist.map((s) => {
                        const pct = (s.count / totalAppts) * 100;
                        const dash = (pct * 251.2) / 100;
                        const el = (
                          <circle
                            key={s.status}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={colors[s.status]}
                            strokeWidth="14"
                            strokeDasharray={`${dash} 251.2`}
                            strokeDashoffset={-offset}
                          />
                        );
                        offset += dash;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-slate-800">{totalAppts}</span>
                    <span className="text-[10px] text-slate-400">إجمالي المواعيد</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {statusDist.map((s) => {
                  const colors: Record<string, string> = {
                    'محجوز': 'bg-warning-500',
                    'مؤكد': 'bg-sky-500',
                    'تم': 'bg-success-500',
                    'ملغى': 'bg-error-500',
                  };
                  return (
                    <div key={s.status} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${colors[s.status]}`} />
                      <span className="text-xs font-medium text-slate-600">{s.status}</span>
                      <span className="mr-auto text-xs font-bold text-slate-800">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Appointments by day */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-success-600" />
          <h3 className="text-base font-bold text-slate-800">المواعيد حسب اليوم</h3>
        </div>
        <div className="flex h-40 items-end gap-3">
          {apptByDay.map((d) => (
            <div key={d.day} className="group flex flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-xs font-bold text-slate-700">{d.count}</span>
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-success-400 to-brand-500 transition-all duration-300 hover:from-success-500 hover:to-brand-600"
                style={{ height: `${(d.count / maxApptDay) * 100}%`, minHeight: d.count > 0 ? 8 : 2 }}
              />
              <span className="mt-2 text-[10px] text-slate-500">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Star size={18} className="text-warning-500" />
          <h3 className="text-base font-bold text-slate-800">رؤى وتحليلات</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">معدل إكمال المواعيد</p>
            <p className="mt-1 text-xl font-bold text-success-600">
              {totalAppts > 0 ? ((completedAppts / totalAppts) * 100).toFixed(0) : 0}%
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">معدل الإلغاء</p>
            <p className="mt-1 text-xl font-bold text-error-600">
              {totalAppts > 0 ? ((cancelledAppts / totalAppts) * 100).toFixed(0) : 0}%
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">إيراد لكل مريض</p>
            <p className="mt-1 text-xl font-bold text-brand-600">
              {totalPatients > 0 ? (totalRevenue / totalPatients).toFixed(0) : 0} د.أ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
