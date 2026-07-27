import { useState, useMemo } from 'react';
import {
  HeartPulse, MessageCircle, CheckCircle2, XCircle, Clock, Calendar, Plus,
  Search, Trash2, Send, Phone, User, AlertCircle, Bell, ChevronLeft,
} from 'lucide-react';
import type { Store } from '../store';
import type { Patient, Appointment, FollowUp, FollowUpType } from '../types';
import { DAYS } from '../types';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import {
  whatsappLink, reminderMessage, postVisitMessage, customMessage,
  formatDate, todayISO, addDays, nextOccurrenceOfDay, initials,
} from '../lib/whatsapp';

type Props = { store: Store };

type Filter = 'all' | 'pending' | 'done' | 'overdue';

export default function PatientEngagementPage({ store }: Props) {
  const { patients, appointments, followUps } = store;
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('pending');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    patientId: '',
    type: 'post_visit' as FollowUpType,
    appointmentId: '',
    followUpDate: todayISO(),
    message: '',
  });

  const today = todayISO();

  const sorted = useMemo(() => {
    return [...followUps].sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
  }, [followUps]);

  const filtered = useMemo(() => {
    return sorted.filter((f) => {
      if (filter === 'pending' && f.status !== 'pending') return false;
      if (filter === 'done' && f.status !== 'done') return false;
      if (filter === 'overdue' && !(f.status === 'pending' && f.followUpDate < today)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!f.patientName.toLowerCase().includes(q) && !f.message.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [sorted, filter, search, today]);

  const stats = useMemo(() => {
    const pending = followUps.filter((f) => f.status === 'pending').length;
    const overdue = followUps.filter((f) => f.status === 'pending' && f.followUpDate < today).length;
    const done = followUps.filter((f) => f.status === 'done').length;
    const todayCount = followUps.filter((f) => f.followUpDate === today && f.status === 'pending').length;
    return { pending, overdue, done, todayCount };
  }, [followUps, today]);

  const openModal = () => {
    setForm({ patientId: '', type: 'post_visit', appointmentId: '', followUpDate: todayISO(), message: '' });
    setModalOpen(true);
  };

  const selectedPatient = patients.find((p) => p.id === form.patientId) ?? null;
  const selectedAppt = appointments.find((a) => a.id === form.appointmentId) ?? null;

  const handleSave = async () => {
    if (!form.patientId) { toast('الرجاء اختيار مريض', 'error'); return; }
    if (!form.followUpDate) { toast('الرجاء تحديد تاريخ المتابعة', 'error'); return; }
    const patient = patients.find((p) => p.id === form.patientId);
    if (!patient) return;

    let message = form.message;
    if (!message) {
      if (form.type === 'post_visit') message = postVisitMessage(patient.fullName, formatDate(form.followUpDate));
      else if (form.type === 'reminder' && selectedAppt) message = reminderMessage(patient.fullName, selectedAppt, formatDate(form.followUpDate));
      else message = customMessage(patient.fullName, 'متابعة حالة المريض');
    }

    try {
      await store.addFollowUp({
        patientId: patient.id,
        patientName: patient.fullName,
        appointmentId: form.appointmentId || null,
        followUpDate: form.followUpDate,
        type: form.type,
        message,
      });
      toast('تمت إضافة المتابعة بنجاح', 'success');
      setModalOpen(false);
    } catch {
      toast('حدث خطأ أثناء الحفظ', 'error');
    }
  };

  const handleStatus = async (f: FollowUp, status: 'done' | 'cancelled') => {
    try {
      await store.updateFollowUpStatus(f.id, status);
      toast(status === 'done' ? 'تم وضع علامة مكتمل' : 'تم إلغاء المتابعة', 'success');
    } catch {
      toast('حدث خطأ', 'error');
    }
  };

  const handleDelete = async (f: FollowUp) => {
    if (!confirm('هل أنت متأكد من حذف هذه المتابعة؟')) return;
    try {
      await store.deleteFollowUp(f.id);
      toast('تم حذف المتابعة', 'success');
    } catch {
      toast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  const sendWhatsApp = (f: FollowUp) => {
    const patient = patients.find((p) => p.id === f.patientId);
    if (!patient) { toast('لم يتم العثور على رقم المريض', 'error'); return; }
    const link = whatsappLink(patient.phone, f.message);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const patientAppts = (pid: string): Appointment[] => appointments.filter((a) => a.patientId === pid);

  const typeMeta: Record<FollowUpType, { label: string; icon: typeof Bell; color: string }> = {
    post_visit: { label: 'متابعة بعد الزيارة', icon: CheckCircle2, color: 'bg-brand-100 text-brand-700' },
    reminder: { label: 'تذكير موعد', icon: Bell, color: 'bg-blue-100 text-blue-700' },
    custom: { label: 'مخصّص', icon: MessageCircle, color: 'bg-warning-100 text-warning-700' },
  };

  const filterTabs: { id: Filter; label: string; count: number }[] = [
    { id: 'pending', label: 'قيد المتابعة', count: stats.pending },
    { id: 'overdue', label: 'متأخرة', count: stats.overdue },
    { id: 'done', label: 'مكتملة', count: stats.done },
    { id: 'all', label: 'الكل', count: followUps.length },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-slate-800">
            <HeartPulse className="text-error-500" />
            متابعة المرضى
          </h2>
          <p className="mt-1 text-sm text-slate-500">تذكيرات WhatsApp تلقائية ومتابعة بعد الزيارة</p>
        </div>
        <button onClick={openModal} className="btn-accent self-start">
          <Plus size={20} />
          إضافة متابعة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Clock} label="متابعات اليوم" value={stats.todayCount} color="bg-blue-50 text-blue-600" />
        <StatCard icon={AlertCircle} label="متأخرة" value={stats.overdue} color="bg-error-50 text-error-600" />
        <StatCard icon={Bell} label="قيد المتابعة" value={stats.pending} color="bg-warning-50 text-warning-600" />
        <StatCard icon={CheckCircle2} label="مكتملة" value={stats.done} color="bg-success-50 text-success-600" />
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                filter === t.id
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
              <span className={`mr-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                filter === t.id ? 'bg-white/20' : 'bg-slate-100'
              }`}>{t.count}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم المريض أو الرسالة..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-4 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 sm:w-64"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState onAdd={openModal} />
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => {
            const patient = patients.find((p) => p.id === f.patientId);
            const meta = typeMeta[f.type];
            const Icon = meta.icon;
            const isOverdue = f.status === 'pending' && f.followUpDate < today;
            const isToday = f.followUpDate === today;
            return (
              <div
                key={f.id}
                className={`rounded-2xl border bg-white p-4 transition-all hover:shadow-md ${
                  isOverdue ? 'border-error-200' : isToday ? 'border-blue-200' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${meta.color}`}>
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-800">{f.patientName}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.color}`}>
                          {meta.label}
                        </span>
                        {f.status === 'done' && (
                          <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-semibold text-success-700">مكتملة</span>
                        )}
                        {f.status === 'cancelled' && (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">ملغاة</span>
                        )}
                        {isOverdue && f.status === 'pending' && (
                          <span className="rounded-full bg-error-100 px-2 py-0.5 text-xs font-semibold text-error-700">متأخرة</span>
                        )}
                        {isToday && f.status === 'pending' && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">اليوم</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar size={13} />
                        {formatDate(f.followUpDate)}
                      </div>
                      {f.message && (
                        <p className="mt-2 line-clamp-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{f.message}</p>
                      )}
                    </div>
                  </div>

                  {f.status === 'pending' && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => sendWhatsApp(f)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-success-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-success-600"
                      >
                        <Send size={16} />
                        WhatsApp
                      </button>
                      <button
                        onClick={() => handleStatus(f, 'done')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-sm font-semibold text-success-700 transition-colors hover:bg-success-100"
                      >
                        <CheckCircle2 size={16} />
                        إكمال
                      </button>
                      <button
                        onClick={() => handleStatus(f, 'cancelled')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        <XCircle size={16} />
                        إلغاء
                      </button>
                      <button
                        onClick={() => handleDelete(f)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-error-200 bg-white px-3 py-2 text-sm font-semibold text-error-600 transition-colors hover:bg-error-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="إضافة متابعة جديدة"
        subtitle="تذكير WhatsApp أو متابعة بعد الزيارة"
      >
        <div className="space-y-4">
          {/* Type */}
          <div>
            <label className="label">نوع المتابعة</label>
            <div className="grid grid-cols-3 gap-2">
              {(['post_visit', 'reminder', 'custom'] as FollowUpType[]).map((t) => {
                const m = typeMeta[t];
                const Icon = m.icon;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t, appointmentId: '' })}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition-all ${
                      form.type === t
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={18} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Patient */}
          <div>
            <label className="label">المريض</label>
            <div className="relative">
              <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value, appointmentId: '' })}
                className="input pr-12"
              >
                <option value="">اختر مريضاً...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Appointment (for reminder type) */}
          {form.type === 'reminder' && selectedPatient && (
            <div>
              <label className="label">الموعد المرتبط</label>
              <select
                value={form.appointmentId}
                onChange={(e) => setForm({ ...form, appointmentId: e.target.value })}
                className="input"
              >
                <option value="">بدون موعد محدد</option>
                {patientAppts(form.patientId).map((a) => (
                  <option key={a.id} value={a.id}>
                    {DAYS[a.day]} - {a.startHour}:00 ({a.reason})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="label">تاريخ المتابعة</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, followUpDate: todayISO() })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  form.followUpDate === todayISO() ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, followUpDate: addDays(todayISO(), 1) })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  form.followUpDate === addDays(todayISO(), 1) ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                غداً
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, followUpDate: addDays(todayISO(), 3) })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  form.followUpDate === addDays(todayISO(), 3) ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                بعد 3 أيام
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, followUpDate: addDays(todayISO(), 7) })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  form.followUpDate === addDays(todayISO(), 7) ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                بعد أسبوع
              </button>
            </div>
            <input
              type="date"
              value={form.followUpDate}
              onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
              className="input mt-2"
            />
          </div>

          {/* Auto-fill date for reminder */}
          {form.type === 'reminder' && selectedAppt && (
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              سيتم استخدام تاريخ الموعد القادم: {formatDate(nextOccurrenceOfDay(selectedAppt.day))}
            </div>
          )}

          {/* Message preview */}
          <div>
            <label className="label">رسالة WhatsApp (تُولّد تلقائياً إن تُركت فارغة)</label>
            <textarea
              className="input min-h-[100px] resize-none"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder={selectedPatient
                ? (form.type === 'post_visit'
                    ? postVisitMessage(selectedPatient.fullName, formatDate(form.followUpDate))
                    : form.type === 'reminder' && selectedAppt
                      ? reminderMessage(selectedPatient.fullName, selectedAppt, formatDate(form.followUpDate))
                      : customMessage(selectedPatient.fullName, 'متابعة حالة المريض'))
                : 'اختر مريضاً لمعاينة الرسالة...'}
            />
            {selectedPatient && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Phone size={13} />
                {selectedPatient.phone}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} className="btn-accent flex-1">
              <CheckCircle2 size={20} />
              حفظ المتابعة
            </button>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Clock; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon size={20} />
      </div>
      <div className="text-2xl font-extrabold text-slate-800">{value}</div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-50">
        <HeartPulse className="text-error-400" size={32} />
      </div>
      <h3 className="text-lg font-bold text-slate-700">لا توجد متابعات</h3>
      <p className="mt-1 text-sm text-slate-500">ابدأ بإضافة متابعة جديدة لمريض — تذكير موعد أو متابعة بعد الزيارة</p>
      <button onClick={onAdd} className="btn-accent mt-4">
        <Plus size={18} />
        إضافة متابعة
      </button>
    </div>
  );
}
