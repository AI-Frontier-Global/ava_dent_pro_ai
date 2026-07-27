import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  ChevronLeft,
  Trash2,
  CheckCircle2,
  Circle,
  Loader2,
  X,
  Calendar,
  Activity,
  ListChecks,
  Pencil,
} from 'lucide-react';
import type { Store } from '../store';
import type {
  TreatmentPlan,
  TreatmentStep,
  TreatmentStepStatus,
  TreatmentPlanStatus,
} from '../types';
import {
  TREATMENT_STEP_STATUS_LABELS,
  TREATMENT_STEP_STATUS_STYLES,
  TREATMENT_PLAN_STATUS_LABELS,
  TREATMENT_PLAN_STATUS_STYLES,
} from '../types';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

type Props = { store: Store };

const uid = () => Math.random().toString(36).slice(2, 8);

function formatJOD(n: number) {
  return n.toLocaleString('ar-JO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' د.أ';
}

function dateStr(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-JO', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STEP_ORDER: TreatmentStepStatus[] = ['pending', 'in_progress', 'done', 'cancelled'];

export default function TreatmentPage({ store }: Props) {
  const toast = useToast();
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<TreatmentPlan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<{
    patientId: string;
    title: string;
    diagnosis: string;
    steps: Array<{ id: string; title: string; description: string; cost: number; dueDate: string }>;
  }>({
    patientId: '',
    title: '',
    diagnosis: '',
    steps: [{ id: uid(), title: '', description: '', cost: 0, dueDate: '' }],
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await store.loadTreatmentPlans();
      setPlans(data);
    } catch {
      toast('تعذّر تحميل خطط العلاج', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return plans;
    return plans.filter(
      (p) => p.patientName.includes(q) || p.title.includes(q),
    );
  }, [plans, query]);

  const openCreate = () => {
    setForm({
      patientId: store.patients[0]?.id ?? '',
      title: '',
      diagnosis: '',
      steps: [{ id: uid(), title: '', description: '', cost: 0, dueDate: '' }],
    });
    setModalOpen(true);
  };

  const addStepRow = () =>
    setForm((f) => ({
      ...f,
      steps: [...f.steps, { id: uid(), title: '', description: '', cost: 0, dueDate: '' }],
    }));
  const removeStepRow = (id: string) =>
    setForm((f) => ({ ...f, steps: f.steps.filter((s) => s.id !== id) }));
  const updateStepRow = (id: string, patch: Partial<(typeof form.steps)[0]>) =>
    setForm((f) => ({
      ...f,
      steps: f.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));

  const handleSave = async () => {
    if (!form.patientId) {
      toast('الرجاء اختيار مريض', 'error');
      return;
    }
    const validSteps = form.steps.filter((s) => s.title.trim() || s.description.trim() || s.cost > 0 || s.dueDate);
    const stepsToSave = (validSteps.length > 0 ? validSteps : form.steps).map((s, i) => ({
      title: s.title.trim() || `خطوة ${i + 1}`,
      description: s.description.trim() || undefined,
      cost: s.cost || 0,
      dueDate: s.dueDate || undefined,
    }));
    setSaving(true);
    try {
      const plan = await store.addTreatmentPlan({
        patientId: form.patientId,
        title: form.title.trim() || 'خطة علاج',
        diagnosis: form.diagnosis.trim() || undefined,
        steps: stepsToSave,
      });
      setPlans((prev) => [plan, ...prev]);
      toast('تم إنشاء خطة العلاج', 'success');
      setModalOpen(false);
    } catch {
      toast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const changeStepStatus = async (plan: TreatmentPlan, step: TreatmentStep, status: TreatmentStepStatus) => {
    try {
      await store.updateTreatmentStepStatus(step.id, status);
      const updatedPlans = plans.map((p) => {
        if (p.id !== plan.id) return p;
        return {
          ...p,
          steps: p.steps.map((s) => (s.id === step.id ? { ...s, status } : s)),
        };
      });
      setPlans(updatedPlans);
      setSelected(updatedPlans.find((p) => p.id === plan.id) ?? null);
    } catch {
      toast('حدث خطأ أثناء التحديث', 'error');
    }
  };

  const changePlanStatus = async (plan: TreatmentPlan, status: TreatmentPlanStatus) => {
    try {
      await store.updateTreatmentPlanStatus(plan.id, status);
      const updatedPlans = plans.map((p) => (p.id === plan.id ? { ...p, status } : p));
      setPlans(updatedPlans);
      setSelected(updatedPlans.find((p) => p.id === plan.id) ?? null);
      toast('تم تحديث حالة الخطة', 'success');
    } catch {
      toast('حدث خطأ أثناء التحديث', 'error');
    }
  };

  const handleDelete = async (plan: TreatmentPlan) => {
    if (!confirm('هل أنت متأكد من حذف خطة العلاج؟')) return;
    try {
      await store.deleteTreatmentPlan(plan.id);
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      setSelected(null);
      toast('تم حذف الخطة', 'success');
    } catch {
      toast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  const planProgress = (p: TreatmentPlan) => {
    if (p.steps.length === 0) return 0;
    const done = p.steps.filter((s) => s.status === 'done').length;
    return Math.round((done / p.steps.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-100 text-brand-700">
            <ClipboardList size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">خطط العلاج</p>
            <p className="text-2xl font-extrabold text-slate-900">{plans.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-warning-100 text-warning-700">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">خطط نشطة</p>
            <p className="text-2xl font-extrabold text-slate-900">
              {plans.filter((p) => p.status === 'active').length}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-success-100 text-success-700">
            <ListChecks size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">خطوات مكتملة</p>
            <p className="text-2xl font-extrabold text-slate-900">
              {plans.reduce((s, p) => s + p.steps.filter((x) => x.status === 'done').length, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 shadow-elev-1 sm:w-80">
          <Search size={18} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث بالمريض أو العنوان..."
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <button onClick={openCreate} className="btn-accent">
          <Plus size={18} />
          خطة علاج جديدة
        </button>
      </div>

      {/* Plans grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 size={28} className="animate-spin text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList size={32} className="mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">لا توجد خطط علاج بعد</p>
          <button onClick={openCreate} className="btn-accent mt-4">
            <Plus size={18} />
            إنشاء أول خطة
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((p) => {
            const st = TREATMENT_PLAN_STATUS_STYLES[p.status];
            const progress = planProgress(p);
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="card card-hover group p-5 text-right"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-slate-900">{p.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{p.patientName}</p>
                  </div>
                  <span className={`badge ${st.badge} shrink-0`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {TREATMENT_PLAN_STATUS_LABELS[p.status]}
                  </span>
                </div>
                {p.diagnosis && (
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">{p.diagnosis}</p>
                )}
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-500">التقدم</span>
                    <span className="font-bold text-brand-700">{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-brand-500 to-accent-400 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="flex items-center gap-1 text-slate-500">
                    <ListChecks size={12} />
                    {p.steps.filter((s) => s.status === 'done').length}/{p.steps.length} خطوة
                  </span>
                  <span className="font-bold text-slate-800">{formatJOD(p.totalCost)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Plan detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-start">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelected(null)}
          />
          <div className="relative h-full w-full max-w-lg animate-slide-in-left overflow-y-auto bg-white shadow-elev-5">
            <div className="sticky top-0 z-10 bg-gradient-to-l from-brand-600 to-accent-700 p-6 text-white">
              <button
                onClick={() => setSelected(null)}
                className="absolute left-4 top-4 rounded-sm p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="إغلاق"
              >
                <X size={20} />
              </button>
              <span className="badge bg-white/15 text-white">
                {TREATMENT_PLAN_STATUS_LABELS[selected.status]}
              </span>
              <h2 className="mt-2 text-xl font-bold">{selected.title}</h2>
              <p className="text-sm text-brand-100">{selected.patientName}</p>
            </div>

            <div className="space-y-5 p-6">
              {selected.diagnosis && (
                <div className="rounded-md border border-warning-200 bg-warning-50/60 p-3.5">
                  <p className="mb-1 text-xs font-semibold text-warning-700">التشخيص</p>
                  <p className="text-sm text-slate-700">{selected.diagnosis}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-slate-50 p-3.5">
                  <p className="mb-1 text-xs text-slate-500">إجمالي التكلفة</p>
                  <p className="text-lg font-bold text-slate-900">{formatJOD(selected.totalCost)}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3.5">
                  <p className="mb-1 text-xs text-slate-500">تاريخ الإنشاء</p>
                  <p className="text-sm font-semibold text-slate-800">{dateStr(selected.createdAt)}</p>
                </div>
              </div>

              {/* Steps timeline */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <ListChecks size={16} className="text-brand-600" />
                  خطوات العلاج ({selected.steps.length})
                </h4>
                <div className="space-y-3">
                  {selected.steps.map((step, idx) => {
                    const st = TREATMENT_STEP_STATUS_STYLES[step.status];
                    return (
                      <div key={step.id} className="relative rounded-md border border-slate-200 p-4">
                        {idx < selected.steps.length - 1 && (
                          <span className="absolute right-[26px] top-full h-3 w-px bg-slate-200" />
                        )}
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-slate-800">{step.title}</p>
                              <span className={`badge ${st.badge} shrink-0`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                {TREATMENT_STEP_STATUS_LABELS[step.status]}
                              </span>
                            </div>
                            {step.description && (
                              <p className="mt-1 text-xs text-slate-500">{step.description}</p>
                            )}
                            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                              <span className="font-semibold text-slate-700">{formatJOD(step.cost)}</span>
                              {step.dueDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar size={11} />
                                  {dateStr(step.dueDate)}
                                </span>
                              )}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {STEP_ORDER.map((s) => (
                                <button
                                  key={s}
                                  onClick={() => changeStepStatus(selected, step, s)}
                                  className={`rounded-sm px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                    step.status === s
                                      ? 'bg-brand-600 text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {TREATMENT_STEP_STATUS_LABELS[s]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Plan status controls */}
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-600">حالة الخطة</p>
                <div className="flex flex-wrap gap-2">
                  {(['active', 'on_hold', 'completed'] as TreatmentPlanStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => changePlanStatus(selected, s)}
                      className={`rounded-md px-3 py-2 text-sm font-semibold transition-all ${
                        selected.status === s
                          ? 'bg-brand-600 text-white'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {TREATMENT_PLAN_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleDelete(selected)}
                className="btn-danger w-full"
              >
                <Trash2 size={18} />
                حذف الخطة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title="خطة علاج جديدة"
        subtitle="خطط متعددة الخطوات لكل حالة"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">المريض</label>
              <select
                className="input"
                value={form.patientId}
                onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
              >
                <option value="">— اختر مريضاً —</option>
                {store.patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">عنوان الخطة</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="مثال: علاج جذور، تركيب طربوش..."
              />
            </div>
          </div>

          <div>
            <label className="label">التشخيص (اختياري)</label>
            <textarea
              className="input min-h-[60px] resize-none"
              value={form.diagnosis}
              onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))}
              placeholder="وصف الحالة والتشخيص الأولي..."
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label !mb-0">خطوات العلاج</label>
              <button onClick={addStepRow} className="btn-ghost text-brand-600">
                <Plus size={16} />
                إضافة خطوة
              </button>
            </div>
            <div className="space-y-2">
              {form.steps.map((s, i) => (
                <div key={s.id} className="rounded-md border border-slate-200 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <input
                      className="input !py-2 text-sm"
                      value={s.title}
                      onChange={(e) => updateStepRow(s.id, { title: e.target.value })}
                      placeholder="عنوان الخطوة"
                    />
                    {form.steps.length > 1 && (
                      <button
                        onClick={() => removeStepRow(s.id)}
                        className="rounded-sm p-2 text-slate-400 transition-colors hover:bg-error-50 hover:text-error-600"
                        aria-label="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      className="input !py-2 text-sm"
                      type="number"
                      min={0}
                      value={s.cost}
                      onChange={(e) => updateStepRow(s.id, { cost: Number(e.target.value) })}
                      placeholder="التكلفة"
                    />
                    <input
                      className="input !py-2 text-sm"
                      type="date"
                      value={s.dueDate}
                      onChange={(e) => updateStepRow(s.id, { dueDate: e.target.value })}
                    />
                    <input
                      className="input !py-2 text-sm"
                      value={s.description}
                      onChange={(e) => updateStepRow(s.id, { description: e.target.value })}
                      placeholder="وصف"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={handleSave} disabled={saving} className="btn-accent flex-1">
              {saving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
              {saving ? 'جارٍ الحفظ...' : 'حفظ الخطة'}
            </button>
            <button onClick={() => setModalOpen(false)} disabled={saving} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
