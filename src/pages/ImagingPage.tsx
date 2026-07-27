import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Upload,
  Search,
  X,
  ChevronLeft,
  Trash2,
  Image as ImageIcon,
  FileText,
  Scan,
  Calendar,
  Loader2,
  ZoomIn,
  Download,
  AlertCircle,
} from 'lucide-react';
import type { Store } from '../store';
import type { Patient, PatientImage, ImageType } from '../types';
import { IMAGE_TYPE_LABELS, IMAGE_TYPE_STYLES } from '../types';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

type Props = { store: Store };

const TYPE_FILTERS: { id: ImageType | 'all'; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'xray', label: 'أشعة' },
  { id: 'photo', label: 'صور' },
  { id: 'document', label: 'مستندات' },
];

const TYPE_ICONS: Record<ImageType, typeof Scan> = {
  xray: Scan,
  photo: Camera,
  document: FileText,
};

export default function ImagingPage({ store }: Props) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ImageType | 'all'>('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [images, setImages] = useState<PatientImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImg, setPreviewImg] = useState<PatientImage | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploadForm, setUploadForm] = useState<{
    type: ImageType;
    title: string;
    description: string;
    file: File | null;
  }>({ type: 'xray', title: '', description: '', file: null });

  const filteredPatients = useMemo(() => {
    const q = query.trim();
    if (!q) return store.patients;
    return store.patients.filter((p) => p.fullName.includes(q) || p.phone.includes(q));
  }, [store.patients, query]);

  const openPatient = async (p: Patient) => {
    setSelectedPatient(p);
    setImages([]);
    setLoadingImages(true);
    try {
      const imgs = await store.loadPatientImages(p.id);
      setImages(imgs);
    } catch {
      toast('تعذّر تحميل صور المريض', 'error');
    } finally {
      setLoadingImages(false);
    }
  };

  const filteredImages = useMemo(() => {
    if (typeFilter === 'all') return images;
    return images.filter((i) => i.type === typeFilter);
  }, [images, typeFilter]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast('حجم الملف يتجاوز 10 ميجابايت', 'error');
      return;
    }
    setUploadForm((prev) => ({
      ...prev,
      file: f,
      title: prev.title || f.name.replace(/\.[^.]+$/, ''),
    }));
  };

  const handleUpload = async () => {
    if (!selectedPatient || !uploadForm.file) return;
    if (!uploadForm.title.trim()) {
      toast('الرجاء إدخال عنوان للصورة', 'error');
      return;
    }
    setUploading(true);
    try {
      const img = await store.uploadPatientImage(selectedPatient.id, uploadForm.file, {
        type: uploadForm.type,
        title: uploadForm.title.trim(),
        description: uploadForm.description.trim() || undefined,
      });
      setImages((prev) => [img, ...prev]);
      toast('تم رفع الصورة بنجاح', 'success');
      setUploadOpen(false);
      setUploadForm({ type: 'xray', title: '', description: '', file: null });
    } catch {
      toast('حدث خطأ أثناء رفع الصورة', 'error');
    } finally {
      setUploading(false);
    }
  };

  const openPreview = async (img: PatientImage) => {
    setPreviewImg(img);
    setPreviewUrl(null);
    setPreviewLoading(true);
    try {
      const url = await store.createSignedImageUrl(img.storagePath);
      setPreviewUrl(url);
    } catch {
      toast('تعذّر تحميل الصورة', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = async (img: PatientImage) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;
    try {
      await store.deletePatientImage(img);
      setImages((prev) => prev.filter((i) => i.id !== img.id));
      if (previewImg?.id === img.id) setPreviewImg(null);
      toast('تم حذف الصورة', 'success');
    } catch {
      toast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  const isImageFile = (img: PatientImage) =>
    img.type === 'xray' || img.type === 'photo' ||
    /\.(png|jpe?g|gif|webp|bmp)$/i.test(img.storagePath);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Scan size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">أرشيف التصوير</p>
            <p className="text-2xl font-extrabold text-slate-900">{store.patients.length} مريض</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-100 text-success-700">
            <Camera size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">العمليات</p>
            <p className="text-2xl font-extrabold text-slate-900">رفع وتنظيم الأشعة والصور</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning-100 text-warning-700">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">الخصوصية</p>
            <p className="text-2xl font-extrabold text-slate-900">تخزين آمن خاص بكل عيادة</p>
          </div>
        </div>
      </div>

      {!selectedPatient ? (
        <>
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-elev-1 sm:w-80">
              <Search size={18} className="text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="بحث عن مريض..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Patient grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => openPatient(p)}
                className="card card-hover group p-5 text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-accent-600 text-lg font-bold text-white shadow-elev-1">
                    {p.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900">{p.fullName}</p>
                    <p className="text-xs text-slate-500" dir="ltr">{p.phone}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="flex items-center gap-1 text-slate-500">
                    <ImageIcon size={12} /> أرشيف الصور
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-brand-600 group-hover:text-brand-700">
                    عرض <ChevronLeft size={14} />
                  </span>
                </div>
              </button>
            ))}
            {filteredPatients.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <Camera size={32} className="mb-3 text-slate-300" />
                <p className="text-sm text-slate-500">لا يوجد مرضى مطابقون للبحث</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Patient header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-sky-600 to-accent-700 p-6 text-white shadow-elev-2">
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm transition-colors hover:bg-white/25"
                  aria-label="رجوع"
                >
                  <ChevronLeft size={20} className="rotate-180" />
                </button>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold backdrop-blur-sm">
                  {selectedPatient.fullName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedPatient.fullName}</h2>
                  <p className="text-sm text-sky-100" dir="ltr">{selectedPatient.phone}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setUploadForm({ type: 'xray', title: '', description: '', file: null });
                  setUploadOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/25"
              >
                <Upload size={16} />
                رفع صورة / أشعة
              </button>
            </div>
          </div>

          {/* Type filter */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-elev-1">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                  typeFilter === f.id
                    ? 'bg-brand-600 text-white shadow-elev-1'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Images grid */}
          {loadingImages ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 size={28} className="animate-spin text-brand-500" />
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <ImageIcon size={28} />
              </div>
              <p className="text-sm font-medium text-slate-500">
                {images.length === 0 ? 'لا توجد صور أو أشعة لهذا المريض بعد' : 'لا توجد عناصر مطابقة للفلتر'}
              </p>
              {images.length === 0 && (
                <button
                  onClick={() => setUploadOpen(true)}
                  className="btn-accent mt-4"
                >
                  <Upload size={18} />
                  رفع أول صورة
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredImages.map((img) => {
                const Icon = TYPE_ICONS[img.type];
                const st = IMAGE_TYPE_STYLES[img.type];
                return (
                  <div key={img.id} className="card card-hover group overflow-hidden">
                    <div
                      className="relative flex h-40 cursor-pointer items-center justify-center bg-slate-50"
                      onClick={() => openPreview(img)}
                    >
                      <ThumbPreview img={img} store={store} />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors group-hover:bg-slate-900/30">
                        <span className="flex h-9 w-9 scale-0 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition-transform group-hover:scale-100">
                          <ZoomIn size={16} />
                        </span>
                      </div>
                      <span className={`absolute right-3 top-3 badge ${st.badge} shadow-elev-1`}>
                        <Icon size={11} />
                        {IMAGE_TYPE_LABELS[img.type]}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="truncate font-semibold text-slate-800">{img.title}</p>
                      {img.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{img.description}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Calendar size={11} />
                          {new Date(img.createdAt).toLocaleDateString('ar-JO')}
                        </span>
                        <button
                          onClick={() => handleDelete(img)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-error-50 hover:text-error-600"
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
          )}
        </>
      )}

      {/* Upload modal */}
      <Modal
        open={uploadOpen}
        onClose={() => !uploading && setUploadOpen(false)}
        title="رفع صورة أو أشعة"
        subtitle={selectedPatient ? `للمريض: ${selectedPatient.fullName}` : ''}
      >
        <div className="space-y-4">
          <div>
            <label className="label">نوع الملف</label>
            <div className="grid grid-cols-3 gap-2">
              {(['xray', 'photo', 'document'] as ImageType[]).map((t) => {
                const Icon = TYPE_ICONS[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setUploadForm((p) => ({ ...p, type: t }))}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all ${
                      uploadForm.type === t
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={18} />
                    {IMAGE_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">العنوان</label>
            <input
              className="input"
              value={uploadForm.title}
              onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="مثال: أشعة بانورامية، صورة أمامية..."
            />
          </div>

          <div>
            <label className="label">وصف (اختياري)</label>
            <textarea
              className="input min-h-[70px] resize-none"
              value={uploadForm.description}
              onChange={(e) => setUploadForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="ملاحظات حول الصورة أو التشخيص..."
            />
          </div>

          <div>
            <label className="label">الملف</label>
            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFilePick} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-700"
            >
              <Upload size={18} />
              {uploadForm.file ? uploadForm.file.name : 'اختر ملفاً (صورة أو PDF — حتى 10 ميجابايت)'}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleUpload}
              disabled={uploading || !uploadForm.file}
              className="btn-accent flex-1"
            >
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
              {uploading ? 'جارٍ الرفع...' : 'رفع الملف'}
            </button>
            <button onClick={() => setUploadOpen(false)} disabled={uploading} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview lightbox */}
      {previewImg && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setPreviewImg(null)}
          />
          <div className="relative max-h-[90vh] w-full max-w-3xl animate-modal-in">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-800">{previewImg.title}</p>
                  <p className="text-xs text-slate-500">
                    {IMAGE_TYPE_LABELS[previewImg.type]} · {new Date(previewImg.createdAt).toLocaleDateString('ar-JO')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {previewUrl && isImageFile(previewImg) && (
                    <a
                      href={previewUrl}
                      download={previewImg.title}
                      className="btn-icon"
                      aria-label="تحميل"
                    >
                      <Download size={18} />
                    </a>
                  )}
                  <button
                    onClick={() => setPreviewImg(null)}
                    className="btn-icon"
                    aria-label="إغلاق"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex min-h-[300px] items-center justify-center bg-slate-50 p-4">
                {previewLoading ? (
                  <Loader2 size={28} className="animate-spin text-brand-500" />
                ) : previewUrl ? (
                  isImageFile(previewImg) ? (
                    <img
                      src={previewUrl}
                      alt={previewImg.title}
                      className="max-h-[70vh] w-auto rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                      <FileText size={48} className="text-slate-400" />
                      <p className="text-sm text-slate-500">هذا ملف مستند</p>
                      <a href={previewUrl} download={previewImg.title} className="btn-accent">
                        <Download size={18} />
                        تحميل الملف
                      </a>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center">
                    <AlertCircle size={32} className="text-error-400" />
                    <p className="text-sm text-slate-500">تعذّر تحميل الملف</p>
                  </div>
                )}
              </div>
              {previewImg.description && (
                <div className="border-t border-slate-100 px-5 py-3">
                  <p className="text-sm text-slate-600">{previewImg.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Thumbnail that fetches a signed URL on mount */
function ThumbPreview({ img, store }: { img: PatientImage; store: Store }) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const u = await store.createSignedImageUrl(img.storagePath);
        if (active) setUrl(u);
      } catch {
        if (active) setErr(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [img.storagePath, store]);

  if (err) {
    return <FileText size={32} className="text-slate-300" />;
  }
  if (!url) {
    return <Loader2 size={24} className="animate-spin text-slate-300" />;
  }
  const isImg = /\.(png|jpe?g|gif|webp|bmp)$/i.test(img.storagePath) || img.type !== 'document';
  if (!isImg) {
    return <FileText size={32} className="text-slate-400" />;
  }
  return (
    <img
      src={url}
      alt={img.title}
      className="h-full w-full object-cover"
      onError={() => setErr(true)}
    />
  );
}
