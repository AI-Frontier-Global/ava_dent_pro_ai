import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Key, X, Loader2, Cpu, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Page } from '@/components/Sidebar';

type Provider = {
  id: string;
  provider_key: string;
  provider_name: string;
  api_key: string | null;
  is_active: boolean;
};

type ProviderDef = {
  key: string;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  logo: string;
};

const PROVIDER_DEFS: ProviderDef[] = [
  { key: 'aws_bedrock', name: 'AWS Bedrock', description: 'نماذج متقدمة عبر Amazon Bedrock', color: 'text-amber-600', bgColor: 'bg-amber-50', logo: 'AWS' },
  { key: 'google_vertex', name: 'Google Vertex AI', description: 'نماذج Gemini عبر Google Cloud', color: 'text-sky-600', bgColor: 'bg-sky-50', logo: 'GCP' },
  { key: 'azure_openai', name: 'Azure OpenAI', description: 'نماذج OpenAI عبر Microsoft Azure', color: 'text-blue-600', bgColor: 'bg-blue-50', logo: 'AZ' },
  { key: 'anthropic', name: 'Anthropic Claude', description: 'نماذج Claude من Anthropic', color: 'text-orange-600', bgColor: 'bg-orange-50', logo: 'AN' },
  { key: 'groq', name: 'Groq', description: 'استدلال عالي السرعة', color: 'text-rose-600', bgColor: 'bg-rose-50', logo: 'GQ' },
  { key: 'mistral', name: 'Mistral AI', description: 'نماذج Mistral المفتوحة', color: 'text-amber-700', bgColor: 'bg-amber-50', logo: 'MI' },
  { key: 'deepinfra', name: 'DeepInfra', description: 'بنية تحتية للنماذج المفتوحة', color: 'text-teal-600', bgColor: 'bg-teal-50', logo: 'DI' },
  { key: 'perplexity', name: 'Perplexity', description: 'بحث مدعوم بالذكاء الاصطناعي', color: 'text-emerald-600', bgColor: 'bg-emerald-50', logo: 'PX' },
  { key: 'elevenlabs', name: 'ElevenLabs', description: 'تحويل النص إلى صوت طبيعي', color: 'text-violet-600', bgColor: 'bg-violet-50', logo: 'EL' },
];

type Props = {
  onNavigate?: (page: Page) => void;
};

export default function AIPlatform({ onNavigate }: Props) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalProvider, setModalProvider] = useState<ProviderDef | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('ai_providers').select('*');
      if (!error && data) {
        setProviders(data as Provider[]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const getProviderState = (key: string): Provider | undefined =>
    providers.find((p) => p.provider_key === key);

  const handleActivate = async (def: ProviderDef) => {
    setModalProvider(def);
    const existing = getProviderState(def.key);
    setApiKey(existing?.api_key || '');
  };

  const handleSaveKey = async () => {
    if (!modalProvider || !apiKey.trim()) return;
    setSaving(true);
    try {
      const existing = getProviderState(modalProvider.key);
      if (existing) {
        const { error } = await supabase
          .from('ai_providers')
          .update({ api_key: apiKey.trim(), is_active: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ai_providers').insert({
          provider_key: modalProvider.key,
          provider_name: modalProvider.name,
          api_key: apiKey.trim(),
          is_active: true,
        });
        if (error) throw error;
      }
      setModalProvider(null);
      setApiKey('');
      await loadProviders();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (def: ProviderDef) => {
    const existing = getProviderState(def.key);
    if (!existing) return;
    try {
      await supabase
        .from('ai_providers')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      await loadProviders();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" dir="rtl">
        <Loader2 size={28} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-l from-slate-800 to-slate-900 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Cpu size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">منصة الذكاء الاصطناعي</h1>
            <p className="text-sm text-slate-300">إدارة مزودي الذكاء الاصطناعي ومفاتيح API</p>
          </div>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROVIDER_DEFS.map((def) => {
          const state = getProviderState(def.key);
          const active = state?.is_active ?? false;
          return (
            <div
              key={def.key}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-elev-1 transition-all hover:shadow-elev-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${def.bgColor} text-sm font-extrabold ${def.color}`}>
                    {def.logo}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{def.name}</h3>
                    <p className="text-[11px] text-slate-500">{def.description}</p>
                  </div>
                </div>
                {active ? (
                  <span className="flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-bold text-success-700">
                    <CheckCircle2 size={11} />
                    متصل
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    <XCircle size={11} />
                    غير متصل
                  </span>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                {active ? (
                  <>
                    <button
                      onClick={() => handleActivate(def)}
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      تحديث المفتاح
                    </button>
                    <button
                      onClick={() => handleDeactivate(def)}
                      className="flex-1 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      إيقاف
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleActivate(def)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-l from-brand-500 to-accent-600 px-3 py-2 text-xs font-bold text-white shadow-elev-1 transition-all hover:shadow-elev-2 active:scale-[0.98]"
                  >
                    <Key size={13} />
                    تفعيل المزود
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {onNavigate && (
        <button
          onClick={() => onNavigate('ai-center')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          الذهاب إلى مركز الموفرين
          <ArrowRight size={16} className="rotate-180" />
        </button>
      )}

      {/* API Key Modal */}
      {modalProvider && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setModalProvider(null)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-elev-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${modalProvider.bgColor} text-sm font-extrabold ${modalProvider.color}`}>
                  {modalProvider.logo}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{modalProvider.name}</h3>
                  <p className="text-xs text-slate-500">أدخل مفتاح API الخاص بك</p>
                </div>
              </div>
              <button onClick={() => setModalProvider(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">مفتاح API</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  dir="ltr"
                  placeholder="sk-..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
                />
                <p className="mt-1.5 text-xs text-slate-400">يُخزن المفتاح بشكل آمن في قاعدة البيانات</p>
              </div>
              <button
                onClick={handleSaveKey}
                disabled={saving || !apiKey.trim()}
                className="w-full rounded-xl bg-gradient-to-l from-brand-500 to-accent-600 py-3 text-sm font-bold text-white shadow-elev-1 transition-all hover:shadow-elev-2 active:scale-[0.98] disabled:opacity-70"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    جاري الحفظ...
                  </span>
                ) : (
                  'تفعيل وحفظ'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
