import { useState } from 'react';
import { Search, UserPlus, Phone, Calendar, MoreVertical, Pencil, Trash2, X } from 'lucide-react';
import type { Store } from '@/store';
import type { Patient } from '@/types';
import ContextualChips from './ContextualChips';

type Props = {
  store: Store;
};

export default function PatientsV2({ store }: Props) {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState({ fullName: '', phone: '', birthDate: '', gender: 'ذكر' as 'ذكر' | 'أنثى', notes: '' });

  const filtered = store.patients.filter(
    (p) =>
      p.fullName.includes(search) ||
      p.phone.includes(search),
  );

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.phone.trim()) return;
    try {
      if (editing) {
        await store.updatePatient(editing.id, {
          fullName: form.fullName,
          phone: form.phone,
          birthDate: form.birthDate,
          gender: form.gender,
          notes: form.notes,
        });
      } else {
        await store.addPatient({
          fullName: form.fullName,
          phone: form.phone,
          birthDate: form.birthDate,
          gender: form.gender,
          notes: form.notes,
        });
      }
      setShowAdd(false);
      setEditing(null);
      setForm({ fullName: '', phone: '', birthDate: '', gender: 'ذكر', notes: '' });
    } catch {
      // error handled by store
    }
  };

  const openEdit = (p: Patient) => {
    setEditing(p);
    setForm({ fullName: p.fullName, phone: p.phone, birthDate: p.birthDate, gender: p.gender, notes: p.notes || '' });
    setShowAdd(true);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ fullName: '', phone: '', birthDate: '', gender: 'ذكر', notes: '' });
    setShowAdd(true);
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث عن مريض..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-4 text-sm text-slate-700 outline-none transition-all focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
          />
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand-500 to-accent-600 px-4 py-2.5 text-sm font-bold text-white shadow-elev-1 transition-all hover:shadow-elev-2 active:scale-[0.98]"
        >
          <UserPlus size={18} />
          إضافة مريض
        </button>
      </div>

      {/* Patient cards grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Search size={40} className="mb-3 opacity-40" />
          <p className="text-sm">لا يوجد مرضى مطابقون</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-elev-1 transition-all hover:shadow-elev-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-600 text-base font-bold text-white">
                    {p.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{p.fullName}</h3>
                    <span className="text-[11px] text-slate-500">
                      {p.gender} · {p.birthDate || '—'}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Phone size={13} />
                  <span dir="ltr">{p.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar size={13} />
                  <span>أضيف في {p.createdAt.slice(0, 10)}</span>
                </div>
              </div>

              {/* AI Contextual Chips — revealed on hover */}
              <div className="mt-4 opacity-0 transition-opacity group-hover:opacity-100">
                <ContextualChips
                  onAnalyze={() => {}}
                  onMessage={() => {}}
                  onSummarize={() => {}}
                  compact
                />
              </div>

              {/* Actions */}
              <div className="mt-3 flex gap-2 border-t border-slate-50 pt-3">
                <button
                  onClick={() => openEdit(p)}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Pencil size={13} />
                  تعديل
                </button>
                <button
                  onClick={async () => {
                    if (confirm(`حذف المريض "${p.fullName}"؟`)) {
                      await store.deletePatient(p.id);
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <Trash2 size={13} />
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-elev-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{editing ? 'تعديل مريض' : 'إضافة مريض جديد'}</h3>
              <button onClick={() => setShowAdd(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">الاسم الكامل</label>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">رقم الهاتف</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">تاريخ الميلاد</label>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">الجنس</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as 'ذكر' | 'أنثى' })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">ملاحظات</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
                />
              </div>
              <button
                onClick={handleSave}
                className="w-full rounded-xl bg-gradient-to-l from-brand-500 to-accent-600 py-3 text-sm font-bold text-white shadow-elev-1 transition-all hover:shadow-elev-2 active:scale-[0.98]"
              >
                {editing ? 'حفظ التعديلات' : 'إضافة المريض'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
