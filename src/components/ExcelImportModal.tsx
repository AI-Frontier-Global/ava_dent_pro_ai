import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  X,
  AlertTriangle,
  Table,
  Download,
} from 'lucide-react';
import type { Store } from '../store';
import { parseExcelFile, type ImportResult, type ImportedPatient } from '../lib/excelImport';
import Modal from './Modal';
import { useToast } from './Toast';

type Props = {
  store: Store;
  open: boolean;
  onClose: () => void;
};

export default function ExcelImportModal({ store, open, onClose }: Props) {
  const toast = useToast();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setResult(null);
    setDone(false);
    setParsing(false);
    setImporting(false);
  };

  const handleClose = () => {
    if (parsing || importing) return;
    reset();
    onClose();
  };

  const handleFile = useCallback(
    async (file: File) => {
      setParsing(true);
      setDone(false);
      setResult(null);
      try {
        const res = await parseExcelFile(file);
        setResult(res);
        if (res.patients.length === 0) {
          toast('لم يتم العثور على بيانات صالحة في الملف', 'error');
        } else {
          toast(`تم تحليل ${res.patients.length} مريض من الملف`, 'success');
        }
      } catch {
        toast('تعذّر قراءة الملف. تأكد من أنه ملف Excel صالح', 'error');
      } finally {
        setParsing(false);
      }
    },
    [toast],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!result || result.patients.length === 0) return;
    setImporting(true);
    try {
      const items = result.patients.map((p) => ({
        fullName: p.fullName,
        phone: p.phone,
        birthDate: p.birthDate,
        gender: p.gender,
        notes: p.notes,
      }));
      const { added, failed } = await store.batchAddPatients(items);
      setDone(true);
      if (failed > 0) {
        toast(`تم استيراد ${added.length} مريض، وفشل ${failed}`, 'error');
      } else {
        toast(`تم استيراد ${added.length} مريض بنجاح`, 'success');
      }
    } catch {
      toast('حدث خطأ أثناء الاستيراد', 'error');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['الاسم الكامل', 'رقم الموبايل', 'تاريخ الميلاد', 'الجنس', 'ملاحظات'];
    const sample = [
      ['محمد أحمد الخطيب', '0791234567', '1990-05-15', 'ذكر', 'حساسية من البنسلين'],
      ['سارة خالد العمري', '0789876543', '1985-11-20', 'أنثى', ''],
    ];
    const csv = [headers, ...sample].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'نموذج_استيراد_المرضى.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const colLabels: Record<string, string> = {
    fullName: 'الاسم',
    phone: 'الهاتف',
    birthDate: 'تاريخ الميلاد',
    gender: 'الجنس',
    notes: 'ملاحظات',
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="استيراد بيانات المرضى من ملف Excel"
      subtitle="تحميل ذكي للبيانات مع مطابقة تلقائية للأعمدة"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Upload zone */}
        {!result && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-all ${
              dragOver
                ? 'border-brand-500 bg-brand-50'
                : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/50'
            }`}
          >
            {parsing ? (
              <>
                <Loader2 size={40} className="mb-3 animate-spin text-brand-500" />
                <p className="text-sm font-semibold text-slate-700">جارٍ تحليل الملف...</p>
              </>
            ) : (
              <>
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <FileSpreadsheet size={32} />
                </div>
                <p className="text-base font-bold text-slate-800">اسحب ملف Excel هنا أو انقر للاختيار</p>
                <p className="mt-1 text-xs text-slate-500">يدعم صيغ: .xlsx, .xls, .csv</p>
                <div className="mt-4 flex items-center gap-2">
                  <Upload size={16} className="text-brand-600" />
                  <span className="text-sm font-semibold text-brand-600">اختيار ملف</span>
                </div>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        )}

        {/* Template download */}
        {!result && (
          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Table size={14} className="text-slate-400" />
              <span>لا تعرف صيغة الملف؟ حمّل النموذج الجاهز</span>
            </div>
            <button onClick={downloadTemplate} className="btn-ghost text-brand-600">
              <Download size={14} />
              تحميل النموذج
            </button>
          </div>
        )}

        {/* Detected columns */}
        {result && !done && (
          <div className="space-y-4">
            <div className="rounded-md border border-success-200 bg-success-50/60 p-3.5">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-success-700">
                <CheckCircle2 size={16} />
                تم تحليل {result.totalRows} صف — {result.patients.length} مريض صالح
                {result.skipped.length > 0 && ` · ${result.skipped.length} صف تم تجاوزه`}
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.detectedColumns).map(([key, val]) => (
                  <span key={key} className="badge bg-white text-slate-700 border border-slate-200">
                    <span className="text-slate-400">{colLabels[key] || key}:</span>
                    <span className="font-mono text-xs" dir="ltr">{val}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Preview table */}
            <div className="max-h-80 overflow-auto rounded-md border border-slate-200">
              <table className="tbl">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    <th className="w-8">#</th>
                    <th>الاسم</th>
                    <th>الهاتف</th>
                    <th className="hidden sm:table-cell">الميلاد</th>
                    <th className="hidden sm:table-cell">الجنس</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {result.patients.map((p) => (
                    <PatientPreviewRow key={p._rowNumber} patient={p} />
                  ))}
                </tbody>
              </table>
            </div>

            {result.skipped.length > 0 && (
              <div className="rounded-md border border-warning-200 bg-warning-50/60 p-3">
                <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-warning-700">
                  <AlertTriangle size={14} />
                  صفوف تم تجاوزها
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.skipped.map((s) => (
                    <span key={s.row} className="text-xs text-slate-500">
                      صف {s.row}: {s.reason}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={importing || result.patients.length === 0}
                className="btn-accent flex-1"
              >
                {importing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={20} />
                )}
                {importing ? 'جارٍ الاستيراد...' : `استيراد ${result.patients.length} مريض`}
              </button>
              <button onClick={reset} disabled={importing} className="btn-secondary">
                ملف آخر
              </button>
            </div>
          </div>
        )}

        {/* Done state */}
        {done && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-success-600">
              <CheckCircle2 size={36} />
            </div>
            <p className="text-lg font-bold text-slate-800">تم الاستيراد بنجاح!</p>
            <p className="mt-1 text-sm text-slate-500">يمكنك الآن مراجعة بيانات المرضى في القائمة</p>
            <button onClick={handleClose} className="btn-accent mt-5">
              <X size={18} />
              إغلاق
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function PatientPreviewRow({ patient }: { patient: ImportedPatient }) {
  const hasWarnings = patient._warnings.length > 0;
  const phoneValid = /^07\d{8}$/.test(patient.phone);
  return (
    <tr className={hasWarnings ? 'bg-warning-50/40' : ''}>
      <td className="text-xs text-slate-400">{patient._rowNumber}</td>
      <td className="font-semibold text-slate-800">{patient.fullName}</td>
      <td dir="ltr" className="font-mono text-sm">
        <span className={phoneValid ? 'text-slate-700' : 'text-warning-600'}>{patient.phone || '—'}</span>
      </td>
      <td className="hidden text-sm text-slate-600 sm:table-cell" dir="ltr">{patient.birthDate || '—'}</td>
      <td className="hidden sm:table-cell">
        <span className="badge bg-slate-100 text-slate-600">{patient.gender}</span>
      </td>
      <td>
        {hasWarnings ? (
          <div className="flex flex-col gap-0.5">
            {patient._warnings.map((w, i) => (
              <span key={i} className="flex items-center gap-1 text-xs text-warning-600">
                <AlertTriangle size={10} />
                {w}
              </span>
            ))}
          </div>
        ) : (
          <CheckCircle2 size={16} className="text-success-500" />
        )}
      </td>
    </tr>
  );
}
