import { useState, useEffect } from 'react';
import { Stethoscope, Mail, Lock, ArrowLeft, Eye, EyeOff, ShieldCheck, Star, UserPlus, LogIn } from 'lucide-react';

type Props = {
  onLogin: () => void;
  onBack: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
};

const STORAGE_KEY = 'smile-clinic-remember';

export default function LoginPageV2({ onLogin, onBack, signIn, signUp, signInWithGoogle }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.email) setEmail(data.email);
        if (data.password) setPassword(data.password);
        if (data.remember) setRemember(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('الرجاء إدخال البريد وكلمة المرور');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
        await signIn(email.trim(), password);
      }
      if (remember) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: email.trim(), password, remember: true }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      onLogin();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      if (msg.toLowerCase().includes('invalid login')) {
        setError('البريد أو كلمة المرور غير صحيحة');
      } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('user already')) {
        setError('هذا البريد مسجل مسبقاً. سجّل الدخول بدلاً من ذلك');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذّر الاتصال بحساب جوجل';
      setError(msg);
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden p-4"
      dir="rtl"
      style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 40%, #1e293b 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />

      <button
        onClick={onBack}
        className="absolute right-6 top-6 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
      >
        <ArrowLeft size={16} />
        العودة للموقع
      </button>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-white/30 bg-white/95 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-accent-600 text-white shadow-lg shadow-brand-500/30">
              <Stethoscope size={32} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800">عيادة سمايل</h1>
            <p className="mt-1 text-sm text-slate-500">نظام إدارة عيادات الأسنان</p>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={13} className="fill-warning-400 text-warning-400" />
              ))}
              <span className="mr-1 text-xs font-medium text-slate-500">موثوق من 2,500+ عيادة</span>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all ${
                mode === 'login' ? 'bg-white text-brand-700 shadow-elev-1' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LogIn size={16} />
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all ${
                mode === 'signup' ? 'bg-white text-brand-700 shadow-elev-1' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserPlus size={16} />
              حساب جديد
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-4 text-sm text-slate-700 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-12 text-sm text-slate-700 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label="إظهار كلمة المرور"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 focus:ring-offset-0"
                />
                حفظ البريد وكلمة المرور لهذا الجهاز
              </label>
            )}

            {error && (
              <div className="rounded-xl bg-error-50 px-4 py-3 text-sm font-medium text-error-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand-500 to-accent-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-500/30 transition-all hover:shadow-xl disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  جاري المعالجة...
                </span>
              ) : (
                <>
                  {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
                  <ArrowLeft size={20} />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">أو</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-elev-1 transition-all duration-sm hover:bg-slate-50 hover:shadow-elev-2 active:scale-[0.98] disabled:opacity-70"
          >
            {googleLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            أو سجل الدخول عبر Google
          </button>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck size={14} />
            اتصال آمن ومشفّر — بياناتك محمية
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-brand-200/80">© 2025 عيادة سمايل. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  );
}
