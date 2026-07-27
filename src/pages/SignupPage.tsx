import { useState } from 'react';
import { Stethoscope, ArrowLeft, Mail, Lock, Building2, User, Phone, Globe, Check, Eye, EyeOff, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getRedirectTo } from '@/auth';
import type { PlanId, ClinicRole } from '@/types/saas';
import { COUNTRIES, CURRENCIES } from '@/types/saas';

type Props = {
  onBack: () => void;
  onSuccess: () => void;
  selectedPlan: PlanId;
  signIn: (email: string, password: string) => Promise<void>;
};

const PLAN_LABELS: Record<PlanId, string> = {
  basic: 'الأساسية',
  pro: 'الاحترافية',
  enterprise: 'المؤسسية',
};

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function SignupPage({ onBack, onSuccess, selectedPlan, signIn }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [clinicName, setClinicName] = useState('');
  const [country, setCountry] = useState('JO');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const currency = COUNTRIES[country]?.currency || 'JOD';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!clinicName.trim()) {
        setError('الرجاء إدخال اسم العيادة');
        return;
      }
      setStep(2);
      return;
    }

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('الرجاء إكمال جميع الحقول');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: getRedirectTo() },
      });
      if (signUpError) throw signUpError;

      const userId = authData.user?.id;
      if (!userId) throw new Error('فشل إنشاء الحساب');

      const slug = slugify(clinicName) || `clinic-${Date.now()}`;
      const subdomain = `${slug}.dentalpro.ai`;
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .insert({
          name: clinicName.trim(),
          slug,
          subdomain,
          plan_id: selectedPlan,
          status: 'trialing',
          trial_ends_at: trialEndsAt,
          country,
          currency,
          phone: phone.trim() || null,
          email: email.trim(),
        })
        .select()
        .single();

      if (clinicError) throw clinicError;

      const { error: memberError } = await supabase
        .from('clinic_members')
        .insert({
          clinic_id: clinic.id,
          user_id: userId,
          role: 'admin' as ClinicRole,
          full_name: fullName.trim(),
          email: email.trim(),
        });

      if (memberError) throw memberError;

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          clinic_id: clinic.id,
          plan_id: selectedPlan,
          status: 'trialing',
          billing_cycle: 'monthly',
          current_period_start: new Date().toISOString(),
          current_period_end: trialEndsAt,
          amount: 0,
          currency: 'USD',
        });

      if (subError) throw subError;

      await signIn(email.trim(), password);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('user already')) {
        setError('هذا البريد مسجل مسبقاً. سجّل الدخول بدلاً من ذلك');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 p-4" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-sky-900/40 to-slate-900" />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <button onClick={onBack} className="absolute right-6 top-6 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
        <ArrowLeft size={16} />
        العودة
      </button>

      <div className="relative z-10 w-full max-w-lg">
        <div className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-elev-4 backdrop-blur-xl sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-elev-2 shadow-sky-500/30">
              <Stethoscope size={32} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800">إنشاء حساب العيادة</h1>
            <p className="mt-1 text-sm text-slate-500">
              الباقة: <span className="font-bold text-sky-600">{PLAN_LABELS[selectedPlan]}</span> — تجربة 14 يوماً مجاناً
            </p>
          </div>

          <div className="mb-6 flex items-center justify-center gap-2">
            {[1, 2].map((s) => (
              <div key={s} className={`h-2 rounded-full transition-all ${s === step ? 'w-8 bg-sky-500' : 'w-2 bg-slate-200'}`} />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">اسم العيادة</label>
                  <div className="relative">
                    <Building2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="عيادة الابتسامة"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-4 text-sm text-slate-700 outline-none transition-all focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">الدولة</label>
                  <div className="relative">
                    <Globe size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-4 text-sm text-slate-700 outline-none transition-all focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50"
                    >
                      {Object.entries(COUNTRIES).map(([code, c]) => (
                        <option key={code} value={code}>{c.nameAr}</option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">العملة: {CURRENCIES[currency]?.nameAr}</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">رقم الهاتف (اختياري)</label>
                  <div className="relative">
                    <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+962 7X XXX XXXX"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-4 text-sm text-slate-700 outline-none transition-all focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-sky-500 to-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-elev-2 shadow-sky-500/30 transition-all hover:shadow-xl"
                >
                  التالي
                  <ArrowLeft size={20} />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">الاسم الكامل</label>
                  <div className="relative">
                    <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="د. أحمد محمد"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-4 text-sm text-slate-700 outline-none transition-all focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@clinic.jo"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-4 text-sm text-slate-700 outline-none transition-all focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">كلمة المرور</label>
                  <div className="relative">
                    <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-12 text-sm text-slate-700 outline-none transition-all focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-50"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-sky-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-sky-700">
                    <Sparkles size={16} />
                    تجربة مجانية 14 يوماً — بدون بطاقة ائتمان
                  </div>
                  <ul className="mt-2 space-y-1">
                    {['جميع المميزات مفعّلة', 'إلغاء في أي وقت', 'دعم فني عربي'].map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Check size={13} className="text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {error && <div className="rounded-xl bg-error-50 px-4 py-3 text-sm font-medium text-error-600">{error}</div>}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="rounded-xl border-2 border-slate-200 px-6 py-3.5 text-sm font-bold text-slate-600 transition-all hover:border-slate-300">
                    السابق
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-sky-500 to-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-elev-2 shadow-sky-500/30 transition-all hover:shadow-xl disabled:opacity-70"
                  >
                    {loading ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>إنشاء الحساب<ArrowLeft size={20} /></>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-sky-200/80">© 2026 DentalPro. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  );
}
