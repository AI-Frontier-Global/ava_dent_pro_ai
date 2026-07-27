import { useMemo, useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Link2,
  CheckCircle2,
  Copy,
  FileText,
  Wallet,
  Receipt,
  Search,
  Download,
  Eye,
  TrendingUp,
  Clock,
  Pencil,
  CreditCard,
  X,
} from 'lucide-react';
import type { Store } from '../store';
import { DENTAL_SERVICES, PAYMENT_METHOD_LABELS, PAYMENT_METHOD_STYLES } from '../types';
import type { Invoice, InvoiceItem, PaymentMethod, InvoicePayment } from '../types';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { generateInvoicePDF } from '../lib/pdf';

type Props = { store: Store };
type Tab = 'all' | 'paid' | 'pending';

const uid = () => Math.random().toString(36).slice(2, 8);

function formatJOD(n: number) {
  return n.toLocaleString('ar-JO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' د.أ';
}

function dateStr(iso: string) {
  return new Date(iso).toLocaleDateString('ar-JO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function InvoicesPage({ store }: Props) {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewInv, setViewInv] = useState<Invoice | null>(null);
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editItems, setEditItems] = useState<InvoiceItem[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState<{ amount: number; method: PaymentMethod; note: string }>({
    amount: 0,
    method: 'cash',
    note: '',
  });
  const [paySaving, setPaySaving] = useState(false);

  const loadPayments = async (invId: string) => {
    try {
      const data = await store.loadInvoicePayments(invId);
      setPayments(data);
    } catch {
      setPayments([]);
    }
  };

  useEffect(() => {
    if (viewInv) loadPayments(viewInv.id);
  }, [viewInv]);

  const [selPatientId, setSelPatientId] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: uid(), serviceName: DENTAL_SERVICES[2].name, price: DENTAL_SERVICES[2].price, qty: 1 },
  ]);

  const subtotal = useMemo(() => items.reduce((s, it) => s + it.price * it.qty, 0), [items]);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const addItem = () => {
    const svc = DENTAL_SERVICES[0];
    setItems([...items, { id: uid(), serviceName: svc.name, price: svc.price, qty: 1 }]);
  };
  const removeItem = (id: string) => setItems(items.filter((it) => it.id !== id));
  const updateItem = (id: string, patch: Partial<InvoiceItem>) =>
    setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const openCreate = () => {
    setSelPatientId(store.patients[0]?.id ?? '');
    setItems([{ id: uid(), serviceName: DENTAL_SERVICES[2].name, price: DENTAL_SERVICES[2].price, qty: 1 }]);
    setModalOpen(true);
  };

  const saveInvoice = async () => {
    const patient = store.patients.find((p) => p.id === selPatientId);
    if (!patient) {
      toast('الرجاء اختيار مريض', 'error');
      return;
    }
    if (items.length === 0) {
      toast('أضف خدمة واحدة على الأقل', 'error');
      return;
    }
    try {
      const taxRate = (store.clinicSettings?.taxRate ?? 16) / 100;
      const inv = await store.addInvoice({
        patientId: patient.id,
        patientName: patient.fullName,
        items,
        taxRate,
      });
      toast('تم إنشاء الفاتورة بنجاح', 'success');
      setModalOpen(false);
      setViewInv(inv);
    } catch {
      toast('حدث خطأ أثناء إنشاء الفاتورة', 'error');
    }
  };

  const generateCliq = async (id: string) => {
    try {
      const link = await store.generateCliqLink(id);
      toast('تم إنشاء رابط الدفع CliQ', 'success');
      if (viewInv && viewInv.id === id) {
        setViewInv({ ...viewInv, cliqLink: link });
      }
    } catch {
      toast('حدث خطأ أثناء إنشاء الرابط', 'error');
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard?.writeText(link);
    toast('تم نسخ الرابط', 'info');
  };

  const totalRevenue = store.invoices.reduce((s, inv) => {
    const sub = inv.items.reduce((a, it) => a + it.price * it.qty, 0);
    return s + sub * (1 + inv.taxRate);
  }, 0);
  const activeLinks = store.invoices.filter((i) => i.cliqLink).length;
  const avgInvoice = store.invoices.length ? totalRevenue / store.invoices.length : 0;

  const openEdit = () => {
    if (!viewInv) return;
    setEditItems(viewInv.items.map((it) => ({ ...it })));
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!viewInv) return;
    if (editItems.length === 0) {
      toast('أضف خدمة واحدة على الأقل', 'error');
      return;
    }
    setEditSaving(true);
    try {
      await store.updateInvoice(viewInv.id, editItems);
      setViewInv({ ...viewInv, items: editItems });
      toast('تم تعديل الفاتورة', 'success');
      setEditOpen(false);
    } catch {
      toast('حدث خطأ أثناء التعديل', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const openPayment = () => {
    if (!viewInv) return;
    const sub = viewInv.items.reduce((a, it) => a + it.price * it.qty, 0);
    const grand = sub * (1 + viewInv.taxRate);
    const paid = payments.reduce((s, p) => s + p.amount, 0);
    const balance = grand - paid;
    setPayForm({ amount: balance, method: 'cash', note: '' });
    setPayOpen(true);
  };

  const savePayment = async () => {
    if (!viewInv) return;
    if (payForm.amount <= 0) {
      toast('الرجاء إدخال مبلغ صحيح', 'error');
      return;
    }
    setPaySaving(true);
    try {
      const p = await store.addInvoicePayment({
        invoiceId: viewInv.id,
        amount: payForm.amount,
        method: payForm.method,
        note: payForm.note.trim() || undefined,
      });
      setPayments((prev) => [p, ...prev]);
      toast('تم تسجيل الدفعة', 'success');
      setPayOpen(false);
    } catch {
      toast('حدث خطأ أثناء حفظ الدفعة', 'error');
    } finally {
      setPaySaving(false);
    }
  };

  const removePayment = async (id: string) => {
    try {
      await store.deleteInvoicePayment(id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
      toast('تم حذف الدفعة', 'success');
    } catch {
      toast('حدث خطأ', 'error');
    }
  };

  const exportPDF = () => {
    if (!viewInv) return;
    generateInvoicePDF(viewInv, payments);
    toast('تم تصدير الفاتورة PDF', 'success');
  };

  const handleDeleteInvoice = async () => {
    if (!viewInv) return;
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    try {
      await store.deleteInvoice(viewInv.id);
      toast('تم حذف الفاتورة', 'success');
      setViewInv(null);
    } catch {
      toast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  const filtered = useMemo(() => {
    let list = store.invoices;
    if (tab === 'paid') list = list.filter((i) => i.cliqLink);
    if (tab === 'pending') list = list.filter((i) => !i.cliqLink);
    const q = query.trim();
    if (q) list = list.filter((i) => i.id.includes(q) || i.patientName.includes(q));
    return list;
  }, [store.invoices, tab, query]);

  // Mini bar chart data
  const chartData = store.invoices.slice(-6).map((inv) => {
    const sub = inv.items.reduce((a, it) => a + it.price * it.qty, 0);
    return sub * (1 + inv.taxRate);
  });
  while (chartData.length < 6) chartData.unshift(0);
  const maxChart = Math.max(...chartData, 1);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-100 text-brand-700">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">إجمالي الفواتير</p>
            <p className="text-2xl font-extrabold text-slate-900">{store.invoices.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-success-100 text-success-700">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">إجمالي الإيرادات</p>
            <p className="text-xl font-extrabold text-slate-900">{formatJOD(totalRevenue)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-warning-100 text-warning-700">
            <Link2 size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">روابط CliQ نشطة</p>
            <p className="text-2xl font-extrabold text-slate-900">{activeLinks}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Table */}
        <div className="card lg:col-span-2">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
              {([['all', 'الكل'], ['paid', 'مدفوع'], ['pending', 'معلق']] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition-all ${
                    tab === k ? 'bg-white text-slate-900 shadow-elev-1' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-elev-1">
                <Search size={15} className="text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="بحث..."
                  className="w-28 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              <button onClick={openCreate} className="btn-accent">
                <Plus size={18} />
                فاتورة
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>المريض</th>
                  <th className="hidden md:table-cell">التاريخ</th>
                  <th>الإجمالي</th>
                  <th className="hidden sm:table-cell">الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const sub = inv.items.reduce((a, it) => a + it.price * it.qty, 0);
                  const grand = sub * (1 + inv.taxRate);
                  return (
                    <tr key={inv.id}>
                      <td>
                        <span className="font-mono text-sm font-bold text-brand-700">{inv.id}</span>
                      </td>
                      <td className="font-semibold text-slate-800">{inv.patientName}</td>
                      <td className="hidden md:table-cell text-xs text-slate-500">{dateStr(inv.createdAt)}</td>
                      <td className="font-bold text-slate-800">{formatJOD(grand)}</td>
                      <td className="hidden sm:table-cell">
                        {inv.cliqLink ? (
                          <span className="badge bg-success-50 text-success-700">
                            <Link2 size={11} /> مدفوع
                          </span>
                        ) : (
                          <span className="badge bg-warning-50 text-warning-700">
                            <Clock size={11} /> معلق
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => setViewInv(inv)}
                          className="btn-icon"
                          aria-label="عرض"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      لا توجد فواتير مطابقة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          {/* Chart */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-600" />
                <h3 className="text-base font-bold text-slate-900">آخر الفواتير</h3>
              </div>
            </div>
            <div className="flex h-40 items-end justify-between gap-2">
              {chartData.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full animate-grow-bar rounded-t-md bg-gradient-to-t from-brand-500 to-accent-400 transition-all duration-500 hover:from-brand-600 hover:to-accent-500"
                    style={{ height: `${(v / maxChart) * 100}%`, minHeight: v > 0 ? 8 : 2 }}
                    title={formatJOD(v)}
                  />
                  <span className="text-[10px] text-slate-400">#{i + 1}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500">متوسط الفاتورة</span>
              <span className="text-sm font-bold text-brand-700">{formatJOD(avgInvoice)}</span>
            </div>
          </div>

          {/* Quick action */}
          <div className="card bg-gradient-to-br from-brand-600 to-accent-700 p-6 text-white">
            <Receipt size={28} className="mb-3 opacity-90" />
            <h3 className="text-lg font-bold">أنشئ فاتورة جديدة</h3>
            <p className="mt-1 text-sm text-brand-100/80">
              فاتورة متوافقة مع ضريبة المبيعات 16% مع إمكانية إرسال رابط دفع CliQ للمريض.
            </p>
            <button
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/25"
            >
              <Plus size={16} />
              فاتورة جديدة
            </button>
          </div>
        </div>
      </div>

      {/* Create modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="فاتورة جديدة"
        subtitle="ضريبة المبيعات 16% تُحسب تلقائياً"
        maxWidth="max-w-2xl"
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="label !mb-0">الخدمات</label>
              <button onClick={addItem} className="btn-ghost text-brand-600">
                <Plus size={16} />
                إضافة خدمة
              </button>
            </div>
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="flex items-end gap-2 rounded-md border border-slate-200 p-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-slate-500">الخدمة</label>
                    <select
                      className="input !py-2.5 text-sm"
                      value={it.serviceName}
                      onChange={(e) => {
                        const svc = DENTAL_SERVICES.find((s) => s.name === e.target.value);
                        updateItem(it.id, { serviceName: e.target.value, price: svc?.price ?? it.price });
                      }}
                    >
                      {DENTAL_SERVICES.map((s) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="mb-1 block text-xs text-slate-500">السعر</label>
                    <input
                      type="number"
                      className="input !py-2.5 text-sm"
                      value={it.price}
                      min={0}
                      onChange={(e) => updateItem(it.id, { price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="w-20">
                    <label className="mb-1 block text-xs text-slate-500">الكمية</label>
                    <input
                      type="number"
                      className="input !py-2.5 text-sm"
                      value={it.qty}
                      min={1}
                      onChange={(e) => updateItem(it.id, { qty: Math.max(1, Number(e.target.value)) })}
                    />
                  </div>
                  <button
                    onClick={() => removeItem(it.id)}
                    className="rounded-sm p-2.5 text-slate-400 transition-colors hover:bg-error-50 hover:text-error-600"
                    aria-label="حذف"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md bg-slate-50 p-4">
            <div className="flex justify-between py-1 text-sm text-slate-600">
              <span>المجموع الفرعي</span>
              <span className="font-semibold">{formatJOD(subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 text-sm text-slate-600">
              <span>ضريبة المبيعات (16%)</span>
              <span className="font-semibold">{formatJOD(tax)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base">
              <span className="font-bold text-slate-800">الإجمالي</span>
              <span className="font-bold text-brand-700">{formatJOD(total)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={saveInvoice} className="btn-accent flex-1">
              <CheckCircle2 size={20} />
              حفظ الفاتورة
            </button>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">إلغاء</button>
          </div>
        </div>
      </Modal>

      {/* View modal */}
      <Modal
        open={!!viewInv}
        onClose={() => setViewInv(null)}
        title={`فاتورة ${viewInv?.id ?? ''}`}
        subtitle={viewInv?.patientName}
        maxWidth="max-w-lg"
      >
        {viewInv && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-500">تاريخ الإصدار</span>
              <span className="font-semibold text-slate-800">{dateStr(viewInv.createdAt)}</span>
            </div>

            <div className="overflow-hidden rounded-md border border-slate-200">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">الخدمة</th>
                    <th className="px-4 py-2.5 font-semibold">السعر</th>
                    <th className="px-4 py-2.5 font-semibold">الكمية</th>
                    <th className="px-4 py-2.5 font-semibold">المجموع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewInv.items.map((it) => (
                    <tr key={it.id}>
                      <td className="px-4 py-2.5 font-medium text-slate-700">{it.serviceName}</td>
                      <td className="px-4 py-2.5 text-slate-600">{formatJOD(it.price)}</td>
                      <td className="px-4 py-2.5 text-slate-600">{it.qty}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-700">{formatJOD(it.price * it.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals with payments */}
            {(() => {
              const sub = viewInv.items.reduce((a, it) => a + it.price * it.qty, 0);
              const t = sub * 0.16;
              const g = sub + t;
              const paid = payments.reduce((s, p) => s + p.amount, 0);
              const balance = g - paid;
              return (
                <div className="rounded-md bg-slate-50 p-4">
                  <div className="flex justify-between py-1 text-sm text-slate-600">
                    <span>المجموع الفرعي</span><span className="font-semibold">{formatJOD(sub)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-sm text-slate-600">
                    <span>ضريبة المبيعات (16%)</span><span className="font-semibold">{formatJOD(t)}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                    <span className="font-bold text-slate-800">الإجمالي</span>
                    <span className="font-bold text-brand-700">{formatJOD(g)}</span>
                  </div>
                  {paid > 0 && (
                    <>
                      <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-sm">
                        <span className="text-success-600">المدفوع</span>
                        <span className="font-semibold text-success-700">{formatJOD(paid)}</span>
                      </div>
                      <div className="flex justify-between py-1 text-sm">
                        <span className="font-bold text-error-600">المتبقي</span>
                        <span className="font-bold text-error-700">{formatJOD(balance)}</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Payments list */}
            {payments.length > 0 && (
              <div className="rounded-md border border-slate-200 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CreditCard size={16} className="text-brand-500" />
                  <p className="text-sm font-semibold text-slate-700">سجل الدفعات ({payments.length})</p>
                </div>
                <div className="space-y-1.5">
                  {payments.map((p) => {
                    const st = PAYMENT_METHOD_STYLES[p.method];
                    return (
                      <div key={p.id} className="flex items-center justify-between rounded-sm bg-slate-50 px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`badge ${st.badge}`}>{PAYMENT_METHOD_LABELS[p.method]}</span>
                          <span className="text-slate-600">{formatJOD(p.amount)}</span>
                          {p.note && <span className="text-xs text-slate-400">— {p.note}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{dateStr(p.createdAt)}</span>
                          <button
                            onClick={() => removePayment(p.id)}
                            className="rounded p-1 text-slate-400 hover:bg-error-50 hover:text-error-600"
                            aria-label="حذف"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CliQ */}
            <div className="rounded-md border border-slate-200 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Receipt size={18} className="text-brand-500" />
                <p className="text-sm font-semibold text-slate-700">رابط الدفع CliQ</p>
              </div>
              {viewInv.cliqLink ? (
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    dir="ltr"
                    value={viewInv.cliqLink}
                    className="input !py-2.5 text-sm"
                  />
                  <button onClick={() => copyLink(viewInv.cliqLink!)} className="btn-secondary !px-3">
                    <Copy size={16} />
                  </button>
                </div>
              ) : (
                <button onClick={() => generateCliq(viewInv.id)} className="btn-accent w-full">
                  <Link2 size={18} />
                  إنشاء رابط دفع CliQ
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={exportPDF} className="btn-accent flex-1">
                <Download size={18} />
                تصدير PDF
              </button>
              <button onClick={openPayment} className="btn-secondary flex-1">
                <CreditCard size={18} />
                تسجيل دفعة
              </button>
              <button onClick={openEdit} className="btn-secondary flex-1">
                <Pencil size={18} />
                تعديل
              </button>
            </div>
            <button onClick={handleDeleteInvoice} className="btn-danger w-full">
              <Trash2 size={18} />
              حذف الفاتورة
            </button>
          </div>
        )}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={editOpen}
        onClose={() => !editSaving && setEditOpen(false)}
        title="تعديل الفاتورة"
        subtitle={viewInv?.id}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3">
          {editItems.map((it, i) => (
            <div key={i} className="flex items-end gap-2 rounded-md border border-slate-200 p-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-slate-500">الخدمة</label>
                <select
                  className="input !py-2.5 text-sm"
                  value={it.serviceName}
                  onChange={(e) => {
                    const svc = DENTAL_SERVICES.find((s) => s.name === e.target.value);
                    setEditItems(editItems.map((x, idx) =>
                      idx === i ? { ...x, serviceName: e.target.value, price: svc?.price ?? x.price } : x,
                    ));
                  }}
                >
                  {DENTAL_SERVICES.map((s) => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="mb-1 block text-xs text-slate-500">السعر</label>
                <input
                  type="number"
                  className="input !py-2.5 text-sm"
                  value={it.price}
                  min={0}
                  onChange={(e) => setEditItems(editItems.map((x, idx) =>
                    idx === i ? { ...x, price: Number(e.target.value) } : x,
                  ))}
                />
              </div>
              <div className="w-20">
                <label className="mb-1 block text-xs text-slate-500">الكمية</label>
                <input
                  type="number"
                  className="input !py-2.5 text-sm"
                  value={it.qty}
                  min={1}
                  onChange={(e) => setEditItems(editItems.map((x, idx) =>
                    idx === i ? { ...x, qty: Math.max(1, Number(e.target.value)) } : x,
                  ))}
                />
              </div>
              <button
                onClick={() => setEditItems(editItems.filter((_, idx) => idx !== i))}
                className="rounded-sm p-2.5 text-slate-400 hover:bg-error-50 hover:text-error-600"
                aria-label="حذف"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const svc = DENTAL_SERVICES[0];
              setEditItems([...editItems, { id: uid(), serviceName: svc.name, price: svc.price, qty: 1 }]);
            }}
            className="btn-ghost text-brand-600"
          >
            <Plus size={16} />
            إضافة خدمة
          </button>
          <div className="flex gap-3 pt-2">
            <button onClick={saveEdit} disabled={editSaving} className="btn-accent flex-1">
              {editSaving ? <Clock size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
              حفظ التعديلات
            </button>
            <button onClick={() => setEditOpen(false)} disabled={editSaving} className="btn-secondary">إلغاء</button>
          </div>
        </div>
      </Modal>

      {/* Payment modal */}
      <Modal
        open={payOpen}
        onClose={() => !paySaving && setPayOpen(false)}
        title="تسجيل دفعة"
        subtitle={viewInv?.id}
      >
        <div className="space-y-4">
          <div>
            <label className="label">المبلغ (د.أ)</label>
            <input
              type="number"
              min={0}
              className="input"
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">طريقة الدفع</label>
            <div className="grid grid-cols-4 gap-2">
              {(['cash', 'card', 'cliq', 'transfer'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayForm({ ...payForm, method: m })}
                  className={`rounded-md border-2 px-2 py-2.5 text-xs font-semibold transition-all ${
                    payForm.method === m
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {PAYMENT_METHOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">ملاحظة (اختياري)</label>
            <input
              className="input"
              value={payForm.note}
              onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
              placeholder="رقم مرجعي، تحويل بنكي..."
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={savePayment} disabled={paySaving} className="btn-accent flex-1">
              {paySaving ? <Clock size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
              {paySaving ? 'جارٍ الحفظ...' : 'تأكيد الدفعة'}
            </button>
            <button onClick={() => setPayOpen(false)} disabled={paySaving} className="btn-secondary">إلغاء</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
