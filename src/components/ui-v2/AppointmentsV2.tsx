import { useState } from 'react';
import { Plus, X, TrendingUp, Clock } from 'lucide-react';
import type { Store } from '@/store';
import type { Appointment, AppointmentStatus } from '@/types';
import { DAYS, TIME_SLOTS, STATUS_STYLES } from '@/types';
import ContextualChips from './ContextualChips';

type Props = {
  store: Store;
};

export default function AppointmentsV2({ store }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedHour, setSelectedHour] = useState(9);
  const [form, setForm] = useState({ patientId: '', reason: '', duration: 1 });

  const getAppt = (day: number, hour: number): Appointment | undefined =>
    store.appointments.find((a) => a.day === day && a.startHour <= hour && a.startHour + a.duration > hour);

  const handleAdd = async () => {
    const patient = store.patients.find((p) => p.id === form.patientId);
    if (!patient || !form.reason.trim()) return;
    try {
      await store.addAppointment({
        patientId: patient.id,
        patientName: patient.fullName,
        day: selectedDay,
        startHour: selectedHour,
        duration: form.duration,
        reason: form.reason,
        status: 'محجوز',
        appointmentDate: new Date().toISOString().slice(0, 10),
        recurrence: 'none',
      });
      setShowAdd(false);
      setForm({ patientId: '', reason: '', duration: 1 });
    } catch {
      // handled by store
    }
  };

  const cycleStatus = async (appt: Appointment) => {
    const order: AppointmentStatus[] = ['محجوز', 'مؤكد', 'تم', 'ملغى'];
    const next = order[(order.indexOf(appt.status) + 1) % order.length];
    await store.updateAppointmentStatus(appt.id, next);
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">جدول المواعيد</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand-500 to-accent-600 px-4 py-2.5 text-sm font-bold text-white shadow-elev-1 transition-all hover:shadow-elev-2 active:scale-[0.98]"
        >
          <Plus size={18} />
          حجز موعد
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-elev-1">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="sticky right-0 bg-white px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                الوقت
              </th>
              {DAYS.map((day) => (
                <th key={day} className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((hour) => (
              <tr key={hour} className="border-b border-slate-50">
                <td className="sticky right-0 border-l border-slate-100 bg-white px-4 py-2 text-xs font-semibold text-slate-500">
                  {hour}:00
                </td>
                {DAYS.map((_, dayIdx) => {
                  const appt = getAppt(dayIdx, hour);
                  if (appt && appt.startHour === hour) {
                    const style = STATUS_STYLES[appt.status];
                    return (
                      <td
                        key={dayIdx}
                        className="p-1"
                        rowSpan={appt.duration}
                      >
                        <div
                          className={`group cursor-pointer rounded-lg border p-2 transition-all hover:shadow-elev-1 ${style.badge}`}
                          onClick={() => cycleStatus(appt)}
                        >
                          <p className="truncate text-xs font-bold">{appt.patientName}</p>
                          <p className="truncate text-[10px] opacity-70">{appt.reason}</p>
                          <div className="mt-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <ContextualChips onPredict={() => {}} compact />
                          </div>
                        </div>
                      </td>
                    );
                  }
                  if (appt) return <td key={dayIdx} className="p-1" />;
                  return (
                    <td
                      key={dayIdx}
                      className="cursor-pointer p-1 transition-colors hover:bg-slate-50"
                      onClick={() => {
                        setSelectedDay(dayIdx);
                        setSelectedHour(hour);
                        setShowAdd(true);
                      }}
                    >
                      <div className="flex h-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-brand-50 hover:text-brand-400">
                        <Plus size={14} />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {(['محجوز', 'مؤكد', 'تم', 'ملغى'] as AppointmentStatus[]).map((status) => {
          const style = STATUS_STYLES[status];
          return (
            <div key={status} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
              <span className="text-xs font-medium text-slate-600">{status}</span>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAdd(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-elev-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">حجز موعد جديد</h3>
              <button onClick={() => setShowAdd(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-xs font-medium text-brand-700">
                <Clock size={14} />
                {DAYS[selectedDay]} — {selectedHour}:00
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">المريض</label>
                <select
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white"
                >
                  <option value="">اختر مريضاً</option>
                  {store.patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">السبب</label>
                <input
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="مثال: كشف وتشخيص"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">المدة (ساعات)</label>
                <select
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white"
                >
                  <option value={1}>ساعة واحدة</option>
                  <option value={2}>ساعتان</option>
                  <option value={3}>3 ساعات</option>
                </select>
              </div>
              <button
                onClick={handleAdd}
                className="w-full rounded-xl bg-gradient-to-l from-brand-500 to-accent-600 py-3 text-sm font-bold text-white shadow-elev-1 transition-all hover:shadow-elev-2 active:scale-[0.98]"
              >
                تأكيد الحجز
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
