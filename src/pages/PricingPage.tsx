import { useState, useEffect } from 'react';
import { Check, Star, Zap, Crown, Building2, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ClinicPlan, PlanId } from '@/types/saas';

type Props = {
  onBack: () => void;
  onSelectPlan: (planId: PlanId) => void;
};

const PLAN_ICONS: Record<PlanId, typeof Zap> = {
  basic: Zap,
  pro: Sparkles,
  enterprise: Crown,
};

const PLAN_GRADIENTS: Record<PlanId, string> = {
  basic: 'from-sky-400 to-blue-500',
  pro: 'from-teal-400 to-emerald-500',
  enterprise: 'from-amber-400 to-orange-500',
};

export default function PricingPage({ onBack, onSelectPlan }: Props) {
  const [plans, setPlans] = useState<ClinicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('clinic_plans')
        .select('*')
        .order('sort_order');
      if (data) {
        setPlans(data.map((p: Record<string, unknown>) => ({
          id: p.id as PlanId,
          name: p.name as string,
          nameAr: p.name_ar as string,
          priceMonthly: p.price_monthly as number,
          priceYearly: p.price_yearly as number,
          currency: p.currency as string,
          maxUsers: p.max_users as number,
          maxPatients: p.max_patients as number,
          features: p.features as string[],
          popular: p.popular as boolean,
          sortOrder: p.sort_order as number,
        })));
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600">
            <ArrowLeft size={18} className="rotate-180" />
            العودة للرئيسية
          </button>
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700">
            <Building2 size={16} />
            DentalPro SaaS
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-800 sm:text-5xl">
            أسعار شفافة لكل حجم عيادة
          </h1>
          <p className="mt-4 text-lg text-slate-500">
            اختر الباقة المناسبة — ابدأ تجربة مجانية 14 يوماً بدون بطاقة ائتمان
          </p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-elev-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500'}`}
            >
              شهري
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${billingCycle === 'yearly' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500'}`}
            >
              سنوي
              <span className="mr-1.5 rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">وفّر 17%</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
          </div>
        ) : (
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => {
              const Icon = PLAN_ICONS[plan.id];
              const price = billingCycle === 'monthly' ? plan.priceMonthly : Math.round(plan.priceYearly / 12);
              const isPopular = plan.popular;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-3xl border bg-white p-8 shadow-elev-1 transition-all hover:shadow-elev-3 ${isPopular ? 'border-sky-400 ring-2 ring-sky-400/30 lg:-translate-y-4' : 'border-slate-200'}`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 right-1/2 translate-x-1/2">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-l from-sky-500 to-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-md">
                        <Star size={13} className="fill-white" />
                        الأكثر شعبية
                      </div>
                    </div>
                  )}

                  <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${PLAN_GRADIENTS[plan.id]} text-white shadow-lg`}>
                    <Icon size={28} />
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-800">{plan.nameAr}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {plan.id === 'basic' && 'للعيادات الفردية الصغيرة'}
                    {plan.id === 'pro' && 'للعيادات المتوسطة النامية'}
                    {plan.id === 'enterprise' && 'لسلاسل العيادات المتعددة'}
                  </p>

                  <div className="mt-6 flex items-end gap-2">
                    <span className="text-5xl font-extrabold text-slate-800">${price}</span>
                    <span className="mb-2 text-sm font-medium text-slate-400">/ شهر</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="mt-1 text-xs font-semibold text-emerald-600">
                      ${plan.priceYearly} سنوياً — وفّر ${(plan.priceMonthly * 12) - plan.priceYearly}
                    </p>
                  )}

                  <div className="mt-6 flex gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-sky-500" /> {plan.maxUsers} مستخدمين</span>
                    <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-sky-500" /> {plan.maxPatients.toLocaleString('en-US')} مريض</span>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <Check size={18} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => onSelectPlan(plan.id)}
                    className={`mt-8 w-full rounded-xl py-3.5 text-base font-bold transition-all ${isPopular ? 'bg-gradient-to-l from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30 hover:shadow-xl' : 'border-2 border-slate-200 text-slate-700 hover:border-sky-400 hover:text-sky-600'}`}
                  >
                    ابدأ تجربة مجانية
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-16 rounded-3xl bg-gradient-to-l from-slate-800 to-slate-900 p-10 text-center text-white">
          <h2 className="text-2xl font-extrabold">طرق دفع متعددة للوطن العربي</h2>
          <p className="mt-2 text-slate-300">ندعم جميع وسائل الدفع المحلية والعالمية</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {['💳 Stripe', '🅿️ PayPal', '🏦 مدى', '📱 فوري', '⚡ CliQ'].map((m) => (
              <div key={m} className="rounded-2xl bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur-sm">
                {m}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3 text-center">
          <div className="rounded-2xl bg-white p-6 shadow-elev-1">
            <ShieldCheck className="mx-auto text-sky-500" size={32} />
            <h3 className="mt-3 font-bold text-slate-800">دفع آمن</h3>
            <p className="mt-1 text-sm text-slate-500">تشفير SSL ومتوافق مع PCI</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-elev-1">
            <Zap className="mx-auto text-amber-500" size={32} />
            <h3 className="mt-3 font-bold text-slate-800">إلغاء في أي وقت</h3>
            <p className="mt-1 text-sm text-slate-500">بدون عقود أو رسوم خفية</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-elev-1">
            <Crown className="mx-auto text-emerald-500" size={32} />
            <h3 className="mt-3 font-bold text-slate-800">دعم ذو أولوية</h3>
            <p className="mt-1 text-sm text-slate-500">فريق دعم عربي متخصص</p>
          </div>
        </div>
      </section>
    </div>
  );
}
