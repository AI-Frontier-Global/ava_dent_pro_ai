import { useEffect, useState, useRef, useMemo } from 'react';
import { Menu, Search, Bell, ChevronDown, Plus, Command, Brain, X, User, Receipt, Calendar, ArrowRight } from 'lucide-react';
import { getStatus } from '../lib/ollamaBridge';
import { supabase } from '../lib/supabase';
import type { Store } from '../store';
import type { Patient, Invoice, Appointment } from '../types';

type Props = {
  title: string;
  subtitle?: string;
  onOpenMobile: () => void;
  onNavigateSettings?: () => void;
  onNavigatePatient?: (id: string) => void;
  onNavigateInvoice?: (id: string) => void;
  onNavigateAppointment?: () => void;
  store: Store;
};

type Result =
  | { type: 'patient'; id: string; label: string; sub: string; icon: typeof User }
  | { type: 'invoice'; id: string; label: string; sub: string; icon: typeof Receipt }
  | { type: 'appointment'; id: string; label: string; sub: string; icon: typeof Calendar };

export default function Topbar({ title, subtitle, onOpenMobile, onNavigateSettings, onNavigatePatient, onNavigateInvoice, onNavigateAppointment, store }: Props) {
  const [bridgeOnline, setBridgeOnline] = useState<boolean | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data } = await supabase
        .from('clinic_ai_settings')
        .select('bridge_url')
        .eq('id', 1)
        .maybeSingle();
      const url = data?.bridge_url || 'http://localhost:3001';
      const s = await getStatus(url);
      if (active) setBridgeOnline(s ? s.bridge === 'online' && s.ollama : false);
    };
    check();
    const id = setInterval(check, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setActiveIdx(0);
    }
  }, [searchOpen]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    const out: Result[] = [];
    store.patients.forEach((p: Patient) => {
      if (p.fullName.toLowerCase().includes(q) || p.phone.includes(q)) {
        out.push({ type: 'patient', id: p.id, label: p.fullName, sub: p.phone, icon: User });
      }
    });
    store.invoices.forEach((inv: Invoice) => {
      if (inv.id.toLowerCase().includes(q) || inv.patientName.toLowerCase().includes(q)) {
        const total = inv.items.reduce((s, it) => s + it.price * it.qty, 0) * (1 + inv.taxRate);
        out.push({ type: 'invoice', id: inv.id, label: `فاتورة ${inv.id}`, sub: `${inv.patientName} — ${total.toFixed(2)} د.أ`, icon: Receipt });
      }
    });
    store.appointments.forEach((a: Appointment) => {
      if (a.patientName.toLowerCase().includes(q) || (a.reason ?? '').toLowerCase().includes(q)) {
        out.push({ type: 'appointment', id: a.id, label: a.patientName, sub: `${a.reason} — الساعة ${a.startHour}:00`, icon: Calendar });
      }
    });
    return out.slice(0, 8);
  }, [query, store.patients, store.invoices, store.appointments]);

  useEffect(() => {
    setActiveIdx(0);
  }, [results.length]);

  const pickResult = (r: Result) => {
    setSearchOpen(false);
    if (r.type === 'patient' && onNavigatePatient) onNavigatePatient(r.id);
    if (r.type === 'invoice' && onNavigateInvoice) onNavigateInvoice(r.id);
    if (r.type === 'appointment' && onNavigateAppointment) onNavigateAppointment();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIdx]) {
      pickResult(results[activeIdx]);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-sticky border-b border-slate-200/60 bg-white/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="flex h-[68px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={onOpenMobile}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="فتح القائمة"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
              {subtitle && <p className="hidden truncate text-xs text-slate-500 sm:block">{subtitle}</p>}
            </div>
          </div>

          <div className="hidden flex-1 justify-center md:flex">
            <button
              onClick={() => setSearchOpen(true)}
              className="group flex w-full max-w-sm items-center gap-2.5 rounded-md border border-slate-200 bg-slate-50/80 px-4 py-2 text-right text-sm text-slate-400 transition-all duration-sm ease-smooth hover:border-slate-300 hover:bg-white"
            >
              <Search size={16} className="text-slate-400" />
              <span className="flex-1 text-right">بحث سريع...</span>
              <kbd className="hidden items-center gap-0.5 rounded-xs border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 lg:inline-flex">
                <Command size={10} />K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateSettings}
              title={bridgeOnline ? 'المساعد الذكي المحلي: متصل' : 'المساعد الذكي المحلي: غير متصل — اضغط للإعداد'}
              className={`group relative flex items-center gap-2 rounded-md border px-3 py-2 transition-all duration-sm ease-smooth ${
                bridgeOnline
                  ? 'border-success-200 bg-success-50 text-success-700 hover:bg-success-100'
                  : 'border-warning-200 bg-warning-50 text-warning-700 hover:bg-warning-100'
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                {bridgeOnline && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${bridgeOnline ? 'bg-success-500' : 'bg-warning-500'}`}></span>
              </span>
              <Brain size={16} className={bridgeOnline ? 'text-success-600' : 'text-warning-600'} />
              <span className="hidden text-xs font-semibold sm:inline">
                {bridgeOnline ? 'المساعد متصل' : 'تفعيل المساعد'}
              </span>
            </button>

            <button className="btn-primary hidden sm:inline-flex">
              <Plus size={16} />
              جديد
            </button>
            <button className="btn-icon relative border border-slate-200 bg-white">
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error-500 ring-2 ring-white" />
            </button>
            <button className="flex items-center gap-2 rounded-md border border-slate-200 bg-white py-1.5 pl-2 pr-1.5 transition-colors duration-sm hover:bg-slate-50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-600 text-sm font-bold text-white">
                ر
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-xs font-bold text-slate-800">رنا العبدالله</p>
                <p className="text-[10px] text-slate-500">موظفة استقبال</p>
              </div>
              <ChevronDown size={15} className="text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-xl animate-modal-in">
            <div className="card overflow-hidden" style={{ boxShadow: 'var(--elev-5)' }}>
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <Search size={20} className="text-slate-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="ابحث عن مريض، فاتورة، أو موعد..."
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
                <button onClick={() => setSearchOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto">
                {results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search size={28} className="mb-2 text-slate-300" />
                    <p className="text-sm text-slate-400">
                      {query.length < 2 ? 'اكتب حرفين على الأقل للبحث' : 'لا توجد نتائج مطابقة'}
                    </p>
                  </div>
                ) : (
                  <div className="py-2">
                    {results.map((r, i) => {
                      const Icon = r.icon;
                      const typeLabel = r.type === 'patient' ? 'مريض' : r.type === 'invoice' ? 'فاتورة' : 'موعد';
                      return (
                        <button
                          key={`${r.type}-${r.id}`}
                          onClick={() => pickResult(r)}
                          onMouseEnter={() => setActiveIdx(i)}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-right transition-colors ${
                            i === activeIdx ? 'bg-brand-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className={`flex h-9 w-9 items-center justify-center rounded-md ${i === activeIdx ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-500'}`}>
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">{r.label}</p>
                            <p className="truncate text-xs text-slate-500" dir="ltr">{r.sub}</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            {typeLabel}
                          </span>
                          <ArrowRight size={14} className="text-slate-300" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">
                <span>استخدم الأسهم للتنقل، Enter للاختيار</span>
                <span>Esc للإغلاق</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
