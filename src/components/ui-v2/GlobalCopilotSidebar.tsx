import { useState, useRef, useEffect } from 'react';
import { Sparkles, Bot, Send, X, Lightbulb, TrendingUp, FileText, Calendar } from 'lucide-react';
import type { Page } from '@/components/Sidebar';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type Props = {
  onNavigate?: (page: Page) => void;
};

const suggestions = [
  { label: 'تحليل مواعيد اليوم', icon: Calendar, page: 'scheduling' as Page },
  { label: 'تنبؤ بالغياب', icon: TrendingUp, page: 'ai-hub' as Page },
  { label: 'إنشاء تقرير', icon: FileText, page: 'reports' as Page },
  { label: 'نصائح تحسين العيادة', icon: Lightbulb, page: 'dashboard' as Page },
];

export default function GlobalCopilotSidebar({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟',
    },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now() + '', role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTimeout(() => {
      const reply: Message = {
        id: Date.now() + 1 + '',
        role: 'assistant',
        content: 'شكراً لسؤالك! يمكنني مساعدتك في تحليل بيانات العيادة، التنبؤ بالغياب، وإنشاء التقارير. اختر أحد الخيارات المقترحة للبدء.',
      };
      setMessages((prev) => [...prev, reply]);
    }, 800);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-600 text-white shadow-elev-3 shadow-brand-500/40 transition-all hover:scale-105 active:scale-95"
        aria-label="فتح المساعد الذكي"
      >
        <Bot size={26} />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
          <span className="relative inline-flex h-4 w-4 rounded-full bg-success-500" />
        </span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-y-0 left-0 z-50 flex w-80 flex-col bg-white shadow-elev-4 animate-fade-in"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-l from-brand-500 to-accent-600 p-4 text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold">المساعد الذكي</h3>
            <p className="text-[10px] text-white/70">Dental Pro Copilot</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="إغلاق"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-gradient-to-l from-brand-50 to-accent-50 text-slate-700'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">اقتراحات سريعة</p>
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  onClick={() => {
                    if (onNavigate && s.page) onNavigate(s.page);
                    setOpen(false);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-semibold text-slate-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  <Icon size={12} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="اكتب رسالتك..."
            className="flex-1 bg-transparent py-2.5 text-sm text-slate-700 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-600 text-white transition-all hover:shadow-md disabled:opacity-40"
            aria-label="إرسال"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
