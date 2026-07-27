import { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  AlertTriangle,
  Repeat,
} from 'lucide-react';
import type { Store } from '../store';
import { DAYS, DENTAL_SERVICES, STATUS_STYLES } from '../types';
import type { Appointment, AppointmentStatus, RecurrenceType } from '../types';
import { RECURRENCE_LABELS } from '../types';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

type Props = { store: Store };

type Slot = { day: number; hour: number } | null;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function weekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 6 ? 0 : day + 1; // Saturday = 6 -> start
  d.setDate(d.getDate() - diff);
  return d;
}

export default function AppointmentsPage({ store }: Props) {
  const toast = useToast();
  const [weekStartDate, setWeekStartDate] = useState(weekStart(new Date()));
  const [view, setView] = useState<'week' | 'day'>('week');
  const [activeDay, setActiveDay] = useState(new Date().getDay());
  const [bookingSlot, setBookingSlot] = useState<Slot>(null);
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);

  const [selPatientId, setSelPatientId] = useState('');
  const [selReason, setSelReason] = useState(DENTAL_SERVICES[0].name);
  const [selDuration, setSelDuration] = useState(1);
  const [selDate, setSelDate] = useState(isoDate(new Date()));
  const [selRecurrence, setSelRecurrence] = useState<RecurrenceType>('none');

  // Map weekday (0=Sun..6=Sat) to our day index (0=Sun..4=Thu)
  const dayToIdx = (weekday: number) => (weekday <= 4 ? weekday : -1);

  // Appointments for the current week (by date)
  const weekDates = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => addDays(weekStartDate, i));
  }, [weekStartDate]);

  const weekDateStrings = weekDates.map(isoDate);

  // Filter appointments that fall in this week OR match by day-of-week if no date
  const weekAppointments = useMemo(() => {
    return store.appointments.filter((a) => {
      if (a.appointmentDate) {
        return weekDateStrings.includes(a.appointmentDate);
      }
      // fallback to day-of-week matching
      return true;
    });
  }, [store.appointments, weekDateStrings]);

  const isOccupied = (day: number, hour: number) =>
    weekAppointments.find(
      (a) => a.day === day && hour >= a.startHour && hour < a.startHour + a.duration,
    );

  // Conflict detection
  const conflicts = useMemo(() => {
    const bySlot = new Map<string, number>();
    weekAppointments.forEach((a) => {
      for (let h = a.startHour; h < a.startHour + a.duration; h++) {
        const key = `${a.day}-${h}`;
        bySlot.set(key, (bySlot.get(key) ?? 0) + 1);
      }
    });
    return new Set(
      [...bySlot.entries()].filter(([, count]) => count > 1).map(([k]) => k),
    );
  }, [weekAppointments]);

  const openBooking = (day: number, hour: number) => {
    setSelPatientId(store.patients[0]?.id ?? '');
    setSelReason(DENTAL_SERVICES[0].name);
    setSelDuration(1);
    setSelRecurrence('none');
    const dateForDay = weekDates[day] ?? new Date();
    setSelDate(isoDate(dateForDay));
    setBookingSlot({ day, hour });
  };

  const hasConflict = (day: number, startHour: number, duration: number, excludeId?: string) => {
    return weekAppointments.some(
      (a) =>
        a.id !== excludeId &&
        a.day === day &&
        startHour < a.startHour + a.duration &&
        startHour + duration > a.startHour,
    );
  };

  const confirmBooking = async () => {
    if (!bookingSlot) return;
    const patient = store.patients.find((p) => p.id === selPatientId);
    if (!patient) {
      toast('الرجاء اختيار مريض', 'error');
      return;
    }
    if (hasConflict(bookingSlot.day, bookingSlot.hour, selDuration)) {
      toast('يوجد تعارض مع موعد آخر في نفس الوقت', 'error');
      return;
    }
    try {
      await store.addAppointment({
        patientId: patient.id,
        patientName: patient.fullName,
        day: bookingSlot.day,
        startHour: bookingSlot.hour,
        duration: selDuration,
        reason: selReason,
        status: 'محجوز',
        appointmentDate: selDate,
        recurrence: selRecurrence,
      });
      toast('تم حجز الموعد بنجاح', 'success');
      setBookingSlot(null);
    } catch {
      toast('حدث خطأ أثناء الحجز', 'error');
    }
  };

  const statusCounts = (['محجوز', 'مؤكد', 'تم', 'ملغى'] as AppointmentStatus[]).map((s) => ({
    status: s,
    count: weekAppointments.filter((a) => a.status === s).length,
  }));

  const timeSlots = useMemo(() => {
    const start = store.clinicSettings?.workStart ?? 9;
    const end = store.clinicSettings?.workEnd ?? 17;
    return Array.from({ length: end - start }, (_, i) => start + i);
  }, [store.clinicSettings?.workStart, store.clinicSettings?.workEnd]);

  const daysToShow = view === 'week' ? DAYS : [DAYS[activeDay]];
  const dayIdxs = view === 'week' ? [0, 1, 2, 3, 4] : [activeDay];

  const weekLabel = `${weekDates[0].toLocaleDateString('ar-JO', { day: 'numeric', month: 'short' })} - ${weekDates[4].toLocaleDateString('ar-JO', { day: 'numeric', month: 'short' })}`;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CalendarPlus size={18} className="text-brand-600" />
          <span>اضغط على أي خانة فارغة لحجز موعد</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Week navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekStartDate(addDays(weekStartDate, -7))}
              className="btn-icon border border-slate-200 bg-white"
              aria-label="الأسبوع السابق"
            >
              <ChevronRight size={16} />
            </button>
            <span className="min-w-[120px] text-center text-sm font-bold text-slate-700">
              {weekLabel}
            </span>
            <button
              onClick={() => setWeekStartDate(addDays(weekStartDate, 7))}
              className="btn-icon border border-slate-200 bg-white"
              aria-label="الأسبوع التالي"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setWeekStartDate(weekStart(new Date()))}
              className="rounded-sm border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              اليوم
            </button>
          </div>

          {/* View toggle */}
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-1 shadow-elev-1">
            <button
              onClick={() => setView('day')}
              className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition-all ${
                view === 'day' ? 'bg-brand-600 text-white shadow-elev-1' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              يوم
            </button>
            <button
              onClick={() => setView('week')}
              className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition-all ${
                view === 'week' ? 'bg-brand-600 text-white shadow-elev-1' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              أسبوع
            </button>
          </div>

          {/* Day nav */}
          {view === 'day' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveDay((d) => (d + 4) % 5)}
                className="btn-icon border border-slate-200 bg-white"
                aria-label="اليوم السابق"
              >
                <ChevronRight size={16} />
              </button>
              <span className="min-w-[80px] text-center text-sm font-bold text-slate-700">
                {DAYS[activeDay]}
              </span>
              <button
                onClick={() => setActiveDay((d) => (d + 1) % 5)}
                className="btn-icon border border-slate-200 bg-white"
                aria-label="اليوم التالي"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          )}

          {/* Status pills */}
          <div className="flex flex-wrap gap-1.5">
            {statusCounts.map(({ status, count }) => {
              const st = STATUS_STYLES[status];
              return (
                <span
                  key={status}
                  className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-elev-1 ring-1 ring-slate-200"
                >
                  <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                  {status}
                  <span className="text-slate-400">({count})</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conflict warning */}
      {conflicts.size > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          <AlertTriangle size={18} className="shrink-0" />
          <span>يوجد {conflicts.size} تعارض في الجدول هذا الأسبوع — يرجى مراجعة المواعيد المتضاربة</span>
        </div>
      )}

      {/* Calendar */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky right-0 z-10 w-20 border-b border-l border-slate-200 bg-slate-50/80 px-3 py-3.5 text-xs font-semibold text-slate-500 backdrop-blur">
                  الوقت
                </th>
                {daysToShow.map((d, i) => (
                  <th
                    key={d}
                    className="min-w-[140px] border-b border-l border-slate-200 bg-slate-50/80 px-3 py-3.5 text-sm font-bold text-slate-700 backdrop-blur last:border-l-0"
                  >
                    {d}
                    <span className="mr-1.5 text-[10px] font-normal text-slate-400">
                      ({weekDates[dayIdxs[i]]?.toLocaleDateString('ar-JO', { day: 'numeric', month: 'numeric' })})
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((hour) => (
                <tr key={hour} className="group">
                  <td className="sticky right-0 z-10 border-b border-l border-slate-200 bg-slate-50/60 px-3 py-3 text-center backdrop-blur">
                    <span className="text-xs font-bold text-slate-600">{hour}:00</span>
                    <br />
                    <span className="text-[10px] text-slate-400">{hour < 12 ? 'ص' : 'م'}</span>
                  </td>
                  {dayIdxs.map((dayIdx) => {
                    const appt = isOccupied(dayIdx, hour);
                    const isStart = appt && appt.startHour === hour;
                    const slotKey = `${dayIdx}-${hour}`;
                    const hasSlotConflict = conflicts.has(slotKey);
                    if (appt && isStart) {
                      const st = STATUS_STYLES[appt.status];
                      return (
                        <td
                          key={dayIdx}
                          rowSpan={appt.duration}
                          className={`border-b border-l border-slate-200 p-1.5 last:border-l-0 ${hasSlotConflict ? 'bg-error-50/40' : ''}`}
                        >
                          <button
                            onClick={() => setDetailAppt(appt)}
                            className={`flex h-full w-full flex-col justify-between rounded-md border p-3 text-right transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${appt.color} ${hasSlotConflict ? 'ring-2 ring-error-400' : ''}`}
                            style={{ minHeight: 64 * appt.duration - 12 }}
                          >
                            <div>
                              <p className="truncate text-sm font-bold">{appt.patientName}</p>
                              <p className="truncate text-xs font-medium opacity-80">{appt.reason}</p>
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-[10px] font-semibold">
                                {appt.startHour}:00 - {appt.startHour + appt.duration}:00
                              </span>
                              <div className="flex items-center gap-1">
                                {appt.recurrence && appt.recurrence !== 'none' && (
                                  <Repeat size={10} className="opacity-60" />
                                )}
                                <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                              </div>
                            </div>
                          </button>
                        </td>
                      );
                    }
                    if (appt && !isStart) return null;
                    return (
                      <td key={dayIdx} className="border-b border-l border-slate-200 p-1.5 last:border-l-0">
                        <button
                          onClick={() => openBooking(dayIdx, hour)}
                          className="flex h-16 w-full items-center justify-center rounded-md border-2 border-dashed border-slate-200 text-slate-300 transition-all duration-200 hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-500"
                          aria-label="حجز موعد"
                        >
                          <Plus size={18} />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking modal */}
      <Modal
        open={!!bookingSlot}
        onClose={() => setBookingSlot(null)}
        title="حجز موعد"
        subtitle={bookingSlot ? `${DAYS[bookingSlot.day]} - الساعة ${bookingSlot.hour}:00` : ''}
      >
        <div className="space-y-4">
          <div>
            <label className="label">المريض</label>
            <select className="input" value={selPatientId} onChange={(e) => setSelPatientId(e.target.value)}>
              {store.patients.map((p) => (
                <option key={p.id} value={p.id}>{p.fullName} — {p.phone}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">نوع الخدمة</label>
            <select className="input" value={selReason} onChange={(e) => setSelReason(e.target.value)}>
              {DENTAL_SERVICES.map((s) => (
                <option key={s.name} value={s.name}>{s.name} ({s.price} د.أ)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">التاريخ</label>
            <input
              type="date"
              className="input"
              value={selDate}
              onChange={(e) => setSelDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">المدة (ساعات)</label>
            <div className="flex gap-2">
              {[1, 2].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelDuration(d)}
                  className={`flex-1 rounded-md border-2 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    selDuration === d
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {d} ساعة {d === 2 ? '(ساعتان)' : ''}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">التكرار</label>
            <select
              className="input"
              value={selRecurrence}
              onChange={(e) => setSelRecurrence(e.target.value as RecurrenceType)}
            >
              {(['none', 'weekly', 'biweekly', 'monthly'] as RecurrenceType[]).map((r) => (
                <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          {bookingSlot && hasConflict(bookingSlot.day, bookingSlot.hour, selDuration) && (
            <div className="flex items-center gap-2 rounded-md bg-error-50 px-4 py-3 text-sm text-error-700">
              <AlertTriangle size={16} />
              تعارض: يوجد موعد آخر في نفس الوقت
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={confirmBooking} className="btn-accent flex-1">
              <CheckCircle2 size={20} />
              تأكيد الحجز
            </button>
            <button onClick={() => setBookingSlot(null)} className="btn-secondary">إلغاء</button>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={!!detailAppt}
        onClose={() => setDetailAppt(null)}
        title="تفاصيل الموعد"
        subtitle={detailAppt ? `${DAYS[detailAppt.day]} · ${detailAppt.startHour}:00 - ${detailAppt.startHour + detailAppt.duration}:00` : ''}
      >
        {detailAppt && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-md bg-slate-50 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-600 font-bold text-white">
                {detailAppt.patientName.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-slate-500">المريض</p>
                <p className="text-base font-bold text-slate-800">{detailAppt.patientName}</p>
              </div>
            </div>

            {detailAppt.appointmentDate && (
              <div className="rounded-md bg-slate-50 p-3 text-sm">
                <span className="text-slate-500">التاريخ: </span>
                <span className="font-semibold text-slate-800">
                  {new Date(detailAppt.appointmentDate).toLocaleDateString('ar-JO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}

            {detailAppt.recurrence && detailAppt.recurrence !== 'none' && (
              <div className="flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
                <Repeat size={15} />
                موعد متكرر: {RECURRENCE_LABELS[detailAppt.recurrence]}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-slate-50 p-4">
                <p className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={13} /> الخدمة
                </p>
                <p className="font-semibold text-slate-800">{detailAppt.reason}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <p className="mb-1 text-xs text-slate-500">الحالة</p>
                <span className={`badge ${STATUS_STYLES[detailAppt.status].badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLES[detailAppt.status].dot}`} />
                  {detailAppt.status}
                </span>
              </div>
            </div>

            <div>
              <p className="label">تغيير الحالة</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(['محجوز', 'مؤكد', 'تم', 'ملغى'] as AppointmentStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={async () => {
                      try {
                        await store.updateAppointmentStatus(detailAppt.id, s);
                        setDetailAppt({ ...detailAppt, status: s });
                        toast('تم تحديث حالة الموعد', 'success');
                      } catch {
                        toast('حدث خطأ أثناء التحديث', 'error');
                      }
                    }}
                    className={`rounded-md border-2 px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                      detailAppt.status === s
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={async () => {
                  try {
                    await store.deleteAppointment(detailAppt.id);
                    toast('تم حذف الموعد', 'success');
                    setDetailAppt(null);
                  } catch {
                    toast('حدث خطأ أثناء الحذف', 'error');
                  }
                }}
                className="btn-danger flex-1"
              >
                <Trash2 size={18} />
                حذف الموعد
              </button>
              <button onClick={() => setDetailAppt(null)} className="btn-secondary">إغلاق</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
