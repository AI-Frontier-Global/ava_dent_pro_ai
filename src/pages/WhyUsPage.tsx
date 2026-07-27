import { useEffect, useState } from 'react';
import {
  Target,
  Brain,
  Zap,
  Heart,
  Lock,
  Users,
  ArrowRight,
  Sparkles,
  Server,
  MapPin,
  Clock,
  Shield,
  Flag,
  RefreshCw,
  DollarSign,
  Headphones,
  Building2,
  Star,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';

type Props = {
  onBack: () => void;
  onLaunchDemo: () => void;
};

/* ============ Navbar ============ */
function WhyUsNavbar({ onBack, onLaunchDemo }: Props) {
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
        <button
          onClick={onLaunchDemo}
          className="rounded-xl bg-gradient-to-l from-teal-400 to-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-500/30 transition-all hover:shadow-xl"
        >
          تجربة مجانية
        </button>
      </div>
    </header>
  );
}

/* ============ Animated Hero ============ */
function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const badges = [
    { icon: Lock, label: 'خصوصية 100%' },
    { icon: MapPin, label: 'مصمم للأردن' },
    { icon: Zap, label: 'سهل التعلم' },
  ];

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900">
      {/* Animated background blobs */}
      <div className="absolute inset-0">
        <div className="absolute left-0 top-0 h-96 w-96 animate-pulse rounded-full bg-blue-500 opacity-20 mix-blend-multiply blur-3xl" />
        <div
          className="absolute right-0 top-0 h-96 w-96 animate-pulse rounded-full bg-teal-500 opacity-20 mix-blend-multiply blur-3xl"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute bottom-0 left-0 h-96 w-96 animate-pulse rounded-full bg-cyan-500 opacity-20 mix-blend-multiply blur-3xl"
          style={{ animationDelay: '4s' }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Hero content */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
        <div
          className={`transition-all duration-1000 ease-out ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-teal-300 backdrop-blur-lg">
            <Sparkles size={16} />
            القيمة المضافة الحصرية
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-7xl">
            لماذا{' '}
            <span className="bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
              نظامنا
            </span>
            ؟
          </h1>

          <p className="mx-auto mb-10 max-w-3xl text-xl text-slate-300 md:text-2xl">
            النظام الأول في الأردن الذي يجمع بين الذكاء الاصطناعي المحلي والتكامل الكامل مع الأنظمة الأردنية
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {badges.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.label}
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 font-medium text-white backdrop-blur-lg transition-all hover:scale-105 hover:bg-white/20"
                  style={{
                    transitionDelay: `${i * 100}ms`,
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                  }}
                >
                  <Icon size={18} className="text-teal-400" />
                  {b.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-slate-900 to-transparent" />
    </section>
  );
}

/* ============ Stats Counter ============ */
function StatsCounter() {
  const stats = [
    { number: '50+', label: 'عيادة تستخدم النظام', icon: Building2 },
    { number: '15,000+', label: 'مريض مُدار', icon: Users },
    { number: '98%', label: 'رضا العملاء', icon: Star },
    { number: '60%', label: 'توفير في الوقت', icon: Clock },
  ];

  return (
    <section className="bg-gradient-to-br from-blue-600 to-teal-600 px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Reveal key={idx} direction="up" delay={idx * 100}>
                <div className="group text-center transition-transform duration-500 hover:scale-110">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-lg transition-transform duration-500 group-hover:rotate-12">
                    <Icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="mb-2 text-5xl font-bold">{stat.number}</div>
                  <div className="text-xl text-blue-100">{stat.label}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============ Exclusive Advantages ============ */
function ExclusiveAdvantages() {
  const cards = [
    {
      icon: Shield,
      title: 'الذكاء الاصطناعي المحلي الآمن',
      desc: 'يعمل داخل كمبيوتر العيادة، بيانات مرضاك لا تغادر المكان أبداً',
      badge: '100% خصوصية',
      bg: 'from-green-50 to-emerald-50',
      border: 'border-green-200',
      blob: 'bg-green-200',
      iconBg: 'from-green-500 to-emerald-600',
      badgeBg: 'bg-green-100 text-green-700',
    },
    {
      icon: Flag,
      title: 'التكامل الأردني الكامل',
      desc: 'CliQ، JoFotara، WhatsApp - مصمم من الألف للياء للسوق الأردني',
      badge: '3 أنظمة محلية',
      bg: 'from-red-50 to-orange-50',
      border: 'border-red-200',
      blob: 'bg-red-200',
      iconBg: 'from-red-500 to-orange-600',
      badgeBg: 'bg-red-100 text-red-700',
    },
    {
      icon: Zap,
      title: 'سهولة الاستخدام القصوى',
      desc: 'تعلم النظام في 15 دقيقة فقط، بدون دورات تدريبية مكلفة',
      badge: '15 دقيقة للتعلم',
      bg: 'from-yellow-50 to-amber-50',
      border: 'border-yellow-200',
      blob: 'bg-yellow-200',
      iconBg: 'from-yellow-500 to-amber-600',
      badgeBg: 'bg-yellow-100 text-yellow-700',
    },
    {
      icon: RefreshCw,
      title: 'نظام هجين ذكي',
      desc: 'يعمل مع الإنترنت وبدونه، يتحول تلقائياً للوضع الاحتياطي',
      badge: '99.9% وقت التشغيل',
      bg: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      blob: 'bg-blue-200',
      iconBg: 'from-blue-500 to-indigo-600',
      badgeBg: 'bg-blue-100 text-blue-700',
    },
    {
      icon: DollarSign,
      title: 'بدون تكاليف خفية',
      desc: 'لا رسوم على AI، لا تكاليف APIs خارجية، سعر ثابت شهرياً',
      badge: '29 JOD فقط/شهر',
      bg: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-200',
      blob: 'bg-emerald-200',
      iconBg: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-100 text-emerald-700',
    },
    {
      icon: Headphones,
      title: 'دعم فني محلي سريع',
      desc: 'فريق دعم أردني يتحدث لغتك، استجابة خلال ساعة واحدة',
      badge: 'استجابة < 1 ساعة',
      bg: 'from-purple-50 to-pink-50',
      border: 'border-purple-200',
      blob: 'bg-purple-200',
      iconBg: 'from-purple-500 to-pink-600',
      badgeBg: 'bg-purple-100 text-purple-700',
    },
  ];

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-800">القيمة المضافة الحصرية</h2>
          <p className="mb-16 text-xl text-gray-600">
            6 مميزات تجعلنا الخيار الأول لعيادات الأسنان في الأردن
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} direction="up" delay={i * 80}>
                <div
                  className={`group relative overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-br ${c.bg} p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl`}
                >
                  <div
                    className={`absolute right-0 top-0 h-32 w-32 rounded-full ${c.blob} opacity-20 transition-transform duration-700 group-hover:scale-150`}
                  />
                  <div className="relative z-10">
                    <div
                      className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${c.iconBg} transition-transform duration-500 group-hover:rotate-12`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-gray-800">{c.title}</h3>
                    <p className="mb-4 text-gray-600">{c.desc}</p>
                    <div
                      className={`inline-block rounded-full px-4 py-2 text-lg font-bold ${c.badgeBg}`}
                    >
                      {c.badge}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============ Comparison Table ============ */
function Comparison() {
  const rows = [
    { feature: 'الذكاء الاصطناعي', us: '✅ محلي وآمن', global: '❌ سحابي', local: '❌ غير موجود' },
    { feature: 'التكامل مع CliQ', us: '✅ مدمج', global: '❌ غير مدعوم', local: '❌ غير مدعوم' },
    { feature: 'الفوترة الإلكترونية', us: '✅ تلقائي', global: '⚠️ يحتاج إضافة', local: '❌ غير مدعوم' },
    { feature: 'تذكيرات WhatsApp', us: '✅ تلقائية', global: '⚠️ محدود', local: '❌ يدوي' },
    { feature: 'الواجهة العربية', us: '✅ 100% RTL', global: '❌ إنجليزية فقط', local: '⚠️ جزئية' },
    { feature: 'يعمل بدون إنترنت', us: '✅ نعم', global: '❌ لا', local: '✅ نعم' },
    { feature: 'تكلفة AI', us: '✅ مجاني', global: '❌ $50-300/شهر', local: '❌ غير موجود' },
    { feature: 'وقت التعلم', us: '✅ 15 دقيقة', global: '❌ أسابيع', local: '⚠️ أيام' },
    { feature: 'السعر الشهري', us: '✅ 29 JOD', global: '❌ $200-500', local: '⚠️ 50-100 JOD' },
  ];

  return (
    <section className="bg-gradient-to-br from-slate-50 to-blue-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <Reveal className="text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-800">مقارنة مع الأنظمة الأخرى</h2>
          <p className="mb-16 text-xl text-gray-600">اكتشف لماذا يتفوق نظامنا على المنافسين</p>
        </Reveal>

        <Reveal direction="up" delay={150}>
          <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-teal-600 text-white">
                    <th className="px-6 py-4 text-right text-lg font-bold">الميزة</th>
                    <th className="bg-blue-700 px-6 py-4 text-center text-lg font-bold">نظامنا</th>
                    <th className="px-6 py-4 text-center text-lg font-bold">الأنظمة العالمية</th>
                    <th className="px-6 py-4 text-center text-lg font-bold">الأنظمة المحلية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rows.map((row, idx) => (
                    <tr key={idx} className="transition-colors hover:bg-blue-50">
                      <td className="px-6 py-4 font-semibold text-gray-800">{row.feature}</td>
                      <td className="bg-blue-50 px-6 py-4 text-center font-bold text-green-600">
                        {row.us}
                      </td>
                      <td className="px-6 py-4 text-center text-red-500">{row.global}</td>
                      <td className="px-6 py-4 text-center text-orange-500">{row.local}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============ Local AI Spotlight ============ */
function LocalAISpotlight() {
  return (
    <section className="relative overflow-hidden bg-slate-900 py-24">
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-0 h-96 w-96 animate-pulse rounded-full bg-teal-500 opacity-10 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-96 w-96 animate-pulse rounded-full bg-blue-500 opacity-10 blur-3xl" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal direction="right">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-sm font-bold text-teal-300">
              <Brain size={16} />
              الذكاء الاصطناعي المحلي
            </div>
            <h2 className="mt-5 text-4xl font-extrabold leading-tight text-white md:text-5xl">
              مساعد ذكي يعمل <span className="text-teal-400">داخل عيادتك</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-300">
              النظام الوحيد في الأردن الذي يوفّر مساعداً ذكياً يعمل على خادمك المحلي — بدون إنترنت،
              بدون إرسال بيانات المرضى لأي شركة خارجية. خصوصية تامة، سرعة فائقة، وتحكم كامل.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: Lock, text: 'بيانات المرضى تبقى داخل العيادة — لا تغادر أبداً' },
                { icon: Zap, text: 'استجابة فورية بدون انتظار اتصال بالإنترنت' },
                { icon: Server, text: 'تثبيت على خادم العيادة أو جهازك المحلي' },
                { icon: Heart, text: 'مساعد عربي يفهم سياق العيادة الأردنية' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.text} className="flex items-center justify-end gap-3 text-slate-200">
                    <span>{item.text}</span>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 ring-1 ring-teal-500/30">
                      <Icon size={18} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          <Reveal direction="left">
            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-teal-500/20 to-blue-500/20 blur-2xl" />
              <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
                <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 text-white shadow-lg">
                    <Brain size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-white">المساعد الذكي</p>
                    <p className="text-xs text-teal-400">يعمل محلياً · بدون إنترنت</p>
                  </div>
                  <span className="mr-auto flex h-2.5 w-2.5 items-center justify-center">
                    <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    'مرحباً! كيف يمكنني مساعدتك اليوم؟',
                    'كم مريض لديك مواعيد غداً؟',
                    'لديك 8 مواعيد مجدولة غداً، منها 3 تنظيف و2 حشوات.',
                  ].map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                          i % 2 === 0
                            ? 'bg-white/10 text-slate-200'
                            : 'bg-gradient-to-l from-teal-500 to-blue-500 text-white'
                        }`}
                      >
                        {msg}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4">
                  <div className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400">
                    اكتب سؤالك...
                  </div>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500 text-white">
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============ Testimonials ============ */
function Testimonials() {
  const testimonials = [
    {
      name: 'د. أحمد الخطيب',
      clinic: 'عيادة الابتسامة، عمان',
      text: 'النظام وفر علينا 3 ساعات يومياً في العمل الإداري، والذكاء الاصطناعي يساعدنا في الرد على استفسارات المرضى فوراً',
      rating: 5,
      image:
        'https://images.pexels.com/photos/5407206/pexels-photo-5407206.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    },
    {
      name: 'د. سارة العبادي',
      clinic: 'مركز عمان للأسنان',
      text: 'أخيراً نظام يفهم السوق الأردني! التكامل مع CliQ و JoFotara وفر علينا الكثير من التعقيدات',
      rating: 5,
      image:
        'https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    },
    {
      name: 'د. محمد الزعبي',
      clinic: 'عيادة النخبة، إربد',
      text: 'الدعم الفني المحلي سريع جداً، والنظام سهل التعلم لدرجة أن موظفة الاستقبال تعلمته في يوم واحد',
      rating: 5,
      image:
        'https://images.pexels.com/photos/6234600/pexels-photo-6234600.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    },
  ];

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-gray-800">ماذا يقول عملاؤنا؟</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((t, idx) => (
            <Reveal key={idx} direction="up" delay={idx * 100}>
              <div className="group h-full rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50 p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                <div className="mb-6 flex items-center gap-4">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="h-16 w-16 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                  <div>
                    <h4 className="font-bold text-gray-800">{t.name}</h4>
                    <p className="text-sm text-gray-600">{t.clinic}</p>
                  </div>
                </div>
                <div className="mb-4 flex gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="leading-relaxed text-gray-700">{t.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ Final CTA ============ */
function WhyUsCTA({ onLaunchDemo }: { onLaunchDemo: () => void }) {
  return (
    <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900 px-6 py-20 text-white">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <h2 className="mb-6 text-5xl font-bold">جاهز لتجربة النظام؟</h2>
          <p className="mb-12 text-2xl text-gray-300">
            ابدأ تجربتك المجانية لمدة 14 يوم، بدون بطاقة ائتمان
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <button
              onClick={onLaunchDemo}
              className="rounded-full bg-gradient-to-r from-teal-500 to-blue-500 px-8 py-4 text-xl font-bold text-white transition-all hover:scale-105 hover:shadow-2xl"
            >
              ابدأ التجربة المجانية
            </button>
            <button className="rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-xl font-bold text-white backdrop-blur-lg transition-all hover:scale-105 hover:bg-white/20">
              تواصل معنا
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============ Why Us Page ============ */
export default function WhyUsPage({ onBack, onLaunchDemo }: Props) {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <WhyUsNavbar onBack={onBack} onLaunchDemo={onLaunchDemo} />
      <Hero />
      <StatsCounter />
      <ExclusiveAdvantages />
      <LocalAISpotlight />
      <Comparison />
      <Testimonials />
      <WhyUsCTA onLaunchDemo={onLaunchDemo} />
    </div>
  );
}
