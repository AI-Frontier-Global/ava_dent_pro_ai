import { useMemo, useState } from 'react';
import {
  UserPlus,
  Search,
  Phone,
  Calendar,
  Trash2,
  CheckCircle2,
  Users,
  X,
  ChevronLeft,
  LayoutGrid,
  List,
  Mail,
  Clock,
  FileText,
  User,
  Pencil,
  Upload,
} from 'lucide-react';
import type { Store } from '../store';
import type { Patient } from '../types';
import Modal from '../components/Modal';
import ExcelImportModal from '../components/ExcelImportModal';
import { useToast } from '../components/Toast';
import ToothChart from '../components/ToothChart';

type Props = { store: Store };

const empty = {
  fullName: '',
  phone: '',
  birthDate: '',
  gender: 'ذكر' as 'ذكر' | 'أنثى',
  notes: '',
};

function age(birth: string) {
  if (!birth) return '—';
  const d = new Date(birth);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000)) + ' سنة';
}

export default function PatientsPage({ store }: Props) {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<'grid' | 'table'>('grid');
  const [selected, setSelected] = useState<Patient | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(empty);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return store.patients;
    return store.patients.filter((p) => p.fullName.includes(q) || p.phone.includes(q));
  }, [store.patients, query]);

  const patientAppts = (id: string) => store.appointments.filter((a) => a.patientId === id);
  const patientInvoices = (id: string) => store.invoices.filter((i) => i.patientId === id);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.fullName.trim().split(' ').filter(Boolean).length < 2) {
      e.fullName = 'الرجاء إدخال الاسم الثلاثي على الأقل';
    }
    if (!/^07\d{8}$/.test(form.phone)) {
      e.phone = 'رقم الموبايل يجب أن يبدأ بـ 07 ويتكون من 10 أرقام';
    }
    if (!form.birthDate) e.birthDate = 'الرجاء إدخال تاريخ الميلاد';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      await store.addPatient({ ...form, fullName: form.fullName.trim() });
      toast('تمت إضافة المريض بنجاح', 'success');
      setForm(empty);
      setErrors({});
      setModalOpen(false);
    } catch {
      toast('حدث خطأ أثناء حفظ المريض', 'error');
    }
  };

  const openEdit = (p: Patient) => {
    setEditForm({
      fullName: p.fullName,
      phone: p.phone,
      birthDate: p.birthDate,
      gender: p.gender,
      notes: p.notes ?? '',
    });
    setEditErrors({});
    setEditOpen(true);
  };

  const validateEdit = () => {
    const e: Record<string, string> = {};
    if (editForm.fullName.trim().split(' ').filter(Boolean).length < 2) {
      e.fullName = 'الرجاء إدخال الاسم الثلاثي على الأقل';
    }
    if (!/^07\d{8}$/.test(editForm.phone)) {
      e.phone = 'رقم الموبايل يجب أن يبدأ بـ 07 ويتكون من 10 أرقام';
    }
    if (!editForm.birthDate) e.birthDate = 'الرجاء إدخال تاريخ الميلاد';
    setEditErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleEditSave = async () => {
    if (!selected) return;
    if (!validateEdit()) return;
    try {
      await store.updatePatient(selected.id, { ...editForm, fullName: editForm.fullName.trim() });
      toast('تم تحديث بيانات المريض', 'success');
      setEditOpen(false);
    } catch {
      toast('حدث خطأ أثناء التحديث', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-100 text-brand-700">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">إجمالي المرضى</p>
            <p className="text-2xl font-extrabold text-slate-900">{store.patients.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-success-100 text-success-700">
            <UserPlus size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">مرضى جدد</p>
            <p className="text-2xl font-extrabold text-slate-900">{Math.min(store.patients.length, 3)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-warning-100 text-warning-700">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">مواعيد متابعة</p>
            <p className="text-2xl font-extrabold text-slate-900">{store.appointments.filter((a) => a.reason === 'متابعة').length}</p>
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
            placeholder="بحث بالاسم أو رقم الموبايل..."
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-1 shadow-elev-1">
            <button
              onClick={() => setLayout('grid')}
              className={`rounded-sm p-1.5 transition-all ${layout === 'grid' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
              aria-label="عرض شبكي"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setLayout('table')}
              className={`rounded-sm p-1.5 transition-all ${layout === 'table' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
              aria-label="عرض جدولي"
            >
              <List size={16} />
            </button>
          </div>
          <button onClick={() => setImportOpen(true)} className="btn-secondary">
            <Upload size={18} />
            استيراد Excel
          </button>
          <button onClick={() => setModalOpen(true)} className="btn-accent">
            <UserPlus size={18} />
            إضافة مريض
          </button>
        </div>
      </div>

      {/* Grid layout */}
      {layout === 'grid' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="card card-hover group p-5 text-right"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-600 text-lg font-bold text-white shadow-elev-1">
                  {p.fullName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">{p.fullName}</p>
                  <p className="text-xs text-slate-500" dir="ltr">{p.phone}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="flex items-center gap-1 text-slate-500">
                  <Calendar size={12} /> {age(p.birthDate)}
                </span>
                <span className="badge bg-slate-100 text-slate-600">{p.gender}</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <FileText size={12} /> {patientInvoices(p.id).length}
                </span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <Users size={32} className="mb-3 text-slate-300" />
              <p className="text-sm text-slate-500">لا يوجد مرضى مطابقون للبحث</p>
            </div>
          )}
        </div>
      )}

      {/* Table layout */}
      {layout === 'table' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>المريض</th>
                  <th>رقم الموبايل</th>
                  <th className="hidden md:table-cell">العمر</th>
                  <th className="hidden md:table-cell">الجنس</th>
                  <th className="hidden lg:table-cell">ملاحظات</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <button onClick={() => setSelected(p)} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-600 text-sm font-bold text-white">
                          {p.fullName.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800">{p.fullName}</span>
                      </button>
                    </td>
                    <td dir="ltr" className="font-mono text-sm">{p.phone}</td>
                    <td className="hidden md:table-cell">{age(p.birthDate)}</td>
                    <td className="hidden md:table-cell">
                      <span className="badge bg-slate-100 text-slate-600">{p.gender}</span>
                    </td>
                    <td className="hidden max-w-xs lg:table-cell">{p.notes || '—'}</td>
                    <td>
                      <button
                        onClick={() => setSelected(p)}
                        className="btn-icon"
                        aria-label="عرض"
                      >
                        <ChevronLeft size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      لا يوجد مرضى مطابقون للبحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-start">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelected(null)}
          />
          <div className="relative h-full w-full max-w-md animate-slide-in-left overflow-y-auto bg-white shadow-elev-5">
            {/* Header */}
            <div className="relative bg-gradient-to-l from-brand-600 to-accent-700 p-6 text-white">
              <button
                onClick={() => setSelected(null)}
                className="absolute left-4 top-4 rounded-sm p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="إغلاق"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-white/20 text-2xl font-bold backdrop-blur-sm">
                  {selected.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selected.fullName}</h3>
                  <p className="text-sm text-brand-100">مريض منذ {new Date(selected.createdAt).toLocaleDateString('ar-JO')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-slate-50 p-3.5">
                  <p className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <Phone size={12} /> الموبايل
                  </p>
                  <p className="text-sm font-semibold text-slate-800" dir="ltr">{selected.phone}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3.5">
                  <p className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar size={12} /> العمر
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{age(selected.birthDate)}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3.5">
                  <p className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <User size={12} /> الجنس
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{selected.gender}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3.5">
                  <p className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <Mail size={12} /> تاريخ الميلاد
                  </p>
                  <p className="text-sm font-semibold text-slate-800" dir="ltr">{selected.birthDate}</p>
                </div>
              </div>

              {selected.notes && (
                <div className="rounded-md border border-warning-200 bg-warning-50/60 p-3.5">
                  <p className="mb-1 text-xs font-semibold text-warning-700">ملاحظات</p>
                  <p className="text-sm text-slate-700">{selected.notes}</p>
                </div>
              )}

              {/* Tooth chart */}
              <ToothChart patientId={selected.id} store={store} />

              {/* Appointments */}
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Clock size={15} className="text-brand-600" />
                  المواعيد ({patientAppts(selected.id).length})
                </h4>
                <div className="space-y-2">
                  {patientAppts(selected.id).length === 0 && (
                    <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">لا توجد مواعيد سابقة</p>
                  )}
                  {patientAppts(selected.id).map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{a.reason}</p>
                        <p className="text-xs text-slate-500">يوم {a.day} · {a.startHour}:00</p>
                      </div>
                      <span className="badge bg-slate-100 text-slate-600">{a.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoices */}
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <FileText size={15} className="text-brand-600" />
                  الفواتير ({patientInvoices(selected.id).length})
                </h4>
                <div className="space-y-2">
                  {patientInvoices(selected.id).length === 0 && (
                    <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">لا توجد فواتير</p>
                  )}
                  {patientInvoices(selected.id).map((inv) => {
                    const sub = inv.items.reduce((s, it) => s + it.price * it.qty, 0);
                    const grand = sub * (1 + inv.taxRate);
                    return (
                      <div key={inv.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800" dir="ltr">{inv.id}</p>
                          <p className="text-xs text-slate-500">{inv.items.length} خدمة</p>
                        </div>
                        <span className="text-sm font-bold text-brand-700">
                          {grand.toLocaleString('ar-JO', { minimumFractionDigits: 0 })} د.أ
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => openEdit(selected)}
                  className="btn-secondary flex-1"
                >
                  <Pencil size={18} />
                  تعديل البيانات
                </button>
                <button
                  onClick={async () => {
                    if (!selected) return;
                    if (!confirm('هل أنت متأكد من حذف هذا المريض؟ سيتم حذف جميع مواعيده وفواتيره.')) return;
                    try {
                      await store.deletePatient(selected.id);
                      toast('تم حذف المريض بنجاح', 'success');
                      setSelected(null);
                    } catch {
                      toast('حدث خطأ أثناء الحذف', 'error');
                    }
                  }}
                  className="btn-danger flex-1"
                >
                  <Trash2 size={18} />
                  حذف المريض
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel import modal */}
      <ExcelImportModal store={store} open={importOpen} onClose={() => setImportOpen(false)} />

      {/* Edit modal */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditErrors({}); }}
        title="تعديل بيانات المريض"
        subtitle="تحديث المعلومات الأساسية للمريض"
      >
        <div className="space-y-4">
          <div>
            <label className="label">الاسم الثلاثي</label>
            <input
              className="input"
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              placeholder="مثال: محمد أحمد الخطيب"
            />
            {editErrors.fullName && <p className="mt-1 text-xs font-medium text-error-600">{editErrors.fullName}</p>}
          </div>
          <div>
            <label className="label">رقم الموبايل</label>
            <div className="relative">
              <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pr-12"
                dir="ltr"
                inputMode="numeric"
                maxLength={10}
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '') })}
                placeholder="07XXXXXXXX"
              />
            </div>
            {editErrors.phone && <p className="mt-1 text-xs font-medium text-error-600">{editErrors.phone}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">تاريخ الميلاد</label>
              <div className="relative">
                <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  className="input pr-12"
                  value={editForm.birthDate}
                  onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                />
              </div>
              {editErrors.birthDate && <p className="mt-1 text-xs font-medium text-error-600">{editErrors.birthDate}</p>}
            </div>
            <div>
              <label className="label">الجنس</label>
              <div className="flex gap-2">
                {(['ذكر', 'أنثى'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, gender: g })}
                    className={`flex-1 rounded-md border-2 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      editForm.gender === g
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="label">ملاحظات (اختياري)</label>
            <textarea
              className="input min-h-[80px] resize-none"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="حساسية، أمراض مزمنة، أدوية حالية..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleEditSave} className="btn-accent flex-1">
              <CheckCircle2 size={20} />
              حفظ التعديلات
            </button>
            <button onClick={() => { setEditOpen(false); setEditErrors({}); }} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* Add modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setErrors({}); }}
        title="إضافة مريض جديد"
        subtitle="أدخل بيانات المريض الأساسية"
      >
        <div className="space-y-4">
          <div>
            <label className="label">الاسم الثلاثي</label>
            <input
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="مثال: محمد أحمد الخطيب"
            />
            {errors.fullName && <p className="mt-1 text-xs font-medium text-error-600">{errors.fullName}</p>}
          </div>
          <div>
            <label className="label">رقم الموبايل</label>
            <div className="relative">
              <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pr-12"
                dir="ltr"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                placeholder="07XXXXXXXX"
              />
            </div>
            {errors.phone ? (
              <p className="mt-1 text-xs font-medium text-error-600">{errors.phone}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">يجب أن يبدأ بـ 07 ويتكون من 10 أرقام</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">تاريخ الميلاد</label>
              <div className="relative">
                <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  className="input pr-12"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                />
              </div>
              {errors.birthDate && <p className="mt-1 text-xs font-medium text-error-600">{errors.birthDate}</p>}
            </div>
            <div>
              <label className="label">الجنس</label>
              <div className="flex gap-2">
                {(['ذكر', 'أنثى'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm({ ...form, gender: g })}
                    className={`flex-1 rounded-md border-2 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      form.gender === g
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="label">ملاحظات (اختياري)</label>
            <textarea
              className="input min-h-[80px] resize-none"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="حساسية، أمراض مزمنة، أدوية حالية..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} className="btn-accent flex-1">
              <CheckCircle2 size={20} />
              حفظ المريض
            </button>
            <button onClick={() => { setModalOpen(false); setErrors({}); }} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
