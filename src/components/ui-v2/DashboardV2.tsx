import { useState } from 'react';
import { Users, CalendarClock, Receipt, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { Store } from '@/store';
import type { Page } from '@/components/Sidebar';
import type { Appointment } from '@/types';
import { STATUS_STYLES } from '@/types';
import VideoBanner from './VideoBanner';
import VideoModal from './VideoModal';
import type { VideoContent } from './VideoModal';

type Props = {
  store: Store;
  onNavigate: (p: Page) => void;
};

type StatCard = {
  label: string;
  value: string;
  icon: typeof Users;
  trend?: { up: boolean; value: string };
  color: string;
  bg: string;
};

export default function DashboardV2({ store, onNavigate }: Props) {
  const [videoModal, setVideoModal] = useState<VideoContent | null>(null);

  const todayAppts = store.appointments.filter((a) => a.status === 'محجوز' || a.status === 'مؤكد').slice(0, 6);
  const totalRevenue = store.invoices.reduce((sum, inv) => {
    const subtotal = inv.items.reduce((s, it) => s + it.price * it.qty, 0);
    return sum + subtotal * (1 + inv.taxRate);
  }, 0);

  const stats: StatCard[] = [
    {
      label: 'إجمالي المرضى',
      value: String(store.patients.length),
      icon: Users,
      trend: { up: true, value: '+12%' },
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
    {
      label: 'مواعيد اليوم',
      value: String(todayAppts.length),
      icon: CalendarClock,
      trend: { up: true, value: '+3' },
      color: 'text-brand-600',
      bg: 'bg-brand-50',
    },
    {
      label: 'فواتير معلقة',
      value: String(store.invoices.filter((i) => !i.cliqLink).length),
      icon: Receipt,
      trend: { up: false, value: '-5%' },
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'الإيرادات',
      value: `${totalRevenue.toFixed(0)} د.أ`,
      icon: TrendingUp,
      trend: { up: true, value: '+18%' },
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  const quickActions: { label: string; icon: typeof Users; page: Page; color: string }[] = [
    { label: 'إضافة مريض', icon: Users, page: 'patient-intake', color: 'from-sky-500 to-brand-500' },
    { label: 'حجز موعد', icon: CalendarClock, page: 'scheduling', color: 'from-emerald-500 to-teal-500' },
    { label: 'إنشاء فاتورة', icon: Receipt, page: 'billing', color: 'from-amber-500 to-orange-500' },
    { label: 'مركز الذكاء', icon: TrendingUp, page: 'ai-hub', color: 'from-rose-500 to-accent-500' },
  ];

  const statusBadge = (status: Appointment['status']) => {
    const style = STATUS_STYLES[status];
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${style.badge}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-elev-1 transition-all hover:shadow-elev-2"
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg}`}>
                  <Icon size={22} className={stat.color} />
                </div>
                {stat.trend && (
                  <span
                    className={`flex items-center gap-0.5 text-[11px] font-bold ${
                      stat.trend.up ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {stat.trend.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {stat.trend.value}
                  </span>
                )}
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-800">{stat.value}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => onNavigate(action.page)}
              className={`flex items-center gap-2 rounded-xl bg-gradient-to-l ${action.color} px-4 py-3 text-sm font-bold text-white shadow-elev-1 transition-all hover:shadow-elev-2 active:scale-[0.98]`}
            >
              <Icon size={18} />
              {action.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Appointments table */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-elev-1">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-base font-bold text-slate-800">مواعيد اليوم</h2>
              <button
                onClick={() => onNavigate('scheduling')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                عرض الكل
              </button>
            </div>
            <div className="overflow-x-auto">
              {todayAppts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <CalendarClock size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">لا توجد مواعيد اليوم</p>
                </div>
              ) : (
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3">المريض</th>
                      <th className="px-5 py-3">الوقت</th>
                      <th className="px-5 py-3">السبب</th>
                      <th className="px-5 py-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAppts.map((appt) => (
                      <tr key={appt.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50">
                        <td className="px-5 py-3 text-sm font-semibold text-slate-700">{appt.patientName}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Clock size={12} />
                            {appt.startHour}:00 - {appt.startHour + appt.duration}:00
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600">{appt.reason}</td>
                        <td className="px-5 py-3">{statusBadge(appt.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Video Banner */}
        <div className="lg:col-span-1">
          <VideoBanner onPlay={(v) => setVideoModal(v)} />
        </div>
      </div>

      {/* Follow-ups summary */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-elev-1">
        <h2 className="mb-4 text-base font-bold text-slate-800">المتابعات المعلقة</h2>
        {store.followUps.filter((f) => f.status === 'pending').length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <CheckCircle2 size={18} className="text-emerald-500" />
            لا توجد متابعات معلقة
          </div>
        ) : (
          <div className="space-y-2">
            {store.followUps
              .filter((f) => f.status === 'pending')
              .slice(0, 5)
              .map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{f.patientName}</p>
                    <p className="text-xs text-slate-500">{f.message}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{f.followUpDate}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      <VideoModal
        open={!!videoModal}
        onClose={() => setVideoModal(null)}
        video={videoModal}
        onTryNow={(toolLink) => {
          setVideoModal(null);
          onNavigate(toolLink as Page);
        }}
      />
    </div>
  );
}
