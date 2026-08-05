import { useState, useEffect, useCallback } from 'react';
import { Cpu, LayoutDashboard, KeyRound, Send, Sparkles, AlertTriangle } from 'lucide-react';
import type { Store } from '../store';
import type { AIProviderId, ProviderConfig } from '../lib/unified-ai-service';
import AIStatusBar from '../components/AIStatusBar';
import APIKeyManager from '../components/APIKeyManager';
import AIDashboard from '../components/AIDashboard';
import { smartChat } from '../lib/ai-switcher';
import { useToast } from '../components/Toast';
import { loadConfigs } from '../lib/ai-config';
import { saveProviderConfig } from '../lib/providers/repository';

type Tab = 'dashboard' | 'keys' | 'chat';

interface Props {
  store: Store;
}

export default function AICenter({ store }: Props) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const toast = useToast();

  useEffect(() => {
    void loadConfigs().then(setConfigs);
  }, []);

  const handleSaveConfig = useCallback((id: AIProviderId, patch: Partial<ProviderConfig>) => {
    void (async () => {
      await saveProviderConfig(id, patch);
      const refreshed = await loadConfigs();
      setConfigs(refreshed);
      toast('تم حفظ إعدادات الموفر', 'success');
    })();
  }, [toast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-elev-2">
            <Cpu size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">مركز الذكاء الاصطناعي</h2>
            <p className="text-sm text-slate-500">إدارة موفرين، تتبّع تكاليف، وتحليلات ذكية</p>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <AIStatusBar configs={configs} />

      {/* Tabs */}
      <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-elev-1">
        {[
          { id: 'dashboard' as Tab, label: 'لوحة التحكم', icon: LayoutDashboard },
          { id: 'keys' as Tab, label: 'مفاتيح API', icon: KeyRound },
          { id: 'chat' as Tab, label: 'محادثة', icon: Send },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-gradient-to-l from-slate-700 to-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === 'dashboard' && <AIDashboard store={store} />}
      {tab === 'keys' && <APIKeyManager configs={configs} onSave={handleSaveConfig} />}
      {tab === 'chat' && <ChatTab configs={configs} />}
    </div>
  );
}

/* ============ Chat Tab ============ */
function ChatTab({ configs }: { configs: ProviderConfig[] }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'مرحباً! اختر موفراً مفعّلاً واطرح سؤالك.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<'cost' | 'speed' | 'quality'>('cost');
  const toast = useToast();

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    const enabled = configs.filter((c) => c.enabled && c.hasApiKey);
    if (enabled.length === 0) {
      setMessages((m) => [...m, { role: 'assistant', content: 'لا يوجد موفر مفعّل. فعّل موفراً من تبويب مفاتيح API.' }]);
      setLoading(false);
      return;
    }

    const result = await smartChat(configs, {
      systemPrompt: 'أنت مساعد ذكي لعيادة أسنان. أجب بالعربية باختصار ووضوح.',
      messages: [...messages, { role: 'user', content: userMsg }].filter((m) => m.role !== 'assistant' || m.content !== 'مرحباً! اختر موفراً مفعّلاً واطرح سؤالك.'),
    }, { strategy, fallback: true });

    if (result.response) {
      setMessages((m) => [...m, { role: 'assistant', content: result.response!.text }]);
      toast(`ردّ ${result.usedProvider} · ${result.response.costUsd.toFixed(4)}$`, 'info');
    } else {
      setMessages((m) => [...m, { role: 'assistant', content: 'تعذّر الحصول على رد من أي موفر. تحقق من المفاتيح.' }]);
      toast('فشل كل الموفرين', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Strategy selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-600">استراتيجية الاختيار:</span>
        {([
          { id: 'cost' as const, label: 'أقل تكلفة' },
          { id: 'speed' as const, label: 'أسرع رد' },
          { id: 'quality' as const, label: 'أعلى جودة' },
        ]).map((s) => (
          <button
            key={s.id}
            onClick={() => setStrategy(s.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              strategy === s.id
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="card flex h-[440px] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-gradient-to-l from-slate-700 to-slate-900 text-white'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-slate-300">
                    <Sparkles size={10} /> AI
                  </div>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-end">
              <div className="flex items-center gap-1 rounded-2xl bg-gradient-to-l from-slate-700 to-slate-900 px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="اكتب سؤالك..."
              className="input flex-1"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white transition-all hover:bg-slate-700 disabled:opacity-40"
              aria-label="إرسال"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Warning */}
      {configs.filter((c) => c.enabled && c.hasApiKey).length === 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>لا يوجد موفر مفعّل بمفتاح صالح. انتقل لتبويب "مفاتيح API" لإضافة مفتاح وتفعيل موفر.</p>
        </div>
      )}
    </div>
  );
}
