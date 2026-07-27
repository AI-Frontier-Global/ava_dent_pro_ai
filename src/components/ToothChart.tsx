import { useEffect, useState } from 'react';
import { Loader2, X, Check } from 'lucide-react';
import type { Store } from '../store';
import type { ToothCondition, ToothRecord } from '../types';
import {
  ADULT_TEETH,
  TOOTH_CONDITION_LABELS,
  TOOTH_CONDITION_STYLES,
} from '../types';

type Props = {
  patientId: string;
  store: Store;
};

const CONDITIONS: ToothCondition[] = [
  'healthy', 'cavity', 'filled', 'extracted', 'crown', 'implant', 'root_canal', 'missing',
];

export default function ToothChart({ patientId, store }: Props) {
  const [records, setRecords] = useState<ToothRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [pickedCondition, setPickedCondition] = useState<ToothCondition>('cavity');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await store.loadToothRecords(patientId);
      setRecords(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const conditionFor = (tooth: number): ToothCondition => {
    const r = records.find((x) => x.toothNumber === tooth);
    return r?.condition ?? 'healthy';
  };

  const recordFor = (tooth: number) => records.find((x) => x.toothNumber === tooth);

  const openTooth = (tooth: number) => {
    const r = recordFor(tooth);
    setSelectedTooth(tooth);
    setPickedCondition(r?.condition ?? 'cavity');
    setNotes(r?.notes ?? '');
  };

  const handleSave = async () => {
    if (selectedTooth === null) return;
    setSaving(true);
    try {
      if (pickedCondition === 'healthy') {
        const existing = recordFor(selectedTooth);
        if (existing) {
          await store.deleteToothRecord(existing.id);
          setRecords((prev) => prev.filter((r) => r.id !== existing.id));
        }
      } else {
        const rec = await store.upsertToothRecord({
          patientId,
          toothNumber: selectedTooth,
          condition: pickedCondition,
          notes: notes.trim() || undefined,
        });
        setRecords((prev) => {
          const filtered = prev.filter((r) => r.toothNumber !== selectedTooth);
          return [...filtered, rec];
        });
      }
      setSelectedTooth(null);
      setNotes('');
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const renderTooth = (num: number) => {
    const cond = conditionFor(num);
    const st = TOOTH_CONDITION_STYLES[cond];
    return (
      <button
        key={num}
        onClick={() => openTooth(num)}
        className={`group relative flex h-9 w-9 items-center justify-center rounded-lg border-2 text-xs font-bold transition-all hover:scale-110 hover:shadow-md ${
          cond === 'healthy'
            ? 'border-slate-200 bg-white text-slate-600 hover:border-brand-400'
            : `${st.ring} ${st.bg} ${st.label} border-transparent`
        }`}
        title={`سن ${num} — ${TOOTH_CONDITION_LABELS[cond]}`}
      >
        {num}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700">جدول الأسنان</h4>
        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS.filter((c) => c !== 'healthy').map((c) => {
            const st = TOOTH_CONDITION_STYLES[c];
            return (
              <span key={c} className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${st.bg} ${st.label}`}>
                {TOOTH_CONDITION_LABELS[c]}
              </span>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          {/* Upper jaw */}
          <div className="mb-1 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">الفك العلوي</div>
          <div className="flex justify-center gap-1">
            <div className="flex gap-1">
              {ADULT_TEETH.upperRight.map(renderTooth)}
            </div>
            <div className="w-px bg-slate-300" />
            <div className="flex gap-1">
              {ADULT_TEETH.upperLeft.map(renderTooth)}
            </div>
          </div>

          <div className="my-3 h-px bg-slate-200" />

          {/* Lower jaw */}
          <div className="flex justify-center gap-1">
            <div className="flex gap-1">
              {ADULT_TEETH.lowerRight.map(renderTooth)}
            </div>
            <div className="w-px bg-slate-300" />
            <div className="flex gap-1">
              {ADULT_TEETH.lowerLeft.map(renderTooth)}
            </div>
          </div>
          <div className="mt-1 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">الفك السفلي</div>
        </div>
      )}

      {/* Tooth editor popover */}
      {selectedTooth !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedTooth(null)} />
          <div className="relative w-full max-w-sm animate-modal-in">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <h3 className="text-base font-bold text-slate-800">سن رقم {selectedTooth}</h3>
                <button onClick={() => setSelectedTooth(null)} className="btn-icon" aria-label="إغلاق">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <label className="label">الحالة</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {CONDITIONS.map((c) => {
                      const st = TOOTH_CONDITION_STYLES[c];
                      return (
                        <button
                          key={c}
                          onClick={() => setPickedCondition(c)}
                          className={`rounded-lg border-2 px-2 py-2 text-[11px] font-semibold transition-all ${
                            pickedCondition === c
                              ? `border-brand-500 ${st.bg} ${st.label}`
                              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {TOOTH_CONDITION_LABELS[c]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="label">ملاحظات (اختياري)</label>
                  <textarea
                    className="input min-h-[60px] resize-none text-sm"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="تفاصيل الحالة أو العلاج..."
                  />
                </div>
                <button onClick={handleSave} disabled={saving} className="btn-accent w-full">
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  حفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
