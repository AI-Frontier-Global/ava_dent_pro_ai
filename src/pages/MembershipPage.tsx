import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  X,
  Crown,
  Sparkles,
  Calendar,
  CreditCard,
  Pencil,
  UserPlus,
  Pause,
  Play,
} from 'lucide-react';
import type { Store } from '../store';
import type { MembershipPlan, PatientMembership, BillingCycle } from '../types';
import {
  BILLING_CYCLE_LABELS,
  MEMBERSHIP_STATUS_LABELS,
  MEMBERSHIP_STATUS_STYLES,
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

const CYCLES: BillingCycle[] = ['monthly', 'quarterly', 'yearly'];

const MEMBERSHIP_STATUS: PatientMembership['status'][] = ['active', 'paused', 'cancelled'];

export default function MembershipPage({ store }: Props) {
  const toast = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [memberships, setMemberships] = useState<PatientMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'plans' | 'members'>('plans');

  const [planModal, setPlanModal] = useState(false);
  const [editPlan, setEditPlan] = useState<MembershipPlan | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planForm, setPlanForm] = useState<{
    name: string;
    price: number;
    billingCycle: BillingCycle;
    features: string[];
  }>({ name: '', price: 25, billingCycle: 'monthly', features: [''] });

  const [memberModal, setMemberModal] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ patientId: '', planId: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([
        store.loadMembershipPlans(),
        store.loadPatientMemberships(),
      ]);
      setPlans(p);
      setMemberships(m);
    } catch {
      toast('تعذّر تحميل بيانات العضويات', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeMembers = memberships.filter((m) => m.status === 'active').length;
  const monthlyRevenue = useMemo(() => {
    return memberships
      .filter((m) => m.status === 'active')
      .reduce((sum, m) => {
        const plan = plans.find((p) => p.id === m.planId);
        if (!plan) return sum;
        const monthly =
          plan.billingCycle === 'monthly' ? plan.price :
          plan.billingCycle === 'quarterly' ? plan.price / 3 :
          plan.price / 12;
        return sum + monthly;
      }, 0);
  }, [memberships, plans]);

  const openCreatePlan = () => {
    setEditPlan(null);
    setPlanForm({ name: '', price: 25, billingCycle: 'monthly', features: [''] });
    setPlanModal(true);
  };

  const openEditPlan = (p: MembershipPlan) => {
    setEditPlan(p);
    setPlanForm({
      name: p.name,
      price: p.price,
      billingCycle: p.billingCycle,
      features: p.features.length > 0 ? p.features : [''],
    });
    setPlanModal(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.name.trim()) {
      toast('الرجاء إدخال اسم الباقة', 'error');
      return;
    }
    const features = planForm.features.map((f) => f.trim()).filter(Boolean);
    setSavingPlan(true);
    try {
      if (editPlan) {
        await store.updateMembershipPlan(editPlan.id, {
          name: planForm.name.trim(),
          price: planForm.price,
          billingCycle: planForm.billingCycle,
          features,
        });
        setPlans((prev) =>
          prev.map((p) =>
            p.id === editPlan.id
              ? { ...p, name: planForm.name.trim(), price: planForm.price, billingCycle: planForm.billingCycle, features }
              : p,
          ),
        );
        toast('تم تحديث الباقة', 'success');
      } else {
        const plan = await store.addMembershipPlan({
          name: planForm.name.trim(),
          price: planForm.price,
          billingCycle: planForm.billingCycle,
          features,
        });
        setPlans((prev) => [plan, ...prev]);
        toast('تم إنشاء الباقة', 'success');
      }
      setPlanModal(false);
    } catch {
      toast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (p: MembershipPlan) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
    try {
      await store.deleteMembershipPlan(p.id);
      setPlans((prev) => prev.filter((x) => x.id !== p.id));
      toast('تم حذف الباقة', 'success');
    } catch {
      toast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  const togglePlanActive = async (p: MembershipPlan) => {
    try {
      await store.updateMembershipPlan(p.id, { active: !p.active });
      setPlans((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)));
    } catch {
      toast('حدث خطأ', 'error');
    }
  };

  const openCreateMember = () => {
    setMemberForm({ patientId: store.patients[0]?.id ?? '', planId: plans[0]?.id ?? '' });
    setMemberModal(true);
  };

  const handleSaveMember = async () => {
    if (!memberForm.patientId) {
      toast('الرجاء اختيار مريض', 'error');
      return;
    }
    const plan = plans.find((p) => p.id === memberForm.planId);
    if (!plan) {
      toast('الرجاء اختيار باقة', 'error');
      return;
    }
    setSavingMember(true);
    try {
      const m = await store.addPatientMembership({
        patientId: memberForm.patientId,
        planId: memberForm.planId,
        billingCycle: plan.billingCycle,
      });
      setMemberships((prev) => [m, ...prev]);
      toast('تم اشتراك المريض بنجاح', 'success');
      setMemberModal(false);
    } catch {
      toast('حدث خطأ أثناء الاشتراك', 'error');
    } finally {
      setSavingMember(false);
    }
  };

  const changeMemberStatus = async (m: PatientMembership, status: PatientMembership['status']) => {
    try {
      await store.updatePatientMembershipStatus(m.id, status);
      setMemberships((prev) => prev.map((x) => (x.id === m.id ? { ...x, status } : x)));
      toast('تم تحديث حالة الاشتراك', 'success');
    } catch {
      toast('حدث خطأ', 'error');
    }
  };

  const handleDeleteMember = async (m: PatientMembership) => {
    if (!confirm('هل أنت متأكد من حذف هذا الاشتراك؟')) return;
    try {
      await store.deletePatientMembership(m.id);
      setMemberships((prev) => prev.filter((x) => x.id !== m.id));
      toast('تم حذف الاشتراك', 'success');
    } catch {
      toast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Crown size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">الباقات</p>
            <p className="text-2xl font-extrabold text-slate-900">{plans.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-100 text-success-700">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">اشتراكات نشطة</p>
            <p className="text-2xl font-extrabold text-slate-900">{activeMembers}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">الإيراد الشهري المتوقع</p>
            <p className="text-xl font-extrabold text-slate-900">{formatJOD(Math.round(monthlyRevenue))}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-elev-1">
          <button
            onClick={() => setTab('plans')}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
              tab === 'plans' ? 'bg-brand-600 text-white shadow-elev-1' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            الباقات
          </button>
          <button
            onClick={() => setTab('members')}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
              tab === 'members' ? 'bg-brand-600 text-white shadow-elev-1' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            المشتركون
          </button>
        </div>
        {tab === 'plans' ? (
          <button onClick={openCreatePlan} className="btn-accent">
            <Plus size={18} />
            باقة جديدة
          </button>
        ) : (
          <button onClick={openCreateMember} className="btn-accent">
            <UserPlus size={18} />
            اشتراك جديد
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 size={28} className="animate-spin text-brand-500" />
        </div>
      ) : tab === 'plans' ? (
        plans.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <Crown size={32} className="mb-3 text-slate-300" />
            <p className="text-sm text-slate-500">لا توجد باقات عضوية بعد</p>
            <button onClick={openCreatePlan} className="btn-accent mt-4">
              <Plus size={18} />
              إنشاء أول باقة
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => {
              const memberCount = memberships.filter((m) => m.planId === p.id && m.status === 'active').length;
              return (
                <div
                  key={p.id}
                  className={`card card-hover relative flex flex-col p-5 ${!p.active ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-accent-600 text-white shadow-elev-2">
                      <Crown size={20} />
                    </div>
                    <span className={`badge ${p.active ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.active ? 'مفعّلة' : 'متوقفة'}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{p.name}</h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-brand-700">{formatJOD(p.price)}</span>
                    <span className="text-xs text-slate-400">/ {BILLING_CYCLE_LABELS[p.billingCycle]}</span>
                  </div>

                  <ul className="mt-4 flex-1 space-y-1.5">
                    {p.features.filter(Boolean).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <Sparkles size={14} className="mt-0.5 shrink-0 text-brand-500" />
                        {f}
                      </li>
                    ))}
                    {p.features.filter(Boolean).length === 0 && (
                      <li className="text-xs text-slate-400">لا توجد مزايا محددة</li>
                    )}
                  </ul>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Users size={12} /> {memberCount} مشترك
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePlanActive(p)}
                        className="btn-icon"
                        title={p.active ? 'إيقاف' : 'تفعيل'}
                      >
                        {p.active ? <Pause size={15} /> : <Play size={15} />}
                      </button>
                      <button onClick={() => openEditPlan(p)} className="btn-icon" aria-label="تعديل">
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(p)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-error-50 hover:text-error-600"
                        aria-label="حذف"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : memberships.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Users size={32} className="mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">لا يوجد مشتركون بعد</p>
          <button onClick={openCreateMember} className="btn-accent mt-4">
            <UserPlus size={18} />
            إضافة اشتراك
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>المريض</th>
                  <th>الباقة</th>
                  <th className="hidden md:table-cell">تاريخ البدء</th>
                  <th className="hidden lg:table-cell">الفوترة القادمة</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((m) => {
                  const st = MEMBERSHIP_STATUS_STYLES[m.status];
                  return (
                    <tr key={m.id}>
                      <td className="font-semibold text-slate-800">{m.patientName}</td>
                      <td>
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <Crown size={13} className="text-brand-500" />
                          {m.planName}
                        </span>
                      </td>
                      <td className="hidden md:table-cell text-xs text-slate-500">{dateStr(m.startedAt)}</td>
                      <td className="hidden lg:table-cell text-xs text-slate-500">{dateStr(m.nextBilling)}</td>
                      <td>
                        <span className={`badge ${st.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {MEMBERSHIP_STATUS_LABELS[m.status]}
                        </span>
                      </td>
                      <td>
                      <div className="flex items-center gap-1">
                        {MEMBERSHIP_STATUS.map((s) => (
                          <button
                            key={s}
                            onClick={() => changeMemberStatus(m, s)}
                            title={MEMBERSHIP_STATUS_LABELS[s]}
                            className={`rounded-lg p-1.5 transition-colors ${
                              m.status === s ? 'bg-brand-50 text-brand-700' : 'text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {s === 'active' ? <Play size={14} /> : s === 'paused' ? <Pause size={14} /> : <X size={14} />}
                          </button>
                        ))}
                        <button
                          onClick={() => handleDeleteMember(m)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-error-50 hover:text-error-600"
                          aria-label="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plan modal */}
      <Modal
        open={planModal}
        onClose={() => !savingPlan && setPlanModal(false)}
        title={editPlan ? 'تعديل الباقة' : 'باقة عضوية جديدة'}
        subtitle="باقات متكررة الدفع للمرضى"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">اسم الباقة</label>
            <input
              className="input"
              value={planForm.name}
              onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="مثال: باقة العناية الشاملة"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">السعر (د.أ)</label>
              <input
                type="number"
                min={0}
                className="input"
                value={planForm.price}
                onChange={(e) => setPlanForm((f) => ({ ...f, price: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="label">دورة الفوترة</label>
              <select
                className="input"
                value={planForm.billingCycle}
                onChange={(e) => setPlanForm((f) => ({ ...f, billingCycle: e.target.value as BillingCycle }))}
              >
                {CYCLES.map((c) => (
                  <option key={c} value={c}>{BILLING_CYCLE_LABELS[c]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label !mb-0">المزايا</label>
              <button
                onClick={() => setPlanForm((f) => ({ ...f, features: [...f.features, ''] }))}
                className="btn-ghost text-brand-600"
              >
                <Plus size={16} />
                إضافة ميزة
              </button>
            </div>
            <div className="space-y-2">
              {planForm.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="input !py-2.5 text-sm"
                    value={feat}
                    onChange={(e) =>
                      setPlanForm((f) => ({
                        ...f,
                        features: f.features.map((x, idx) => (idx === i ? e.target.value : x)),
                      }))
                    }
                    placeholder="مثال: تنظيف أسنان مجاني مرتين سنوياً"
                  />
                  {planForm.features.length > 1 && (
                    <button
                      onClick={() =>
                        setPlanForm((f) => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }))
                      }
                      className="rounded-lg p-2.5 text-slate-400 transition-colors hover:bg-error-50 hover:text-error-600"
                      aria-label="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={handleSavePlan} disabled={savingPlan} className="btn-accent flex-1">
              {savingPlan ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
              {savingPlan ? 'جارٍ الحفظ...' : 'حفظ الباقة'}
            </button>
            <button onClick={() => setPlanModal(false)} disabled={savingPlan} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* Member modal */}
      <Modal
        open={memberModal}
        onClose={() => !savingMember && setMemberModal(false)}
        title="اشتراك جديد"
        subtitle="ربط مريض بباقة عضوية"
      >
        <div className="space-y-4">
          <div>
            <label className="label">المريض</label>
            <select
              className="input"
              value={memberForm.patientId}
              onChange={(e) => setMemberForm((f) => ({ ...f, patientId: e.target.value }))}
            >
              <option value="">— اختر مريضاً —</option>
              {store.patients.map((p) => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">الباقة</label>
            <select
              className="input"
              value={memberForm.planId}
              onChange={(e) => setMemberForm((f) => ({ ...f, planId: e.target.value }))}
            >
              <option value="">— اختر باقة —</option>
              {plans.filter((p) => p.active).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatJOD(p.price)} / {BILLING_CYCLE_LABELS[p.billingCycle]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={handleSaveMember} disabled={savingMember} className="btn-accent flex-1">
              {savingMember ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
              {savingMember ? 'جارٍ الاشتراك...' : 'تفعيل الاشتراك'}
            </button>
            <button onClick={() => setMemberModal(false)} disabled={savingMember} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
