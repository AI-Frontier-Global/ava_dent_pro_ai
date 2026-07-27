import { useState, useEffect } from 'react';
import {
  Stethoscope,
  Menu,
  X,
  CalendarClock,
  MessageCircle,
  Receipt,
  Link2,
  Smile,
  BarChart3,
  Users,
  Camera,
  ClipboardList,
  ShieldCheck,
  CreditCard,
  ArrowLeft,
  Check,
  Star,
  Play,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  TrendingUp,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Send,
  Layers,
  Heart,
  Brain,
  Mic,
  Scan,
  TrendingDown,
} from 'lucide-react';
import {
  LaptopFrame,
  PhoneFrame,
  MiniDashboard,
  MiniSchedule,
  MiniPatient,
  MiniInvoice,
  MiniMobileApp,
} from '@/components/Mockups';
import { Reveal } from '@/components/Reveal';
import { useInView, useCountUp } from '@/hooks/useAnimations';
import FAQ from '@/components/FAQ';
import ClientLogos from '@/components/ClientLogos';
import ChatWidget from '@/components/ChatWidget';

type Props = { onLaunchDemo: () => void; onGoToWhyUs: () => void; onGoToAIShowcase: () => void };

/* ============ Image URLs ============ */
const IMG = {
  clinic: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1600&q=80',
  dentist: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
  dentistFemale: 'https://images.unsplash.com/photo-1571772996211-2f02c9727629?auto=format&fit=crop&w=800&q=80',
  equipment: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
  happyPatient: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=800&q=80',
  doctorPortrait: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80',
  doctorPortrait2: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=400&q=80',
  doctorPortrait3: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=400&q=80',
  laptop: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
  phone: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
  xray: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80',
  payment: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=600&q=80',
  reports: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
};

const VIDEO_URL = 'https://assets.mixkit.co/videos/17563/17563-720.mp4';

/* ============ Smooth Scroll ============ */
function useSmoothScroll() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const el = document.querySelector(href);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);
}

/* ============ Navbar ============ */
function Navbar({ onLaunchDemo }: { onLaunchDemo: () => void }) {
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'الميزات', href: '#features' },
    { label: 'العرض', href: '#showcase' },
    { label: 'التسعير', href: '#pricing' },
    { label: 'الآراء', href: '#testimonials' },
    { label: 'الأسئلة', href: '#faq' },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md">
            <Stethoscope size={22} />
          </div>
          <span className="text-lg font-extrabold text-slate-800">عيادة سمايل</span>
        </div>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-semibold text-slate-600 transition-colors hover:text-sky-600">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <button onClick={onLaunchDemo} className="text-sm font-semibold text-sky-600 hover:text-sky-700">
            دخول العيادة
          </button>
          <button onClick={onLaunchDemo} className="rounded-xl bg-gradient-to-l from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md">
            تجربة مجانية
          </button>
        </div>
        <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-slate-600 md:hidden">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-2 text-sm font-semibold text-slate-600">
              {l.label}
            </a>
          ))}
          <button onClick={onLaunchDemo} className="mt-3 w-full rounded-xl bg-gradient-to-l from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
            تجربة مجانية
          </button>
        </div>
      )}
    </header>
  );
}

/* ============ Hero — Curve Dental split layout ============ */
function Hero({ onLaunchDemo, onGoToWhyUs, onGoToAIShowcase }: { onLaunchDemo: () => void; onGoToWhyUs: () => void; onGoToAIShowcase: () => void }) {
  return (
    <section className="relative overflow-hidden">
      <div className="grid min-h-[540px] lg:grid-cols-2">
        {/* الجانب الأيمن: نص على خلفية تيل هادئة */}
        <div
          className="relative flex items-center px-6 py-16 sm:px-12 lg:py-20"
          style={{ backgroundColor: '#6BBFC0' }}
        >
          {/* نقش دائري زخرفي */}
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

          <div className="relative w-full text-right">
            {/* شارة النجوم */}
            <div className="mb-4 inline-flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-800">
                موثوق من 2,500+ عيادة ناجحة
              </span>
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.1] text-slate-900 sm:text-5xl lg:text-[3.25rem]">
              النظام الأول
              <span className="block">لإدارة عيادات</span>
              <span className="block">الأسنان في الأردن</span>
            </h1>

            <p className="mt-4 max-w-sm text-base leading-relaxed text-slate-700">
              بسيط، سريع، مصمم لعيادتك — من الجدولة والتذكيرات إلى الفوترة والدفع عبر CliQ.
            </p>

            {/* أزرار */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={onLaunchDemo}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600"
              >
                جدول عرضاً مجانياً
              </button>
              <button
                onClick={onGoToWhyUs}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-800/30 bg-white/20 px-6 py-3.5 text-base font-semibold text-slate-800 backdrop-blur-sm transition-all hover:bg-white/40"
              >
                <Play size={16} />
                لماذا نظامنا؟
              </button>
              <button
                onClick={onGoToAIShowcase}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-violet-500/40 bg-violet-500/10 px-6 py-3.5 text-base font-semibold text-violet-700 backdrop-blur-sm transition-all hover:bg-violet-500/20"
              >
                <Brain size={16} />
                ذكاء اصطناعي
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-slate-700">
              <span className="flex items-center gap-1.5"><Check size={15} className="text-slate-800" /> 14 يوم مجاناً</span>
              <span className="flex items-center gap-1.5"><Check size={15} className="text-slate-800" /> بدون بطاقة ائتمان</span>
            </div>
          </div>
        </div>

        {/* الجانب الأيسر: صورة الطبيب */}
        <div className="relative min-h-[320px]">
          <img
            src={IMG.dentist}
            alt="طبيب أسنان مع المريض"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#6BBFC0]/30 to-transparent" />
        </div>
      </div>

      {/* شريط 5x يتداخل مع الأسفل */}
      <div
        className="relative z-10 mx-4 -mt-12 overflow-hidden rounded-2xl shadow-2xl sm:mx-8 lg:mx-16"
        style={{ background: 'linear-gradient(135deg, #1e2d5a 0%, #162347 100%)' }}
      >
        <div className="grid items-center gap-6 px-6 py-6 sm:px-10 lg:grid-cols-[auto_1fr]">
          {/* العبارة الكبيرة */}
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">عملاؤنا يحققون حتى</p>
            <p className="mt-1 text-5xl font-extrabold leading-none text-white sm:text-6xl">
              5x <span className="text-orange-400">عائد</span>
            </p>
          </div>
          {/* الأرقام الثلاثة */}
          <div className="grid grid-cols-3 gap-4 border-r border-slate-600 pr-6 text-right">
            {[
              { pct: '20%', label: 'زيادة التحصيل' },
              { pct: '25%', label: 'مرضى جدد' },
              { pct: '30%', label: 'قبول خطط العلاج' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-orange-400">{s.pct}</p>
                <p className="mt-0.5 text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ Trusted By strip ============ */
function TrustedBy() {
  const { ref, inView } = useInView();
  const c50 = useCountUp(50, 1500, inView);
  const c5000 = useCountUp(5000, 2000, inView);
  return (
    <section ref={ref} className="border-b border-slate-200 bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="text-right">
            <p className="text-3xl font-extrabold text-slate-800 sm:text-4xl">
              موثوق من{' '}
              <span className="text-orange-500">{c50}+</span> عيادة أسنان
            </p>
            <p className="mt-2 text-base text-slate-500">في عيادات من جميع الأحجام والتخصصات</p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500">
              {['عيادات فردية', 'مراكز متخصصة', 'سلاسل متعددة الفروع'].map((t) => (
                <span key={t} className="flex items-center gap-1.5 font-semibold text-slate-600">
                  <Check size={14} className="text-orange-500" />{t}
                </span>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl shadow-xl">
            <img
              src={IMG.dentistFemale}
              alt="فريق عيادة أسنان"
              className="h-56 w-full object-cover object-top transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute bottom-4 right-4 rounded-xl bg-white/90 px-4 py-2.5 shadow-lg backdrop-blur-md">
              <p className="text-sm font-bold text-slate-800">+{c5000.toLocaleString('en-US')} مريض مسجل</p>
              <div className="mt-1 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ All Your Needs. One Solution. ============ */
function AllInOne() {
  const features = [
    'الجدولة',
    'تفاعل المرضى',
    'استقبال المرضى',
    'التصوير الطبي',
    'خطط العلاج',
    'التأمين الصحي',
    'خطط العضوية',
    'الفوترة',
    'المدفوعات',
    'التقارير والإحصائيات',
  ];
  const [active, setActive] = useState(0);
  const clinicLove = [
    'جدولك الأسبوعي بالطريقة التي تريدها',
    'الأداة الأكثر ثقة لعيادات الأردن',
    'وصول كل ما تحتاجه بنقرة أو اثنتين',
  ];
  const patientLove = [
    'حجز ذاتي 24/7 من أي جهاز',
    'تذكيرات تلقائية بموعده بسهولة',
    'دفع الفاتورة إلكترونياً بضغطة',
  ];
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* عنوان مركزي */}
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
            كل احتياجاتك.
            <br />
            حل واحد.
          </h2>
          <p className="mt-3 text-base text-slate-500">
            تجربة أرقى لمرضاك. إدارة أكفأ وأكثر ربحية لك.
          </p>
        </div>

        {/* الشبكة الثلاثية */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[220px_1fr_240px]">
          {/* عمود قائمة الميزات */}
          <div className="space-y-1.5">
            {features.map((f, i) => (
              <button
                key={f}
                onClick={() => setActive(i)}
                className={`w-full rounded-lg px-4 py-2.5 text-right text-sm font-semibold transition-all ${
                  active === i
                    ? 'bg-[#6BBFC0] text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* عمود لقطات الشاشة */}
          <div className="space-y-4">
            <LaptopFrame>
              <div className="h-[240px]">
                <MiniDashboard />
              </div>
            </LaptopFrame>
            <div className="grid grid-cols-2 gap-4">
              <LaptopFrame>
                <div className="h-[160px]"><MiniSchedule /></div>
              </LaptopFrame>
              <LaptopFrame>
                <div className="h-[160px]"><MiniInvoice /></div>
              </LaptopFrame>
            </div>
          </div>

          {/* عمود ما ستحب / ما يحب المرضى */}
          <div className="space-y-6 text-right">
            <div>
              <h3 className="mb-3 flex items-center justify-end gap-2 text-base font-extrabold text-slate-800">
                ما ستحبه كطبيب:
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <Stethoscope size={15} />
                </span>
              </h3>
              <ul className="space-y-2">
                {clinicLove.map((item) => (
                  <li key={item} className="flex items-start justify-end gap-2 text-sm text-slate-600">
                    {item}
                    <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 flex items-center justify-end gap-2 text-base font-extrabold text-slate-800">
                ما سيحبه مرضاك:
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <Heart size={15} />
                </span>
              </h3>
              <ul className="space-y-2">
                {patientLove.map((item) => (
                  <li key={item} className="flex items-start justify-end gap-2 text-sm text-slate-600">
                    {item}
                    <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ What You'll Love ============ */
function WhatYoullLove() {
  const features = [
    { icon: CalendarClock, title: 'جدولة مرنة حسب رغبتك', desc: 'جدول أسبوعي تفاعلي مع حجز سريع' },
    { icon: MessageCircle, title: 'تذكيرات WhatsApp تلقائية', desc: 'رسائل تذكير قبل الموعد تلقائياً' },
    { icon: Receipt, title: 'فوترة إلكترونية JoFotara', desc: 'متوافقة مع ضريبة المبيعات 16%' },
    { icon: Link2, title: 'دفع عبر CliQ', desc: 'روابط دفع فورية للمرضى' },
    { icon: Smile, title: 'مخطط أسنان تفاعلي', desc: 'رسم وتسجيل العلاج على الأسنان' },
    { icon: BarChart3, title: 'تقارير مالية فورية', desc: 'إحصائيات وتحليلات لحظية' },
  ];
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal direction="right" className="order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-sky-100/60 to-blue-100/40 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                <img
                  src={IMG.dentist}
                  alt="طبيب أسنان مبتسم"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
                <div className="absolute bottom-6 right-6 left-6 rounded-2xl border border-white/20 bg-white/90 p-4 shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white">
                      <TrendingUp size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">انخفاض الغياب بنسبة 60%</p>
                      <p className="text-xs text-slate-500">بفضل التذكيرات التلقائية</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="order-1 lg:order-2">
            <Reveal direction="up">
              <h2 className="text-3xl font-extrabold text-slate-800 sm:text-4xl">ما ستحبه في نظامنا</h2>
              <p className="mt-3 text-base text-slate-500">كل ما تحتاجه عيادتك في منصة واحدة متكاملة وسهلة الاستخدام</p>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <Reveal key={f.title} direction="up" delay={i * 80}>
                    <div className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-sky-200 hover:bg-sky-50/50">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-500 transition-transform group-hover:scale-110">
                        <Icon size={22} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{f.title}</p>
                        <p className="mt-0.5 text-sm text-slate-500">{f.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ What Patients Love ============ */
function WhatPatientsLove() {
  const features = [
    { icon: Clock, title: 'حجز 24/7 من أي جهاز', desc: 'يحجز المريض موعده في أي وقت ومن أي مكان' },
    { icon: MessageCircle, title: 'تذكيرات WhatsApp', desc: 'رسائل تذكير تلقائية قبل الموعد' },
    { icon: ClipboardList, title: 'نماذج رقمية قبل الموعد', desc: 'يملأ المريض بياناته قبل الوصول' },
    { icon: CreditCard, title: 'دفع إلكتروني سهل', desc: 'دفع عبر CliQ بضغطة زر' },
  ];
  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <Reveal direction="up">
              <h2 className="text-3xl font-extrabold text-slate-800 sm:text-4xl">تجربة مريض أفضل</h2>
              <p className="mt-3 text-base text-slate-500">منح مرضاك تجربة رقمية سلسة تجعلهم يعودون لعيادتك</p>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <Reveal key={f.title} direction="up" delay={i * 80}>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                        <Icon size={22} />
                      </div>
                      <p className="font-bold text-slate-800">{f.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
          <Reveal direction="left" className="order-1 lg:order-2">
            <div className="relative mx-auto w-fit">
              <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-sky-100/60 to-blue-100/40 blur-2xl" />
              <div className="relative">
                <PhoneFrame>
                  <MiniMobileApp />
                </PhoneFrame>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============ Features Grid with Images ============ */
function FeaturesGrid() {
  const features = [
    { icon: CalendarClock, title: 'الجدولة', desc: 'جدول أسبوعي مرن مع حجز سريع بالضغط على أي خانة', color: 'bg-sky-100 text-sky-600', img: IMG.clinic },
    { icon: Users, title: 'إدارة المرضى', desc: 'سجلات كاملة مع تاريخ طبي وملاحظات ومتابعة', color: 'bg-emerald-100 text-emerald-600', img: IMG.dentistFemale },
    { icon: Receipt, title: 'الفوترة الإلكترونية', desc: 'فواتير متوافقة مع JoFotara وضريبة 16%', color: 'bg-amber-100 text-amber-600', img: IMG.reports },
    { icon: Link2, title: 'المدفوعات CliQ', desc: 'إنشاء روابط دفع وإرسالها للمرضى فوراً', color: 'bg-violet-100 text-violet-600', img: IMG.payment },
    { icon: Camera, title: 'التصوير الطبي', desc: 'أرشيف صور وأشعة لكل مريض منظمة بالتاريخ', color: 'bg-cyan-100 text-cyan-600', img: IMG.xray },
    { icon: BarChart3, title: 'التقارير', desc: 'تقارير مالية وإحصائية فورية قابلة للتصدير', color: 'bg-orange-100 text-orange-600', img: IMG.reports },
  ];
  return (
    <section id="features" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-slate-800 sm:text-4xl">منصة واحدة متكاملة</h2>
          <p className="mt-3 text-base text-slate-500">كل ما تحتاجه لإدارة عيادتك بكفاءة في مكان واحد</p>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} direction="up" delay={i * 80}>
                <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={f.img}
                      alt={f.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                    <div className={`absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-2xl ${f.color} shadow-lg transition-transform group-hover:scale-110`}>
                      <Icon size={24} />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-800">{f.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{f.desc}</p>
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

/* ============ Screenshots Showcase ============ */
function Showcase() {
  const shots = [
    { title: 'لوحة التحكم', comp: <MiniDashboard /> },
    { title: 'جدول المواعيد', comp: <MiniSchedule /> },
    { title: 'صفحة المريض', comp: <MiniPatient /> },
    { title: 'الفاتورة الإلكترونية', comp: <MiniInvoice /> },
  ];
  return (
    <section id="showcase" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-slate-800 sm:text-4xl">شاهد النظام يعمل</h2>
          <p className="mt-3 text-base text-slate-500">واجهات حقيقية من نظامنا — مصممة للبساطة والسرعة</p>
        </Reveal>
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {shots.map((s, i) => (
            <Reveal key={s.title} direction="up" delay={i * 100}>
              <div className="group">
                <div className="mb-4 transition-transform group-hover:-translate-y-1">
                  <LaptopFrame>
                    <div className="h-[300px]">{s.comp}</div>
                  </LaptopFrame>
                </div>
                <p className="text-center text-lg font-bold text-slate-700">{s.title}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ Pricing ============ */
function Pricing({ onLaunchDemo }: { onLaunchDemo: () => void }) {
  const plans = [
    {
      name: 'الأساسية',
      price: '29',
      desc: 'مثالية للعيادات الصغيرة',
      features: ['جدولة المواعيد', 'إدارة المرضى (حتى 500)', 'تذكيرات WhatsApp', 'تقارير أساسية'],
      popular: false,
    },
    {
      name: 'الاحترافية',
      price: '49',
      desc: 'الأكثر شعبية للعيادات النامية',
      features: ['كل ميزات الأساسية', 'مرضى غير محدودين', 'فوترة إلكترونية JoFotara', 'دفع عبر CliQ', 'مخطط أسنان تفاعلي', 'تقارير متقدمة'],
      popular: true,
    },
    {
      name: 'المتقدمة',
      price: '79',
      desc: 'للعيادات متعددة الفروع',
      features: ['كل ميزات الاحترافية', 'إدارة فروع متعددة', 'التصوير الطبي', 'خطط العلاج المتقدمة', 'فحص التأمين', 'دعم مخصص 24/7'],
      popular: false,
    },
  ];
  return (
    <section id="pricing" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-slate-800 sm:text-4xl">أسعار بسيطة وشفافة</h2>
          <p className="mt-3 text-base text-slate-500">اختر الباقة التي تناسب عيادتك — بدون رسوم خفية</p>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} direction="up" delay={i * 100}>
              <div
                className={`relative h-full rounded-2xl border-2 bg-white p-8 transition-all duration-300 hover:-translate-y-1 ${
                  p.popular ? 'border-sky-500 shadow-xl shadow-sky-500/10' : 'border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-4 right-1/2 translate-x-1/2 rounded-full bg-gradient-to-l from-sky-500 to-blue-600 px-4 py-1 text-xs font-bold text-white">
                    الأكثر شعبية
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-800">{p.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{p.desc}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-slate-800">{p.price}</span>
                  <span className="mb-1 text-base font-semibold text-slate-500">د.أ / شهر</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full ${p.popular ? 'bg-sky-100 text-sky-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        <Check size={12} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onLaunchDemo}
                  className={`mt-8 w-full rounded-xl px-6 py-3 text-base font-semibold transition-all ${
                    p.popular
                      ? 'bg-gradient-to-l from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30 hover:shadow-xl'
                      : 'border-2 border-sky-500 text-sky-600 hover:bg-sky-50'
                  }`}
                >
                  ابدأ الآن
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ Testimonials ============ */
function Testimonials() {
  const items = [
    {
      name: 'د. أحمد الخطيب',
      clinic: 'عيادة سمايل لطب الأسنان',
      img: IMG.doctorPortrait,
      text: 'النظام غيّر طريقة عملنا تماماً. التذكيرات التلقائية قللت الغياب بنسبة 60% والفوترة الإلكترونية وفرت ساعات من العمل يومياً.',
    },
    {
      name: 'د. سارة العمري',
      clinic: 'مركز العمري لطب الأسنان',
      img: IMG.doctorPortrait2,
      text: 'أفضل استثمار قمت به للعيادة. واجهة بسيطة جداً وموظفات الاستقبال تعلمنها في يوم واحد. الدعم ممتاز.',
    },
    {
      name: 'د. ناصر الزعبي',
      clinic: 'عيادات الزعبي لطب الأسنان',
      img: IMG.doctorPortrait3,
      text: 'كمدير لثلاثة فروع، التقارير المالية الفورية ساعدتني أتخذ قرارات أفضل. رابط CliQ سهّل التحصيل بشكل كبير.',
    },
  ];
  return (
    <section id="testimonials" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-slate-800 sm:text-4xl">ماذا يقول أطباء الأسنان؟</h2>
          <p className="mt-3 text-base text-slate-500">أكثر من 200 عيادة في الأردن تستخدم نظامنا يومياً</p>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {items.map((t, i) => (
            <Reveal key={t.name} direction="up" delay={i * 100}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={18} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-slate-600">"{t.text}"</p>
                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <img
                    src={t.img}
                    alt={t.name}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-sky-100"
                  />
                  <div>
                    <p className="font-bold text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.clinic}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ Final CTA ============ */
function FinalCTA({ onLaunchDemo }: { onLaunchDemo: () => void }) {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl shadow-2xl">
            <img src={IMG.clinic} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-l from-sky-600/95 to-blue-800/95" />
            {/* pattern خفيف */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

            <div className="relative px-6 py-16 text-center sm:px-12">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">جاهز لتطوير عيادتك؟</h2>
              <p className="mt-3 text-base text-sky-100">ابدأ تجربتك المجانية اليوم — 14 يوماً بدون أي رسوم</p>
              <button
                onClick={onLaunchDemo}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-sky-600 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                ابدأ التجربة المجانية 14 يوم
                <ArrowLeft size={20} />
              </button>
              <p className="mt-4 text-xs text-sky-200">لا حاجة لبطاقة ائتمان · إلغاء في أي وقت</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============ Enhanced Footer ============ */
function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 2500);
  };

  const socials = [
    { icon: Facebook, label: 'فيسبوك' },
    { icon: Instagram, label: 'إنستغرام' },
    { icon: Twitter, label: 'تويتر' },
    { icon: Youtube, label: 'يوتيوب' },
  ];

  const sitemap = [
    { title: 'النظام', links: ['الميزات', 'العرض', 'التسعير', 'الأسئلة الشائعة'] },
    { title: 'الحلول', links: ['العيادات الفردية', 'السلاسل', 'العيادات الجامعية', 'العيادات الحكومية'] },
    { title: 'الشركة', links: ['من نحن', 'المدونة', 'الوظائف', 'تواصل معنا'] },
  ];

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* النشرة البريدية */}
        <div className="mb-12 grid items-center gap-6 rounded-2xl bg-slate-800 p-6 sm:p-8 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-bold text-white">اشترك في نشرتنا البريدية</h3>
            <p className="mt-1 text-sm text-slate-400">أحدث الميزات ونصائح إدارة العيادات — مرة في الشهر</p>
          </div>
          <form onSubmit={subscribe} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="بريدك الإلكتروني"
              className="flex-1 rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-sm text-white placeholder-slate-400 outline-none transition-colors focus:border-sky-400"
            />
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-l from-sky-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg"
            >
              {subscribed ? <Check size={16} /> : <Send size={16} />}
              {subscribed ? 'تم!' : 'اشترك'}
            </button>
          </form>
        </div>

        {/* خريطة الموقع */}
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white">
                <Stethoscope size={18} />
              </div>
              <span className="text-base font-extrabold text-white">عيادة سمايل</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-400">نظام إدارة عيادات الأسنان الأول في الأردن — مصمم للسوق المحلي بدعم كامل للعربية.</p>
            <div className="mt-4 space-y-2 text-sm text-slate-400">
              <p className="flex items-center gap-2"><Phone size={14} /> 06-555-1234</p>
              <p className="flex items-center gap-2"><Mail size={14} /> info@smile.jo</p>
              <p className="flex items-center gap-2"><MapPin size={14} /> عمّان، الأردن</p>
            </div>
            {/* روابط سوشيال */}
            <div className="mt-5 flex gap-3">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href="#"
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition-all hover:bg-sky-500 hover:text-white"
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>

          {sitemap.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-bold text-white">{col.title}</h4>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-slate-400 transition-colors hover:text-sky-400">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
          © 2025 عيادة سمايل. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}

/* ============ Landing Page ============ */
/* ============ AI Showcase Banner ============ */
function AIShowcaseBanner({ onGoToAIShowcase }: { onGoToAIShowcase: () => void }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-fuchsia-950 px-6 py-20">
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-0 h-72 w-72 animate-pulse rounded-full bg-violet-500 opacity-20 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-72 w-72 animate-pulse rounded-full bg-fuchsia-500 opacity-20 blur-3xl" style={{ animationDelay: '2s' }} />
      </div>
      <div className="relative mx-auto max-w-5xl">
        <Reveal className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-bold text-violet-300">
            <Sparkles size={16} />
            جديد — ثلاثة أنظمة ذكاء اصطناعي
          </div>
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            ذكاء اصطناعي يعمل{' '}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              داخل عيادتك
            </span>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300">
            مساعد صوتي يحجز المواعيد، تحليل ذكي لصور الأشعة، وتنبؤ بغياب المرضى — خصوصية تامة، بدون رسوم شهرية
          </p>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: Mic, title: 'مساعد صوتي', desc: 'يتحدث مع مرضاك ويحجز المواعيد تلقائياً' },
            { icon: Scan, title: 'تحليل الأشعة', desc: 'يكشف التسوس والمشاكل في ثوانٍ' },
            { icon: TrendingDown, title: 'تنبؤ الغياب', desc: 'يحذرك قبل غياب المريض' },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} direction="up" delay={i * 100}>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-lg transition-all hover:bg-white/10">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
                    <Icon size={26} />
                  </div>
                  <p className="font-bold text-white">{f.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{f.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
        <Reveal className="mt-10 text-center">
          <button
            onClick={onGoToAIShowcase}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-8 py-4 text-lg font-bold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-fuchsia-500/30"
          >
            <Brain size={20} />
            استكشف الذكاء الاصطناعي
            <ArrowLeft size={20} />
          </button>
        </Reveal>
      </div>
    </section>
  );
}

export default function LandingPage({ onLaunchDemo, onGoToWhyUs, onGoToAIShowcase }: Props) {
  useSmoothScroll();

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Navbar onLaunchDemo={onLaunchDemo} />
      <Hero onLaunchDemo={onLaunchDemo} onGoToWhyUs={onGoToWhyUs} onGoToAIShowcase={onGoToAIShowcase} />
      <TrustedBy />
      <AllInOne />
      <ClientLogos />
      <WhatYoullLove />
      <WhatPatientsLove />
      <FeaturesGrid />
      <Showcase />
      <AIShowcaseBanner onGoToAIShowcase={onGoToAIShowcase} />
      <Pricing onLaunchDemo={onLaunchDemo} />
      <Testimonials />
      <FAQ />
      <FinalCTA onLaunchDemo={onLaunchDemo} />
      <Footer />
      <ChatWidget />
    </div>
  );
}
