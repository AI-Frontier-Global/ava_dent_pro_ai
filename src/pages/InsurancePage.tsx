import { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Wallet,
  Percent,
  Building2,
  Calendar,
  X,
  ChevronLeft,
} from 'lucide-react';
import type { Store } from '../store';
import type { InsurancePolicy, InsuranceStatus } from '../types';
import {
  INSURANCE_STATUS_LABELS,
  INSURANCE_STATUS_STYLES,
  INSURANCE_PROVIDERS,
} from '../types';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

type Props = { store: Store };

function formatJOD(n: number) {
  return n.toLocaleString('ar-JO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' د.أ';
}

function dateStr(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-JO', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_ORDER: InsuranceStatus[] = ['pending', 'active', 'expired', 'rejected'];

export default function InsurancePage({ store }: Props) {
  const toast = useToast();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InsuranceStatus | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<InsurancePolicy | null>(null);

  const [form, setForm] = useState({
    patientId: '',
    provider: INSURANCE_PROVIDERS[0] as string,
    policyNumber: '',
    coveragePercent: 80,
    maxAnnual: 1000,
    validUntil: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await store.loadInsurancePolicies();
      setPolicies(data);
    } catch {
      toast('تعذّر تحميل بيانات التأمين', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = policies;
    if (filter !== 'all') list = list.filter((p) => p.status === filter);
    const q = query.trim();
    if (q) list = list.filter((p) => p.patientName.includes(q) || p.provider.includes(q) || p.policyNumber.includes(q));
    return list;
  }, [policies, filter, query]);

  const openCreate = () => {
    setForm({
      patientId: store.patients[0]?.id ?? '',
      provider: INSURANCE_PROVIDERS[0] as string,
      policyNumber: '',
      coveragePercent: 80,
      maxAnnual: 1000,
      validUntil: '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.patientId) {
      toast('الرجاء اختيار مريض', 'error');
      return;
    }
    if (!form.policyNumber.trim()) {
      toast('الرجاء إدخال رقم الوثيقة', 'error');
      return;
    }
    setSaving(true);
    try {
      const policy = await store.addInsurancePolicy({
        patientId: form.patientId,
        provider: form.provider,
        policyNumber: form.policyNumber.trim(),
        coveragePercent: form.coveragePercent,
        maxAnnual: form.maxAnnual,
        validUntil: form.validUntil || undefined,
      });
      setPolicies((prev) => [policy, ...prev]);
      toast('تمت إضافة الوثيقة بنجاح', 'success');
      setModalOpen(false);
    } catch {
      toast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (p: InsurancePolicy, status: InsuranceStatus) => {
    try {
      await store.updateInsuranceStatus(p.id, status);
      const updated = policies.map((x) => (x.id === p.id ? { ...x, status } : x));
      setPolicies(updated);
      setSelected(updated.find((x) => x.id === p.id) ?? null);
      toast('تم تحديث حالة الوثيقة', 'success');
    } catch {
      toast('حدث خطأ أثناء التحديث', 'error');
    }
  };

  const handleDelete = async (p: InsurancePolicy) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوثيقة؟')) return;
    try {
      await store.deleteInsurancePolicy(p.id);
      setPolicies((prev) => prev.filter((x) => x.id !== p.id));
      setSelected(null);
      toast('تم حذف الوثيقة', 'success');
    } catch {
      toast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  const activeCount = policies.filter((p) => p.status === 'active').length;
  const totalCoverage = policies.reduce((s, p) => s + p.maxAnnual, 0);
  const totalRemaining = policies.reduce((s, p) => s + p.remaining, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">وثائق نشطة</p>
            <p className="text-2xl font-extrabold text-slate-900">{activeCount}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">إجمالي التغطية</p>
            <p className="text-xl font-extrabold text-slate-900">{formatJOD(totalCoverage)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-100 text-success-700">
            <Percent size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">المتبقي للمرضى</p>
            <p className="text-xl font-extrabold text-slate-900">{formatJOD(totalRemaining)}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-elev-1 sm:w-72">
          <Search size={18} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث بالمريض أو المزود..."
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <button onClick={openCreate} className="btn-accent">
          <Plus size={18} />
          وثيقة تأمين
        </button>
      </div>

      {/* Filter tabs */}
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-elev-1">
        {(['all', ...STATUS_ORDER] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
              filter === s ? 'bg-brand-600 text-white shadow-elev-1' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {s === 'all' ? 'الكل' : INSURANCE_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Policies table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 size={28} className="animate-spin text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <ShieldCheck size={32} className="mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">لا توجد وثائق تأمين مطابقة</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>المريض</th>
                  <th>مزود التأمين</th>
                  <th className="hidden md:table-cell">رقم الوثيقة</th>
                  <th className="hidden lg:table-cell">التغطية</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const st = INSURANCE_STATUS_STYLES[p.status];
                  return (
                    <tr key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                      <td className="font-semibold text-slate-800">{p.patientName}</td>
                      <td>
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <Building2 size={13} className="text-slate-400" />
                          {p.provider}
                        </span>
                      </td>
                      <td className="hidden md:table-cell font-mono text-xs text-slate-500" dir="ltr">
                        {p.policyNumber}
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className="font-semibold text-slate-700">{p.coveragePercent}%</span>
                        <span className="text-xs text-slate-400"> · {formatJOD(p.maxAnnual)}</span>
                      </td>
                      <td>
                        <span className={`badge ${st.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {INSURANCE_STATUS_LABELS[p.status]}
                        </span>
                      </td>
                      <td>
                        <ChevronLeft size={16} className="text-slate-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-start">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelected(null)}
          />
          <div className="relative h-full w-full max-w-md animate-slide-in-left overflow-y-auto bg-white shadow-elev-4">
            <div className="relative bg-gradient-to-l from-sky-600 to-accent-700 p-6 text-white">
              <button
                onClick={() => setSelected(null)}
                className="absolute left-4 top-4 rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="إغلاق"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selected.provider}</h2>
                  <p className="text-sm text-sky-100">{selected.patientName}</p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <p className="mb-1 flex items-center gap-1 text-xs text-slate-500">
                    <Building2 size={12} /> رقم الوثيقة
                  </p>
                  <p className="font-mono text-sm font-semibold text-slate-800" dir="ltr">
                    {selected.policyNumber}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <p className="mb-1 flex items-center gap-1 text-xs text-slate-500">
                    <Calendar size={12} /> صالحة حتى
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{dateStr(selected.validUntil)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <p className="mb-1 text-xs text-slate-500">نسبة التغطية</p>
                  <p className="text-lg font-bold text-brand-700">{selected.coveragePercent}%</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <p className="mb-1 text-xs text-slate-500">الحد السنوي</p>
                  <p className="text-sm font-bold text-slate-800">{formatJOD(selected.maxAnnual)}</p>
                </div>
              </div>

              {/* Coverage bar */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600">المتبقي من التغطية</span>
                  <span className="font-bold text-success-700">{formatJOD(selected.remaining)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-success-500 to-brand-400 transition-all duration-500"
                    style={{
                      width: `${selected.maxAnnual > 0 ? (selected.remaining / selected.maxAnnual) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  استُخدم: {formatJOD(selected.maxAnnual - selected.remaining)} من {formatJOD(selected.maxAnnual)}
                </p>
              </div>

              {/* Status controls */}
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-600">حالة الوثيقة</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_ORDER.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStatus(selected, s)}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                        selected.status === s
                          ? 'bg-brand-600 text-white'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {INSURANCE_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => handleDelete(selected)} className="btn-danger w-full">
                <Trash2 size={18} />
                حذف الوثيقة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title="وثيقة تأمين صحي"
        subtitle="إضافة تغطية تأمينية لمريض"
      >
        <div className="space-y-4">
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
            <label className="label">مزود التأمين</label>
            <select
              className="input"
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
            >
              {INSURANCE_PROVIDERS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">رقم الوثيقة</label>
            <input
              className="input"
              dir="ltr"
              value={form.policyNumber}
              onChange={(e) => setForm((f) => ({ ...f, policyNumber: e.target.value }))}
              placeholder="POL-123456"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">نسبة التغطية (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                className="input"
                value={form.coveragePercent}
                onChange={(e) => setForm((f) => ({ ...f, coveragePercent: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="label">الحد السنوي (د.أ)</label>
              <input
                type="number"
                min={0}
                className="input"
                value={form.maxAnnual}
                onChange={(e) => setForm((f) => ({ ...f, maxAnnual: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <label className="label">تاريخ انتهاء الوثيقة (اختياري)</label>
            <input
              type="date"
              className="input"
              value={form.validUntil}
              onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={handleSave} disabled={saving} className="btn-accent flex-1">
              {saving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
              {saving ? 'جارٍ الحفظ...' : 'حفظ الوثيقة'}
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
