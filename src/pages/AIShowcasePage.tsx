import { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Mic,
  Scan,
  TrendingDown,
  Brain,
  Sparkles,
  Play,
  Pause,
  Check,
  AlertTriangle,
  Activity,
  Volume2,
  Radio,
  Waves,
  Camera,
  FileText,
  X,
  Clock,
  User,
  Phone,
  Calendar,
  ChevronLeft,
  Zap,
  Shield,
  Target,
  ArrowLeft,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { useInView, useCountUp } from '@/hooks/useAnimations';

type Props = {
  onBack: () => void;
  onLaunchDemo: () => void;
};

/* ============ Navbar ============ */
function AINavbar({ onBack, onLaunchDemo }: Props) {
  return (
    <header className="absolute top-0 z-50 w-full">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-lg transition-all hover:bg-white/20"
        >
          <ArrowRight size={16} />
          العودة للرئيسية
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-600 text-white shadow-lg">
            <Brain size={18} />
          </div>
          <span className="text-base font-extrabold text-white">ذكاء سمايل</span>
        </div>
        <button
          onClick={onLaunchDemo}
          className="rounded-xl bg-gradient-to-l from-violet-500 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl"
        >
          تجربة مجانية
        </button>
      </div>
    </header>
  );
}

/* ============ Hero ============ */
function AIHero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-fuchsia-950">
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-0 h-96 w-96 animate-pulse rounded-full bg-violet-500 opacity-20 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-96 w-96 animate-pulse rounded-full bg-fuchsia-500 opacity-20 blur-3xl" style={{ animationDelay: '2s' }} />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-cyan-500 opacity-10 blur-3xl" style={{ animationDelay: '4s' }} />
      </div>
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <div className={`transition-all duration-1000 ease-out ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-fuchsia-300 backdrop-blur-lg">
            <Sparkles size={16} />
            ثلاثة أنظمة ذكاء اصطناعي تعمل محلياً
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-7xl">
            ذكاء اصطناعي
            <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              لعيادة الأسنان
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-slate-300 md:text-2xl">
            مساعد صوتي يتحدث مع مرضاك، تحليل ذكي لأشعة X-Ray، وتنبؤ بغياب المرضى — كل ذلك محلياً داخل عيادتك
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: Mic, label: 'مساعد صوتي' },
              { icon: Scan, label: 'تحليل الأشعة' },
              { icon: TrendingDown, label: 'تنبؤ الغياب' },
            ].map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.label}
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 font-medium text-white backdrop-blur-lg transition-all hover:scale-105 hover:bg-white/20"
                  style={{ transitionDelay: `${i * 100}ms`, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)' }}
                >
                  <Icon size={18} className="text-fuchsia-400" />
                  {b.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-slate-900 to-transparent" />
    </section>
  );
}

/* ============ Voice AI Demo ============ */
function VoiceAIDemo() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [thinking, setThinking] = useState(false);

  const conversation = [
    { role: 'patient', text: 'مرحبا، أريد حجز موعد لتنظيف الأسنان' },
    { role: 'ai', text: 'أهلاً وسهلاً! لدينا مواعيد متاحة يوم الأحد الساعة 10 صباحاً أو الثلاثاء الساعة 3 عصراً. أيهما يناسبك؟' },
    { role: 'patient', text: 'الأديد الساعة 10 أحسن' },
    { role: 'ai', text: 'تمام! حجزت لك موعد يوم الأيد الساعة 10 صباحاً لتنظيف الأسنان. ستصلك رسالة تذكير على واتساب قبل ساعتين. هل تحتاج شيء آخر؟' },
  ];

  const [visibleMsgs, setVisibleMsgs] = useState(0);

  useEffect(() => {
    if (visibleMsgs >= conversation.length) return;
    const t = setTimeout(() => setVisibleMsgs((v) => v + 1), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleMsgs]);

  const toggleRecording = () => {
    setRecording((r) => !r);
    if (!recording) {
      setTranscript('مرحبا، أريد حجز موعد لتنظيف الأسنان...');
      setThinking(true);
      setTimeout(() => {
        setThinking(false);
        setAiReply('أهلاً وسهلاً! لدينا مواعيد متاحة يوم الأيد الساعة 10 صباحاً. هل يناسبك؟');
      }, 2000);
    } else {
      setTranscript('');
      setAiReply('');
    }
  };

  return (
    <section className="bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-bold text-violet-300">
            <Mic size={16} />
            المساعد الصوتي
          </div>
          <h2 className="text-4xl font-bold text-white md:text-5xl">مساعد صوتي يتحدث مع مرضاك</h2>
          <p className="mt-4 text-lg text-slate-400">
            يحجز المواعيد، يجيب على الأسئلة، ويرسل التذكيرات — بصوت طبيعي بالعربية، 24 ساعة في اليوم
          </p>
        </Reveal>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Interactive demo */}
          <Reveal direction="right">
            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 blur-2xl" />
              <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
                {/* Conversation */}
                <div className="mb-6 space-y-3">
                  {conversation.slice(0, visibleMsgs).map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'patient' ? 'justify-start' : 'justify-end'} animate-fade-in-up`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                          msg.role === 'patient'
                            ? 'bg-white/10 text-slate-200'
                            : 'bg-gradient-to-l from-violet-500 to-fuchsia-500 text-white'
                        }`}
                      >
                        {msg.role === 'ai' && (
                          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-violet-200">
                            <Sparkles size={10} /> المساعد الذكي
                          </div>
                        )}
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {visibleMsgs < conversation.length && (
                    <div className="flex justify-end">
                      <div className="flex items-center gap-1 rounded-2xl bg-gradient-to-l from-violet-500 to-fuchsia-500 px-4 py-3">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Voice input area */}
                <div className="border-t border-white/10 pt-5">
                  {transcript && (
                    <div className="mb-3 rounded-xl bg-white/5 p-3 text-sm text-slate-300">
                      <span className="text-xs text-slate-500">قلت: </span>
                      {transcript}
                    </div>
                  )}
                  {thinking && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-violet-300">
                      <Activity size={14} className="animate-pulse" />
                      جاري التفكير...
                    </div>
                  )}
                  {aiReply && (
                    <div className="mb-3 rounded-xl bg-violet-500/10 p-3 text-sm text-violet-200">
                      <span className="text-xs text-violet-400">المساعد: </span>
                      {aiReply}
                    </div>
                  )}
                  <button
                    onClick={toggleRecording}
                    className={`flex w-full items-center justify-center gap-3 rounded-xl py-4 text-base font-bold transition-all ${
                      recording
                        ? 'bg-rose-500/20 text-rose-300 ring-2 ring-rose-500/50'
                        : 'bg-gradient-to-l from-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-violet-500/30'
                    }`}
                  >
                    {recording ? (
                      <>
                        <span className="relative flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
                        </span>
                        إيقاف التسجيل
                      </>
                    ) : (
                      <>
                        <Mic size={20} />
                        اضغط للتحدث
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right: Features */}
          <Reveal direction="left">
            <div className="space-y-5">
              <h3 className="text-2xl font-bold text-white">ماذا يفعل المساعد الصوتي؟</h3>
              {[
                { icon: Calendar, title: 'حجز المواعيد صوتياً', desc: 'المريض يتصل أو يحدث المساعد، ويحجز موعده بدون انتظار موظف الاستقبال' },
                { icon: Phone, title: 'الرد على الاستفسارات', desc: 'أسعار الخدمات، ساعات العمل، العنوان — المساعد يجيب فوراً' },
                { icon: Clock, title: 'تذكيرات تلقائية', desc: 'يتصل بالمرضى أو يرسل رسائل صوتية قبل الموعد لتقليل الغياب' },
                { icon: Volume2, title: 'صوت طبيعي بالعربية', desc: 'نموذج صوتي عربي فصيح، يفهم اللهجة الأردنية ويرد بوضوح' },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/10">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
                      <Icon size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-white">{f.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============ X-Ray AI Demo ============ */
function XRayAIDemo() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const findings = [
    { label: 'تسوس في الضرس 36', severity: 'high', confidence: 94, x: 55, y: 48 },
    { label: 'تسوس أولي في الضرس 14', severity: 'medium', confidence: 78, x: 28, y: 52 },
    { label: 'عظم سليم حول الأرحاء', severity: 'low', confidence: 98, x: 70, y: 30 },
  ];

  const runAnalysis = () => {
    setAnalyzing(true);
    setAnalyzed(false);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
    }, 3000);
  };

  return (
    <section className="bg-gradient-to-b from-slate-950 to-slate-900 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300">
            <Scan size={16} />
            تحليل الأشعة بالذكاء الاصطناعي
          </div>
          <h2 className="text-4xl font-bold text-white md:text-5xl">تحليل ذكي لصور الأشعة</h2>
          <p className="mt-4 text-lg text-slate-400">
            يكشف التسوس، التهاب الأعصاب، ومشاكل العظم تلقائياً — ثوانٍ معدودة لكل صورة
          </p>
        </Reveal>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Features */}
          <Reveal direction="right" className="order-2 lg:order-1">
            <div className="space-y-5">
              <h3 className="text-2xl font-bold text-white">كيف يعمل تحليل الأشعة؟</h3>
              {[
                { icon: Camera, title: 'رفع الصورة', desc: 'ترفع صورة الأشعة بضغطة زر — يدعم X-Ray بانورامي وفردي' },
                { icon: Brain, title: 'تحليل فوري', desc: 'النموذج يحلل الصورة خلال ثوانٍ ويحدد المناطق المشبوهة' },
                { icon: Target, title: 'تحديد دقيق', desc: 'يرسم مربعات حول المناطق المشبوهة مع نسبة الثقة لكل اكتشاف' },
                { icon: FileText, title: 'تقرير تلقائي', desc: 'ينشئ تقريراً مكتوباً يمكن إرفاقه بخطة العلاج أو إرساله للمريض' },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/10">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                      <Icon size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-white">{f.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>

          {/* Right: X-Ray viewer demo */}
          <Reveal direction="left" className="order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-4 backdrop-blur-lg">
                {/* X-Ray image mock */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-black">
                  {/* Simulated teeth pattern */}
                  <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full opacity-60">
                    <defs>
                      <radialGradient id="tooth" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.9" />
                        <stop offset="70%" stopColor="#94a3b8" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#475569" stopOpacity="0.3" />
                      </radialGradient>
                    </defs>
                    {Array.from({ length: 14 }).map((_, i) => (
                      <ellipse
                        key={i}
                        cx={50 + i * 25}
                        cy={150 + (i % 2) * 10}
                        rx={12}
                        ry={20}
                        fill="url(#tooth)"
                        opacity={0.7}
                      />
                    ))}
                    {Array.from({ length: 14 }).map((_, i) => (
                      <ellipse
                        key={`b-${i}`}
                        cx={50 + i * 25}
                        cy={120 + (i % 2) * 10}
                        rx={11}
                        ry={18}
                        fill="url(#tooth)"
                        opacity={0.6}
                      />
                    ))}
                  </svg>

                  {/* Scanning effect */}
                  {analyzing && (
                    <>
                      <div className="absolute inset-x-0 top-0 h-1 animate-pulse bg-cyan-400 shadow-[0_0_20px_4px_rgba(34,211,238,0.6)]" style={{ animation: 'scanLine 3s ease-in-out' }} />
                      <div className="absolute inset-0 bg-cyan-500/5" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-center gap-2 rounded-full bg-slate-900/80 px-4 py-2 text-sm font-semibold text-cyan-300 backdrop-blur-md">
                          <Activity size={16} className="animate-spin" />
                          جاري التحليل...
                        </div>
                      </div>
                    </>
                  )}

                  {/* Findings */}
                  {analyzed && findings.map((f, i) => {
                    const colors = {
                      high: 'border-rose-500 bg-rose-500/20 text-rose-300',
                      medium: 'border-amber-500 bg-amber-500/20 text-amber-300',
                      low: 'border-emerald-500 bg-emerald-500/20 text-emerald-300',
                    };
                    return (
                      <div key={i} className="absolute animate-fade-in-up" style={{ left: `${f.x}%`, top: `${f.y}%`, animationDelay: `${i * 200}ms` }}>
                        <div className={`relative -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 ${colors[f.severity as keyof typeof colors]} p-1`}>
                          <div className="h-12 w-12 rounded-md" />
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900/90 px-2 py-0.5 text-[10px] font-bold text-white">
                            {f.confidence}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Analysis button */}
                <div className="mt-4">
                  {!analyzed && !analyzing && (
                    <button
                      onClick={runAnalysis}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 py-3 text-base font-bold text-white transition-all hover:shadow-lg hover:shadow-cyan-500/30"
                    >
                      <Scan size={20} />
                      تحليل الصورة
                    </button>
                  )}
                  {analyzed && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-white">نتائج التحليل</span>
                        <button onClick={() => { setAnalyzed(false); }} className="text-xs text-slate-400 hover:text-white">
                          إعادة التحليل
                        </button>
                      </div>
                      {findings.map((f, i) => {
                        const colors = {
                          high: 'text-rose-400 bg-rose-500/10',
                          medium: 'text-amber-400 bg-amber-500/10',
                          low: 'text-emerald-400 bg-emerald-500/10',
                        };
                        const labels = { high: 'خطير', medium: 'متوسط', low: 'سليم' };
                        return (
                          <div key={i} className={`flex items-center justify-between rounded-lg ${colors[f.severity as keyof typeof colors]} px-3 py-2 animate-fade-in-up`} style={{ animationDelay: `${i * 200}ms` }}>
                            <span className="text-sm font-medium text-white">{f.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">{labels[f.severity as keyof typeof labels]}</span>
                              <span className="text-xs font-bold">{f.confidence}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
      <style>{`
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </section>
  );
}

/* ============ No-Show Prediction Demo ============ */
function NoShowDemo() {
  const { ref, inView } = useInView();
  const c35 = useCountUp(35, 1500, inView);
  const c60 = useCountUp(60, 1800, inView);
  const c18 = useCountUp(18, 1500, inView);

  const patients = [
    { name: 'محمد العلي', risk: 82, factors: ['3 مواعيد سابقة ملغاة', 'لم يؤكد الموعد', 'موعد بعد الظهر'] },
    { name: 'سارة الخطيب', risk: 45, factors: ['مريض جديد', 'موعد صباحي'] },
    { name: 'أحمد الزعبي', risk: 12, factors: ['مريض منتظم', 'أكد الموعد', 'تذكير تم إرساله'] },
  ];

  return (
    <section ref={ref} className="bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-300">
            <TrendingDown size={16} />
            التنبؤ بغياب المرضى
          </div>
          <h2 className="text-4xl font-bold text-white md:text-5xl">تنبأ بغياب المرضى قبل حدوثه</h2>
          <p className="mt-4 text-lg text-slate-400">
            يحلل سجل المريض ويحذرنا قبل الموعد — فتتخذ إجراءات وقائية تقلل الغياب
          </p>
        </Reveal>

        {/* Stats */}
        <div className="mb-12 grid gap-6 sm:grid-cols-3">
          {[
            { value: c35, suffix: '%', label: 'انخفاض في معدل الغياب', color: 'from-amber-500 to-orange-600' },
            { value: c60, suffix: '%', label: 'دقة التنبؤ', color: 'from-emerald-500 to-teal-600' },
            { value: c18, suffix: ' د.أ', label: 'وفورات شهرياً للموعد الضائع', color: 'from-violet-500 to-fuchsia-600' },
          ].map((s, i) => (
            <Reveal key={s.label} direction="up" delay={i * 100}>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-lg">
                <div className={`bg-gradient-to-r ${s.color} bg-clip-text text-5xl font-extrabold text-transparent`}>
                  {s.value}{s.suffix}
                </div>
                <p className="mt-2 text-sm text-slate-400">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left: Risk cards */}
          <Reveal direction="right">
            <div>
              <h3 className="mb-6 text-2xl font-bold text-white">تنبيهات المرضى عاليي المخاطر</h3>
              <div className="space-y-4">
                {patients.map((p, i) => {
                  const riskColor = p.risk > 70 ? 'from-rose-500 to-red-600' : p.risk > 30 ? 'from-amber-500 to-orange-600' : 'from-emerald-500 to-teal-600';
                  const riskBg = p.risk > 70 ? 'bg-rose-500/10 border-rose-500/30' : p.risk > 30 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30';
                  const riskLabel = p.risk > 70 ? 'خطر مرتفع' : p.risk > 30 ? 'خطر متوسط' : 'خطر منخفض';
                  return (
                    <div key={p.name} className={`rounded-2xl border ${riskBg} p-5 backdrop-blur-lg transition-all hover:scale-[1.02]`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-white">{p.name}</p>
                            <p className="text-xs text-slate-400">{riskLabel}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`bg-gradient-to-r ${riskColor} bg-clip-text text-3xl font-extrabold text-transparent`}>
                            {p.risk}%
                          </div>
                          <p className="text-[10px] text-slate-500">احتمالية الغياب</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.factors.map((f) => (
                          <span key={f} className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                            {f}
                          </span>
                        ))}
                      </div>
                      {p.risk > 70 && (
                        <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-rose-500/20 py-2 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/30">
                          <Phone size={14} />
                          اتصل للتأكيد
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* Right: How it works */}
          <Reveal direction="left">
            <div className="space-y-5">
              <h3 className="text-2xl font-bold text-white">عوامل التنبؤ</h3>
              <p className="text-slate-400">يحلل النظام أكثر من 15 عاملاً لكل مريض:</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: Clock, label: 'تاريخ الغياب السابق' },
                  { icon: Calendar, label: 'وقت الموعد ويوم الأسبوع' },
                  { icon: User, label: 'عمر المريض وتاريخه' },
                  { icon: Phone, label: 'تأكيد الموعد' },
                  { icon: AlertTriangle, label: 'نوع العلاج' },
                  { icon: Activity, label: 'المسافة من العيادة' },
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                        <Icon size={16} />
                      </div>
                      <span className="text-sm text-slate-300">{f.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white">إجراءات وقائية تلقائية</p>
                    <p className="mt-1 text-sm text-slate-400">عند تجاوز نسبة الخطر 70%، يتصل النظام بالمريض تلقائياً أو يرسل تذكيراً مزدوجاً لتأكيد الموعد</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============ Tech Stack ============ */
function TechStack() {
  return (
    <section className="bg-slate-950 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold text-white">مبني على تقنيات مفتوحة المصدر</h2>
          <p className="mt-3 text-slate-400">يعمل بالكامل على خادمك المحلي — بدون اعتماد على خدمات سحابية</p>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Brain, title: 'Ollama + Llama 3', desc: 'نموذج لغوي محلي للمحادثة والتحليل' },
            { icon: Mic, title: 'Whisper + Coqui', desc: 'تحويل الصوت لنص وتوليد صوت عربي طبيعي' },
            { icon: Scan, title: 'YOLO + OpenCV', desc: 'كشف الأجسام في صور الأشعة بدقة عالية' },
          ].map((t, i) => {
            const Icon = t.icon;
            return (
              <Reveal key={t.title} direction="up" delay={i * 100}>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-lg transition-all hover:bg-white/10">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
                    <Icon size={26} />
                  </div>
                  <p className="font-bold text-white">{t.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{t.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============ CTA ============ */
function AICTA({ onLaunchDemo }: { onLaunchDemo: () => void }) {
  return (
    <section className="bg-gradient-to-br from-slate-900 via-violet-950 to-fuchsia-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <h2 className="mb-6 text-5xl font-bold">جرّب الذكاء الاصطناعي في عيادتك</h2>
          <p className="mb-12 text-2xl text-slate-300">
            ثلاثة أنظمة ذكاء اصطناعي تعمل محلياً — خصوصية تامة، بدون رسوم شهرية للـ AI
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <button
              onClick={onLaunchDemo}
              className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-8 py-4 text-xl font-bold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-fuchsia-500/30"
            >
              ابدأ التجربة المجانية
            </button>
            <button className="rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-xl font-bold text-white backdrop-blur-lg transition-all hover:scale-105 hover:bg-white/20">
              تحدث مع المبيعات
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============ Page ============ */
export default function AIShowcasePage({ onBack, onLaunchDemo }: Props) {
  return (
    <div className="min-h-screen bg-slate-950" dir="rtl">
      <AINavbar onBack={onBack} onLaunchDemo={onLaunchDemo} />
      <AIHero />
      <VoiceAIDemo />
      <XRayAIDemo />
      <NoShowDemo />
      <TechStack />
      <AICTA onLaunchDemo={onLaunchDemo} />
    </div>
  );
}
