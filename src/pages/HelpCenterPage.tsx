import { useState } from 'react';
import {
  BookOpen, Video, MessageSquare, Search, ChevronDown, ChevronLeft,
  PlayCircle, FileText, HelpCircle, Send, ArrowLeft, Sparkles, Bot, Loader2,
} from 'lucide-react';
import { helpbotChat } from '@/lib/helpbot';

type Props = { onBack: () => void };

const ARTICLES = [
  { id: 1, title: 'كيف أبدأ بإضافة أول مريض؟', category: 'البدء', icon: FileText, content: 'من القائمة الجانبية اختر "المرضى" ثم اضغط "إضافة مريض جديد". أدخل الاسم ورقم الهاتف وتاريخ الميلاد ثم احفظ.' },
  { id: 2, title: 'كيف أجدول موعداً جديداً؟', category: 'الجدولة', icon: FileText, content: 'اذهب إلى "الجدولة"، اختر اليوم والساعة المناسبة، ثم اضغط على المربع الفارغ واختر المريض ونوع الموعد.' },
  { id: 3, title: 'كيف أنشئ فاتورة وأرسلها للمريض؟', category: 'الفوترة', icon: FileText, content: 'في صفحة "الفواتير" اضغط "فاتورة جديدة"، اختر المريض وأضف الخدمات، ثم اضغط "إرسال" لإرسال رابط الدفع عبر واتساب.' },
  { id: 4, title: 'كيف أفعّل مساعد الذكاء الاصطناعي؟', category: 'الذكاء الاصطناعي', icon: FileText, content: 'اذهب إلى "المساعد الذكي" في الإعدادات، اضغط "تفعيل" واتبع الخطوات لتثبيت Ollama محلياً.' },
  { id: 5, title: 'كيف أدير صلاحيات الفريق؟', category: 'الإدارة', icon: FileText, content: 'في الإعدادات، قسم "الفريق"، يمكنك دعوة أعضاء وتعيين أدوار: مدير، طبيب، موظف استقبال، مساعد.' },
  { id: 6, title: 'كيف أربط حسابي مع CliQ للدفع؟', category: 'الدفع', icon: FileText, content: 'في الإعدادات، قسم "الدفع"، اختر CliQ وأدخل معرف المتجر. سيتم توليد روابط دفع تلقائياً للفواتير.' },
];

const VIDEOS = [
  { id: 1, title: 'جولة في النظام (5 دقائق)', duration: '5:00', thumb: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=400&q=80' },
  { id: 2, title: 'إدارة المرضى والمواعيد', duration: '8:30', thumb: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80' },
  { id: 3, title: 'الفوترة والمدفوعات', duration: '6:15', thumb: 'https://images.unsplash.com/photo-1554224155-6726b28ff8e2?auto=format&fit=crop&w=400&q=80' },
  { id: 4, title: 'تفعيل الذكاء الاصطناعي', duration: '10:00', thumb: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=400&q=80' },
];

const FAQS = [
  { q: 'هل بياناتي آمنة؟', a: 'نعم، جميع البيانات مشفّرة ومخزّنة على قاعدة بيانات سحابية مع عزل كامل بين العيادات. كل عيادة لها مساحة خاصة لا يصل إليها أحد.' },
  { q: 'هل يمكنني الإلغاء في أي وقت؟', a: 'نعم، يمكنك إلغاء اشتراكك في أي وقت من صفحة الإعدادات. لا توجد عقود طويلة الأمد أو رسوم إلغاء.' },
  { q: 'ما طرق الدفع المدعومة؟', a: 'ندعم Stripe و PayPal للدفع العالمي، ومدى للسعودية، وفوري لمصر، و CliQ للأردن. يمكنك اختيار الطريقة المناسبة لبلدك.' },
  { q: 'هل يدعم النظام اللغة العربية؟', a: 'نعم، النظام مصمم بالكامل للوطن العربي مع دعم RTL والعملات المحلية والتواريخ الهجرية والميلادية.' },
  { q: 'كم يستغرق تفعيل الحساب؟', a: 'التسجيل فوري — بمجرد إنشاء حسابك تبدأ تجربة 14 يوماً مجاناً بدون بطاقة ائتمان. جميع المميزات مفعّلة خلال التجربة.' },
];

export default function HelpCenterPage({ onBack }: Props) {
  const [search, setSearch] = useState('');
  const [openArticle, setOpenArticle] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'bot'; text: string; ai?: boolean }[]>([
    { role: 'bot', text: 'مرحباً! أنا المساعد الذكي. كيف يمكنني مساعدتك اليوم؟' },
  ]);

  const filteredArticles = ARTICLES.filter(a =>
    !search || a.title.includes(search) || a.category.includes(search)
  );

  const sendChat = async () => {
    if (!chatMsg.trim() || chatLoading) return;
    const userMsg = chatMsg.trim();
    setChatHistory(h => [...h, { role: 'user', text: userMsg }]);
    setChatMsg('');
    setChatLoading(true);

    try {
      const messages = chatHistory
        .filter(m => m.text !== 'مرحباً! أنا المساعد الذكي. كيف يمكنني مساعدتك اليوم؟')
        .map(m => ({ role: (m.role === 'bot' ? 'assistant' : 'user') as 'user' | 'assistant', content: m.text }));
      messages.push({ role: 'user', content: userMsg });

      const result = await helpbotChat(messages);
      setChatHistory(h => [...h, { role: 'bot', text: result.text, ai: result.usedAI }]);
    } catch {
      setChatHistory(h => [...h, { role: 'bot', text: 'عذراً، حدث خطأ. حاول مرة أخرى.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600">
            <ArrowLeft size={18} className="rotate-180" />
            العودة
          </button>
          <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-800">
            <HelpCircle size={18} className="text-sky-500" />
            مركز المساعدة
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-sky-50 to-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-4xl font-extrabold text-slate-800">كيف يمكننا مساعدتك؟</h1>
          <p className="mt-3 text-lg text-slate-500">ابحث في مقالاتنا ودروسنا التعليمية</p>
          <div className="relative mt-8">
            <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pr-12 pl-4 text-base shadow-elev-1 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-extrabold text-slate-800">
              <Video size={22} className="text-sky-500" />
              دروس فيديو
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {VIDEOS.map(v => (
                <div key={v.id} className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-elev-1 transition-all hover:shadow-elev-3">
                  <div className="relative h-32 overflow-hidden">
                    <img src={v.thumb} alt={v.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <PlayCircle size={40} className="text-white/90" />
                    </div>
                    <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">{v.duration}</span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-slate-700">{v.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-extrabold text-slate-800">
              <BookOpen size={22} className="text-emerald-500" />
              مقالات مساعدة
            </h2>
            <div className="space-y-2">
              {filteredArticles.map(a => (
                <div key={a.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <button
                    onClick={() => setOpenArticle(openArticle === a.id ? null : a.id)}
                    className="flex w-full items-center justify-between p-4 text-right hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-slate-400" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-700">{a.title}</h3>
                        <span className="text-xs text-slate-400">{a.category}</span>
                      </div>
                    </div>
                    {openArticle === a.id ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronLeft size={18} className="text-slate-400" />}
                  </button>
                  {openArticle === a.id && (
                    <div className="border-t border-slate-100 p-4 text-sm leading-relaxed text-slate-600">
                      {a.content}
                    </div>
                  )}
                </div>
              ))}
              {filteredArticles.length === 0 && (
                <div className="py-8 text-center text-slate-400">لا توجد نتائج</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-extrabold text-slate-800">
            <HelpCircle size={22} className="text-amber-500" />
            الأسئلة الشائعة
          </h2>
          <div className="mx-auto max-w-3xl space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-4 text-right hover:bg-slate-50"
                >
                  <h3 className="text-sm font-bold text-slate-700">{f.q}</h3>
                  {openFaq === i ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronLeft size={18} className="text-slate-400" />}
                </button>
                {openFaq === i && (
                  <div className="border-t border-slate-100 p-4 text-sm leading-relaxed text-slate-600">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chatbot */}
      <div className="fixed bottom-6 left-6 z-50">
        {chatOpen && (
          <div className="mb-4 h-96 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-elev-4">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-gradient-to-l from-sky-500 to-blue-600 p-4 text-white">
              <Bot size={20} />
              <div>
                <h3 className="text-sm font-bold">المساعد الذكي</h3>
                <p className="text-xs text-sky-100">متصل الآن</p>
              </div>
            </div>
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {chatHistory.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {m.role === 'bot' && m.ai && (
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-sky-600">
                        <Sparkles size={10} /> رد ذكي
                      </div>
                    )}
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-end">
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-500">
                    <Loader2 size={14} className="animate-spin" />
                    يفكر...
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 border-t border-slate-200 p-3">
              <input
                type="text"
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="اكتب رسالتك..."
                disabled={chatLoading}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:opacity-50"
              />
              <button onClick={sendChat} disabled={chatLoading || !chatMsg.trim()} className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white transition-colors hover:bg-sky-600 disabled:opacity-40">
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-elev-4 transition-all hover:scale-110"
        >
          {chatOpen ? <ArrowLeft size={22} /> : <Sparkles size={22} />}
        </button>
      </div>
    </div>
  );
}
