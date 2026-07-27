import { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Clock,
  Percent,
  Bell,
  Save,
  Globe,
  Palette,
  Shield,
  Check,
  CreditCard,
  MessageSquare,
  Receipt,
  Brain,
  Loader2,
  RefreshCw,
  Download,
  Trash2,
  Star,
  Play,
  Square,
  Send,
  ChevronDown,
  Server,
  Cpu,
  AlertCircle,
  CircleDot,
  BookOpen,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { resetSetup } from '../lib/bridge-manager';
import type { Store } from '../store';
import type { ClinicSettings } from '../types';
import {
  getStatus,
  getModels,
  deleteModel,
  chat as bridgeChat,
  startService,
  stopService,
  pullModel,
  type BridgeModel,
} from '../lib/ollamaBridge';

type Tab = 'clinic' | 'hours' | 'finance' | 'notifications' | 'integrations' | 'ai';

const tabs: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: 'clinic', label: 'معلومات العيادة', icon: Building2 },
  { id: 'hours', label: 'ساعات العمل', icon: Clock },
  { id: 'finance', label: 'المالية', icon: Percent },
  { id: 'notifications', label: 'الإشعارات', icon: Bell },
  { id: 'integrations', label: 'التكاملات', icon: Globe },
  { id: 'ai', label: 'إدارة الذكاء الاصطناعي المحلي (Ollama)', icon: Brain },
];

const DEFAULT_SYSTEM_PROMPT =
  'أنت مساعد طبي متخصص في إدارة عيادات الأسنان في الأردن، تجيب باختصار ووضوح.';

const AVAILABLE_MODELS = [
  { name: 'llama3.2', desc: 'نموذج متوازن من Meta — جيد للأسئلة العامة' },
  { name: 'phi3', desc: 'نموذج صغير وسريع من Microsoft' },
  { name: 'gemma:2b', desc: 'نموذج خفيف من Google' },
  { name: 'llama3.1', desc: 'إصدار أكبر وأكثر دقة' },
  { name: 'mistral', desc: 'نموذج Mistral مفتوح المصدر' },
  { name: 'qwen2.5', desc: 'نموذج يدعم العربية بشكل ممتاز' },
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${on ? 'bg-brand-500' : 'bg-slate-300'}`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${on ? 'right-0.5' : 'right-5'}`}
      />
    </button>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[200px_1fr] sm:items-start">
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function AISettingsPanel() {
  const toast = useToast();
  const [settings, setSettings] = useState<{
    enabled: boolean;
    bridge_url: string;
    model: string;
    system_prompt: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // التكاملات
  const [cliqEnabled, setCliqEnabled] = useState(true);
  const [jofotaraEnabled, setJofotaraEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  // حالة الجسر
  const [status, setStatus] = useState<{ bridge: 'online' | 'offline'; ollama: boolean; tunnelUrl?: string | null } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // النماذج
  const [models, setModels] = useState<BridgeModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [defaultModel, setDefaultModel] = useState<string>('');

  // تحميل نموذج
  const [showPullModal, setShowPullModal] = useState(false);
  const [pullModelName, setPullModelName] = useState('llama3.2');
  const [pulling, setPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState<string>('');
  const pullAbortRef = useRef<AbortController | null>(null);

  // خدمة
  const [serviceBusy, setServiceBusy] = useState(false);

  // اختبار المحادثة
  const [testMessages, setTestMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [testInput, setTestInput] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  // دليل التفعيل
  const [guideOpen, setGuideOpen] = useState(false);

  const bridgeUrl = settings?.bridge_url || 'http://localhost:3001';

  // تحميل الإعدادات من Supabase
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/clinic_ai_settings?id=eq.1`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        });
        if (!res.ok) throw new Error('فشل تحميل الإعدادات');
        const data = await res.json();
        if (data && data.length > 0) {
          setSettings(data[0]);
          setDefaultModel(data[0].model || 'llama3.2');
        }
      } catch {
        toast('تعذر تحميل إعدادات المساعد الذكي', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // فحص الحالة تلقائياً بعد تحميل الإعدادات
  useEffect(() => {
    if (settings) refreshStatus();
  }, [settings]);

  async function refreshStatus() {
    setStatusLoading(true);
    const s = await getStatus(bridgeUrl);
    setStatus(s ? { bridge: s.bridge, ollama: s.ollama, tunnelUrl: s.tunnelUrl } : { bridge: 'offline', ollama: false });
    setStatusLoading(false);
    if (s && s.bridge === 'online') refreshModels();
  }

  async function refreshModels() {
    setModelsLoading(true);
    const list = await getModels(bridgeUrl);
    setModels(list || []);
    setModelsLoading(false);
  }

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/clinic_ai_settings?id=eq.1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          enabled: settings.enabled,
          bridge_url: settings.bridge_url,
          model: settings.model,
          system_prompt: settings.system_prompt,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('فشل الحفظ');
      toast('تم حفظ إعدادات المساعد الذكي', 'success');
    } catch {
      toast('تعذر حفظ الإعدادات', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteModel(name: string) {
    if (!confirm(`حذف النموذج "${name}"؟`)) return;
    const ok = await deleteModel(bridgeUrl, name);
    if (ok) {
      toast(`تم حذف ${name}`, 'success');
      refreshModels();
    } else {
      toast('تعذر حذف النموذج', 'error');
    }
  }

  async function handleSetDefault(name: string) {
    setDefaultModel(name);
    setSettings((s) => (s ? { ...s, model: name } : s));
    toast(`تم تعيين ${name} كنموذج افتراضي`, 'success');
  }

  async function handlePull() {
    setPulling(true);
    setPullProgress('جاري التحضير...');
    const controller = new AbortController();
    pullAbortRef.current = controller;
    const ok = await pullModel(
      bridgeUrl,
      pullModelName,
      (u) => {
        if (u.status === 'success') setPullProgress('تم التحميل بنجاح');
        else if (u.status === 'error') setPullProgress(`خطأ: ${u.message || ''}`);
        else if (u.total && u.completed) {
          const pct = Math.round((u.completed / u.total) * 100);
          setPullProgress(`جاري التحميل... ${pct}%`);
        } else setPullProgress(u.message || u.status || 'جاري التحميل...');
      },
      controller.signal,
    );
    setPulling(false);
    if (ok) {
      toast(`تم تحميل ${pullModelName} بنجاح`, 'success');
      setShowPullModal(false);
      refreshModels();
    } else if (!controller.signal.aborted) {
      toast('فشل تحميل النموذج', 'error');
    }
  }

  async function handleService(action: 'start' | 'stop') {
    setServiceBusy(true);
    const ok = action === 'start' ? await startService(bridgeUrl) : await stopService(bridgeUrl);
    setServiceBusy(false);
    if (ok) {
      toast(action === 'start' ? 'تم تشغيل خدمة Ollama' : 'تم إيقاف خدمة Ollama', 'success');
      refreshStatus();
    } else {
      toast('تعذر تغيير حالة الخدمة', 'error');
    }
  }

  async function handleTestSend() {
    const content = testInput.trim();
    if (!content) return;
    setTestMessages((m) => [...m, { sender: 'user', text: content }]);
    setTestInput('');
    setTestLoading(true);
    const reply = await bridgeChat(
      bridgeUrl,
      content,
      testMessages
        .slice(-8)
        .map((m) => ({ role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.text })),
      defaultModel,
    );
    setTestLoading(false);
    if (reply) {
      setTestMessages((m) => [...m, { sender: 'ai', text: reply }]);
    } else {
      setTestMessages((m) => [
        ...m,
        { sender: 'ai', text: 'تعذر الاتصال بالجسر المحلي. تأكد من تشغيل bridge.js.' },
      ]);
    }
  }

  if (loading) {
    return (
      <section className="card p-6">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          <span>جاري تحميل الإعدادات...</span>
        </div>
      </section>
    );
  }

  if (!settings) {
    return (
      <section className="card p-6">
        <p className="text-sm text-error-600">تعذر تحميل إعدادات المساعد الذكي.</p>
      </section>
    );
  }

  const bridgeOnline = status?.bridge === 'online';
  const ollamaOnline = status?.ollama;

  return (
    <div className="space-y-6">
      {/* ============ زر التحميل والتفعيل بنقرة واحدة ============ */}
      <section className="card overflow-hidden border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-sky-50">
        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-brand-500 text-white shadow-elev-2 shadow-brand-200">
              <Download size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">تحميل وتفعيل النظام تلقائياً (بنقرة واحدة)</h3>
              <p className="text-xs text-slate-500">حمّل الملفين على كمبيوتر العيادة واضغط دبل-كليك على setup-bridge.bat</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => window.open('/bridge/setup-bridge.bat', '_blank')}
              className="group flex items-center gap-3 rounded-md bg-slate-900 px-4 py-3.5 text-white transition-all hover:bg-slate-800 hover:shadow-elev-2"
            >
              <Download size={20} className="text-brand-400 transition-transform group-hover:translate-y-0.5" />
              <div className="text-right">
                <p className="text-sm font-bold">setup-bridge.bat</p>
                <p className="text-xs text-slate-400">ملف التفعيل التلقائي</p>
              </div>
            </button>
            <button
              onClick={() => window.open('/bridge/local-ollama-bridge.js', '_blank')}
              className="group flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3.5 text-slate-700 transition-all hover:bg-slate-50 hover:shadow-md"
            >
              <Download size={20} className="text-slate-400 transition-transform group-hover:translate-y-0.5" />
              <div className="text-right">
                <p className="text-sm font-bold" dir="ltr">local-ollama-bridge.js</p>
                <p className="text-xs text-slate-400">كود الجسر المحلي</p>
              </div>
            </button>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-md bg-white/60 border border-brand-100 p-3 text-xs text-slate-600">
            <Check size={14} className="mt-0.5 shrink-0 text-brand-500" />
            <span>حمّل الملفين في نفس المجلد على كمبيوتر العيادة، ثم اضغط دبل-كليك على <strong dir="ltr" className="font-mono">setup-bridge.bat</strong>. السكربت سيثبّت Node.js و Ollama تلقائياً (إن لم يكونا مثبتين)، يثبّت الحزم، يشغّل الجسر، ويضيفه لبدء التشغيل التلقائي.</span>
          </div>
        </div>
      </section>

      {/* ============ دليل التفعيل لمرة واحدة ============ */}
      <section className="card overflow-hidden">
        <button
          onClick={() => setGuideOpen((v) => !v)}
          className="flex w-full items-center justify-between p-5 text-right transition-colors hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-100 text-sky-600">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">دليل التفعيل لمرة واحدة</h3>
              <p className="text-xs text-slate-500">خطوات إعداد الجسر المحلي على كمبيوتر العيادة</p>
            </div>
          </div>
          <ChevronDown
            size={20}
            className={`text-slate-400 transition-transform ${guideOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {guideOpen && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-5">
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">1</span>
                <span>ثبّت <strong>Ollama</strong> من <span dir="ltr" className="font-mono text-sky-600">ollama.com</span> على كمبيوتر العيادة.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">2</span>
                <span>ثبّت <strong>Node.js</strong> من <span dir="ltr" className="font-mono text-sky-600">nodejs.org</span> (نسخة LTS).</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">3</span>
                <span>أنشئ مجلداً جديداً على كمبيوتر العيادة، وانسخ كود <strong>الجسر المحلي</strong> من ملف <span dir="ltr" className="font-mono text-sky-600">local-ollama-bridge.js</span> المرفق مع النظام واحفظه باسم <span dir="ltr" className="font-mono text-sky-600">bridge.js</span>.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">4</span>
                <span>افتح موجه الأوامر (Command Prompt) في نفس المجلد ونفّذ:</span>
              </li>
              <li className="pr-9">
                <div dir="ltr" className="rounded-sm bg-slate-900 px-4 py-2.5 font-mono text-xs text-success-300">
                  npm install express cors
                </div>
                <div dir="ltr" className="mt-1.5 rounded-sm bg-slate-900 px-4 py-2.5 font-mono text-xs text-success-300">
                  node bridge.js
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">5</span>
                <span>اترك نافذة موجه الأوامر مفتوحة، ثم عد إلى النظام هنا واضغط <strong>"تحديث الحالة"</strong>.</span>
              </li>
            </ol>
          </div>
        )}
      </section>

      {/* ============ إعادة ضبط التثبيت ============ */}
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-error-100 text-error-600">
              <RefreshCw size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">إعادة ضبط التثبيت الأولي</h3>
              <p className="text-xs text-slate-500">إظهار معالج التثبيت مرة أخرى عند الدخول التالي</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetSetup();
              toast('تم إعادة ضبط التثبيت — سيظهر المعالج في الدخول التالي', 'success');
            }}
            className="btn-ghost text-xs text-error-600 hover:bg-error-50"
          >
            <RefreshCw size={14} />
            إعادة الضبط
          </button>
        </div>
      </section>

      {/* ============ مؤشر الحالة ============ */}
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-100 text-brand-600">
              <Server size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">حالة الجسر المحلي</h3>
              <p className="text-xs text-slate-500">الاتصال بالجسر وخادم Ollama</p>
            </div>
          </div>
          <button
            onClick={refreshStatus}
            disabled={statusLoading}
            className="btn-ghost text-xs"
          >
            <RefreshCw size={14} className={statusLoading ? 'animate-spin' : ''} />
            تحديث الحالة
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={`flex items-center gap-3 rounded-md border p-4 ${bridgeOnline ? 'border-success-200 bg-success-50' : 'border-error-200 bg-error-50'}`}>
            <span className={`relative flex h-3 w-3 ${bridgeOnline ? '' : ''}`}>
              {bridgeOnline && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75"></span>}
              <span className={`relative inline-flex h-3 w-3 rounded-full ${bridgeOnline ? 'bg-success-500' : 'bg-error-500'}`}></span>
            </span>
            <div>
              <p className={`text-sm font-bold ${bridgeOnline ? 'text-success-700' : 'text-error-700'}`}>
                {bridgeOnline ? 'الجسر متصل' : 'الجسر غير متصل'}
              </p>
              <p className="text-xs text-slate-500" dir="ltr">{bridgeUrl}</p>
            </div>
          </div>

          <div className={`flex items-center gap-3 rounded-md border p-4 ${ollamaOnline ? 'border-success-200 bg-success-50' : 'border-warning-200 bg-warning-50'}`}>
            <CircleDot size={16} className={ollamaOnline ? 'text-success-500' : 'text-warning-500'} />
            <div>
              <p className={`text-sm font-bold ${ollamaOnline ? 'text-success-700' : 'text-warning-700'}`}>
                {ollamaOnline ? 'Ollama يعمل' : 'Ollama متوقف'}
              </p>
              <p className="text-xs text-slate-500">خادم النماذج المحلي</p>
            </div>
          </div>
        </div>

        {!bridgeOnline && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-warning-50 border border-warning-200 p-3 text-xs text-warning-800">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>الجسر المحلي غير متصل. شغّل <span dir="ltr" className="font-mono">node bridge.js</span> على كمبيوتر العيادة، ثم اضغط "تحديث الحالة".</span>
          </div>
        )}

        {bridgeOnline && status?.tunnelUrl && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-sky-50 border border-sky-200 p-3 text-xs text-sky-800">
            <Globe size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold mb-1">نفق عام HTTPS نشط — يعمل من أي مكان!</p>
              <p className="mb-2">عنوان النفق: <code dir="ltr" className="font-mono bg-sky-100 px-1.5 py-0.5 rounded">{status.tunnelUrl}</code></p>
              <button
                onClick={() => {
                  setSettings((s) => (s ? { ...s, bridge_url: status.tunnelUrl! } : s));
                  toast('تم تعيين عنوان النفق كعنوان الجسر — احفظ الإعدادات', 'success');
                }}
                className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700"
              >
                استخدم عنوان النفق
              </button>
            </div>
          </div>
        )}

        {bridgeOnline && !status?.tunnelUrl && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>الجسر متصل محلياً فقط. للوصول من خارج العيادة (من bolt.host أو أي جهاز)، شغّل الجسر وسيتنشأ نفق HTTPS تلقائياً. تأكد من تثبيت <span dir="ltr" className="font-mono">localtunnel</span>.</span>
          </div>
        )}
      </section>

      {/* ============ إدارة النماذج ============ */}
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
              <Cpu size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">إدارة النماذج</h3>
              <p className="text-xs text-slate-500">النماذج المحملة على خادم Ollama</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={refreshModels} disabled={modelsLoading} className="btn-ghost text-xs">
              <RefreshCw size={14} className={modelsLoading ? 'animate-spin' : ''} />
              تحديث القائمة
            </button>
            <button
              onClick={() => setShowPullModal(true)}
              disabled={!bridgeOnline}
              className="btn-accent text-xs disabled:opacity-50"
            >
              <Download size={14} />
              تحميل نموذج جديد
            </button>
          </div>
        </div>

        {modelsLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            جاري جلب قائمة النماذج...
          </div>
        ) : models.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 p-8 text-center">
            <Cpu size={28} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-500">لا توجد نماذج محملة.</p>
            <p className="text-xs text-slate-400">اضغط "تحميل نموذج جديد" لإضافة نموذج.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {models.map((m) => (
              <div
                key={m.name}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <Cpu size={18} className="text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800" dir="ltr">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.size} {m.modified && `· ${m.modified}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {defaultModel === m.name && (
                    <span className="chip bg-warning-100 text-warning-700">
                      <Star size={12} className="fill-warning-500 text-warning-500" />
                      افتراضي
                    </span>
                  )}
                  {defaultModel !== m.name && (
                    <button
                      onClick={() => handleSetDefault(m.name)}
                      className="btn-ghost text-xs"
                      title="تعيين كنموذج افتراضي"
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteModel(m.name)}
                    className="btn-ghost text-xs text-error-500 hover:bg-error-50"
                    title="حذف النموذج"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============ التحكم في الخدمة ============ */}
      <section className="card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <Play size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">التحكم في الخدمة</h3>
            <p className="text-xs text-slate-500">تشغيل وإيقاف خادم Ollama</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleService('start')}
            disabled={serviceBusy || !bridgeOnline}
            className="btn-success text-sm disabled:opacity-50"
          >
            {serviceBusy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            تشغيل خدمة Ollama
          </button>
          <button
            onClick={() => handleService('stop')}
            disabled={serviceBusy || !bridgeOnline}
            className="btn-danger text-sm disabled:opacity-50"
          >
            {serviceBusy ? <Loader2 size={16} className="animate-spin" /> : <Square size={16} />}
            إيقاف الخدمة
          </button>
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5">
            <Server size={14} className="text-slate-400" />
            <span className="text-xs text-slate-500">عنوان الجسر:</span>
            <input
              dir="ltr"
              className="bg-transparent font-mono text-xs text-slate-700 outline-none"
              value={settings.bridge_url}
              onChange={(e) => setSettings({ ...settings, bridge_url: e.target.value })}
              placeholder="http://localhost:3001"
            />
          </div>
        </div>
      </section>

      {/* ============ اختبار المحادثة ============ */}
      <section className="card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-100 text-violet-600">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">اختبار المحادثة</h3>
            <p className="text-xs text-slate-500">تجربة النموذج المحلي مع تعليمات طب الأسنان</p>
          </div>
        </div>

        <div className="flex h-72 flex-col rounded-md border border-slate-200 bg-slate-50">
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {testMessages.length === 0 && (
              <p className="pt-8 text-center text-xs text-slate-400">
                اكتب رسالة أدناه لاختبار النموذج المحلي...
              </p>
            )}
            {testMessages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-sm px-3 py-2 text-sm ${
                  m.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tl-none'
                    : 'bg-white border border-slate-200 rounded-tr-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {testLoading && (
              <div className="flex justify-end">
                <div className="rounded-sm bg-white border border-slate-200 px-3 py-2">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.1s' }}></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-slate-200 p-2.5">
            <div className="flex gap-2">
              <input
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTestSend()}
                placeholder="اكتب رسالة اختبارية..."
                className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
                disabled={!bridgeOnline}
              />
              <button
                onClick={handleTestSend}
                disabled={!testInput.trim() || !bridgeOnline}
                className="rounded-full bg-slate-900 p-2.5 text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ الإعدادات العامة ============ */}
      <section className="card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-100 text-brand-600">
            <Brain size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">إعدادات المساعد</h3>
            <p className="text-xs text-slate-500">تفعيل المساعد وتعليمات النظام</p>
          </div>
        </div>

        <div className="space-y-5">
          <label className="flex cursor-pointer items-center justify-between rounded-md border border-slate-200 p-4 transition-colors hover:bg-slate-50">
            <div>
              <p className="font-medium text-slate-700">تفعيل المساعد الذكي</p>
              <p className="text-xs text-slate-500">عند الإيقاف، تستخدم المحادثة الردود الاحتياطية</p>
            </div>
            <Toggle on={settings.enabled} onChange={(v) => setSettings({ ...settings, enabled: v })} />
          </label>

          <FieldRow label="النموذج الافتراضي" hint="النموذج المستخدم في المحادثة">
            <input
              className="input"
              dir="ltr"
              value={settings.model}
              onChange={(e) => {
                setSettings({ ...settings, model: e.target.value });
                setDefaultModel(e.target.value);
              }}
            />
          </FieldRow>

          <FieldRow label="تعليمات النظام" hint="تخصص المساعد في طب الأسنان">
            <textarea
              className="input min-h-[80px] resize-y leading-relaxed"
              value={settings.system_prompt}
              onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
            />
          </FieldRow>

          <div className="flex items-center gap-3">
            <button onClick={saveSettings} disabled={saving} className="btn-accent disabled:opacity-60">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              حفظ الإعدادات
            </button>
          </div>
        </div>
      </section>

      {/* ============ نافذة تحميل نموذج ============ */}
      {showPullModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-fade-in" onClick={() => !pulling && setShowPullModal(false)}>
          <div className="w-full max-w-md rounded-sm bg-white p-6 shadow-elev-5 animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-base font-bold text-slate-900">تحميل نموذج جديد</h3>
            <p className="mb-4 text-xs text-slate-500">اختر النموذج من القائمة أو اكتب اسمه يدفياً</p>

            <div className="space-y-2">
              {AVAILABLE_MODELS.map((m) => (
                <button
                  key={m.name}
                  onClick={() => setPullModelName(m.name)}
                  className={`flex w-full items-center justify-between rounded-md border p-3 text-right transition-colors ${
                    pullModelName === m.name
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800" dir="ltr">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.desc}</p>
                  </div>
                  {pullModelName === m.name && <Check size={18} className="text-brand-600" />}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <label className="label">أو اكتب اسم نموذج مخصص</label>
              <input
                dir="ltr"
                className="input"
                value={pullModelName}
                onChange={(e) => setPullModelName(e.target.value)}
                placeholder="llama3.2"
              />
            </div>

            {pullProgress && (
              <div className="mt-3 rounded-md bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  {pulling && <Loader2 size={14} className="animate-spin" />}
                  <span>{pullProgress}</span>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  pullAbortRef.current?.abort();
                  setPulling(false);
                  setShowPullModal(false);
                  setPullProgress('');
                }}
                disabled={pulling}
                className="btn-secondary text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handlePull}
                disabled={pulling || !pullModelName.trim() || !bridgeOnline}
                className="btn-accent text-sm disabled:opacity-50"
              >
                {pulling ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {pulling ? 'جاري التحميل...' : 'بدء التحميل'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage({ store }: { store: Store }) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('clinic');
  const [saving, setSaving] = useState(false);

  const defaults: ClinicSettings = {
    clinicName: 'عيادة سمايل لطب الأسنان',
    phone: '065551234',
    address: 'عمّان، الأردن - شارع الملكة رانيا',
    workStart: 9,
    workEnd: 17,
    taxRate: 16,
    currency: 'JOD',
    notifyNew: true,
    notifyCancel: true,
    notifyReminder: true,
    reminderHours: 2,
  };

  const [s, setS] = useState<ClinicSettings>(defaults);

  useEffect(() => {
    if (store.clinicSettings) setS({ ...defaults, ...store.clinicSettings });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.clinicSettings]);

  const save = async () => {
    setSaving(true);
    try {
      await store.saveClinicSettings(s);
      toast('تم حفظ الإعدادات بنجاح', 'success');
    } catch {
      toast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Tabs sidebar */}
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-2.5 rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={17} className={active ? 'text-brand-600' : 'text-slate-400'} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Panel */}
        <div className="space-y-6">
          {tab === 'clinic' && (
            <section className="card p-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-100 text-brand-600">
                  <Building2 size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">معلومات العيادة</h3>
              </div>
              <div className="space-y-5">
                <FieldRow label="اسم العيادة">
                  <input className="input" value={s.clinicName} onChange={(e) => setS({ ...s, clinicName: e.target.value })} />
                </FieldRow>
                <FieldRow label="رقم الهاتف">
                  <input className="input" dir="ltr" value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} />
                </FieldRow>
                <FieldRow label="العنوان">
                  <input className="input" value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} />
                </FieldRow>
              </div>
            </section>
          )}

          {tab === 'hours' && (
            <section className="card p-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-100 text-brand-600">
                  <Clock size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">ساعات العمل</h3>
              </div>
              <div className="space-y-5">
                <FieldRow label="بداية الدوام">
                  <select className="input" value={String(s.workStart)} onChange={(e) => setS({ ...s, workStart: Number(e.target.value) })}>
                    {Array.from({ length: 12 }, (_, i) => i + 7).map((h) => (
                      <option key={h} value={h}>{h}:00 صباحاً</option>
                    ))}
                  </select>
                </FieldRow>
                <FieldRow label="نهاية الدوام">
                  <select className="input" value={String(s.workEnd)} onChange={(e) => setS({ ...s, workEnd: Number(e.target.value) })}>
                    {Array.from({ length: 12 }, (_, i) => i + 13).map((h) => (
                      <option key={h} value={h}>{h}:00 مساءً</option>
                    ))}
                  </select>
                </FieldRow>
                <div className="rounded-md bg-slate-50 p-4 text-xs text-slate-500">
                  أيام العمل: الأحد إلى الخميس (الجمعة والسبت إجازة)
                </div>
              </div>
            </section>
          )}

          {tab === 'finance' && (
            <section className="card p-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-100 text-brand-600">
                  <Percent size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">الإعدادات المالية</h3>
              </div>
              <div className="space-y-5">
                <FieldRow label="نسبة ضريبة المبيعات" hint="النسبة المعتمدة في الأردن 16%">
                  <div className="relative">
                    <input
                      type="number"
                      className="input pl-12"
                      value={String(s.taxRate)}
                      onChange={(e) => setS({ ...s, taxRate: Number(e.target.value) })}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
                  </div>
                </FieldRow>
                <FieldRow label="العملة">
                  <select className="input" value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })}>
                    <option value="JOD">دينار أردني (JOD)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                  </select>
                </FieldRow>
              </div>
            </section>
          )}

          {tab === 'notifications' && (
            <section className="card p-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-100 text-brand-600">
                  <Bell size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">الإشعارات</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'إشعار عند حجز موعد جديد', val: s.notifyNew, set: (v: boolean) => setS({ ...s, notifyNew: v }) },
                  { label: 'إشعار عند إلغاء موعد', val: s.notifyCancel, set: (v: boolean) => setS({ ...s, notifyCancel: v }) },
                  { label: 'تذكير المريض قبل الموعد', val: s.notifyReminder, set: (v: boolean) => setS({ ...s, notifyReminder: v }) },
                ].map((row) => (
                  <label
                    key={row.label}
                    className="flex cursor-pointer items-center justify-between rounded-md border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-700">{row.label}</span>
                    <Toggle on={row.val} onChange={row.set} />
                  </label>
                ))}
                <FieldRow label="وقت التذكير قبل الموعد">
                  <div className="relative max-w-[160px]">
                    <input
                      type="number"
                      className="input pl-10"
                      value={String(s.reminderHours)}
                      onChange={(e) => setS({ ...s, reminderHours: Number(e.target.value) })}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">ساعة</span>
                  </div>
                </FieldRow>
              </div>
            </section>
          )}

          {tab === 'integrations' && (
            <section className="card p-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-100 text-brand-600">
                  <Globe size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">التكاملات</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: CreditCard, name: 'CliQ للدفع', desc: 'إرسال روابط دفع فورية للمرضى', val: cliqEnabled, set: setCliqEnabled, color: 'bg-brand-100 text-brand-600' },
                  { icon: Receipt, name: 'JoFotara للفوترة', desc: 'الفوترة الإلكترونية المعتمدة', val: jofotaraEnabled, set: setJofotaraEnabled, color: 'bg-success-100 text-success-600' },
                  { icon: MessageSquare, name: 'WhatsApp للأعمال', desc: 'إرسال التذكيرات تلقائياً', val: whatsappEnabled, set: setWhatsappEnabled, color: 'bg-green-100 text-green-600' },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div
                      key={row.name}
                      className="flex items-center justify-between rounded-md border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${row.color}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{row.name}</p>
                          <p className="text-xs text-slate-500">{row.desc}</p>
                        </div>
                      </div>
                      <Toggle on={row.val} onChange={row.set} />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {tab === 'ai' && <AISettingsPanel />}
          <div className="flex justify-end">
            <button onClick={save} disabled={saving} className="btn-accent disabled:opacity-60">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              حفظ الإعدادات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
