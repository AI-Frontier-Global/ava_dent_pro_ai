import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Play,
  RefreshCw,
  Terminal,
  Package,
  Server,
  Cpu,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  checkBridgeStatus,
  downloadBridgeFiles,
  launchBridge,
  runSetupChecks,
  markSetupComplete,
  type SetupCheck,
} from '../lib/bridge-manager';
import { useToast } from '../components/Toast';

interface Props {
  onComplete: () => void;
}

type Step = 'check' | 'install' | 'launch' | 'done';

export default function SetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('check');
  const [checks, setChecks] = useState<SetupCheck | null>(null);
  const [checking, setChecking] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const toast = useToast();

  const runChecks = useCallback(async () => {
    setChecking(true);
    const result = await runSetupChecks();
    setChecks(result);
    setChecking(false);
    if (result.bridgeRunning) {
      setStep('done');
    }
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const handleDownload = async () => {
    setDownloading(true);
    const result = await downloadBridgeFiles();
    setDownloading(false);
    toast(result.message, result.success ? 'success' : 'error');
    if (result.success) setStep('launch');
  };

  const handleLaunch = async () => {
    setLaunching(true);
    launchBridge();
    // انتظر ثم افحص الاتصال
    setTimeout(async () => {
      const result = await checkBridgeStatus();
      setLaunching(false);
      if (result.state === 'online') {
        toast('الجسر متصل بنجاح!', 'success');
        markSetupComplete();
        setStep('done');
      } else {
        toast('الجسر لا يزال غير متصل — تأكد من تشغيله في نافذة CMD', 'error');
      }
    }, 5000);
  };

  const handleFinish = () => {
    markSetupComplete();
    onComplete();
  };

  const allReady = checks?.bridgeRunning;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl animate-modal-in">
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-100 bg-gradient-to-l from-slate-700 to-slate-900 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">التثبيت الأولي للذكاء الاصطناعي</h2>
                <p className="text-sm text-slate-300">إعداد الجسر المحلي للذكاء الاصطناعي — خطوة واحدة فقط</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Step indicator */}
            <div className="mb-6 flex items-center justify-center gap-2">
              {(['check', 'install', 'launch', 'done'] as Step[]).map((s, i) => {
                const active = step === s;
                const passed = (['check', 'install', 'launch', 'done'] as Step[]).indexOf(step) > i;
                return (
                  <div key={s} className="flex items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        active
                          ? 'bg-brand-500 text-white'
                          : passed
                            ? 'bg-success-100 text-success-700'
                            : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {passed ? <CheckCircle2 size={16} /> : i + 1}
                    </div>
                    {i < 3 && <div className={`h-1 w-12 ${passed ? 'bg-success-300' : 'bg-slate-200'}`} />}
                  </div>
                );
              })}
            </div>

            {/* Step: Check */}
            {step === 'check' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800">فحص الخدمات</h3>

                <div className="rounded-xl border border-warning-200 bg-warning-50 p-3 text-xs text-warning-800">
                  <p className="font-bold mb-1">ملاحظة مهمة حول التشغيل</p>
                  <p>
                    المتصفحات تمنع الاتصال بالشبكة المحلية (localhost) من موقع bolt.host لأسباب أمنية.
                    لتشغيل المساعد الذكي المحلي بدون قيود، شغّل النظام على جهازك مباشرة باستخدام ملف{' '}
                    <code className="rounded bg-warning-100 px-1.5 py-0.5">start-local.bat</code> ثم افتح{' '}
                    <code className="rounded bg-warning-100 px-1.5 py-0.5">http://localhost:5173</code>.
                  </p>
                </div>

                <div className="space-y-3">
                  <CheckRow icon={Terminal} label="Node.js" checking={checking} ok={checks?.nodeInstalled} />
                  <CheckRow icon={Cpu} label="Ollama" checking={checking} ok={checks?.ollamaInstalled} />
                  <CheckRow icon={Server} label="الجسر المحلي (منفذ 3001)" checking={checking} ok={checks?.bridgeRunning} />
                  <CheckRow icon={Package} label="النماذج محملة" checking={checking} ok={checks?.modelsLoaded} />
                </div>
                {!checking && !allReady && (
                  <div className="flex justify-end">
                    <button onClick={() => setStep('install')} className="btn-primary">
                      التالي: تثبيت المتطلبات
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
                {!checking && allReady && (
                  <div className="rounded-xl bg-success-50 p-4 text-sm text-success-700">
                    كل الخدمات تعمل! يمكنك البدء باستخدام النظام مباشرة.
                  </div>
                )}
                <button onClick={runChecks} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700">
                  <RefreshCw size={12} /> إعادة الفحص
                </button>
              </div>
            )}

            {/* Step: Install */}
            {step === 'install' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800">تحميل وتثبيت المتطلبات</h3>
                <p className="text-sm text-slate-500">
                  حمّل وثبّت البرامج التالية على جهاز العيادة. هذه خطوة واحدة تتم مرة واحدة فقط.
                </p>

                <div className="space-y-3">
                  <DownloadCard
                    icon={Terminal}
                    title="Node.js"
                    description="بيئة تشغيل JavaScript — مطلوبة لتشغيل الجسر"
                    link="https://nodejs.org"
                    linkLabel="تحميل من nodejs.org"
                  />
                  <DownloadCard
                    icon={Cpu}
                    title="Ollama"
                    description="مشغّل النماذج المحلي — يحمّل ويشغّل نماذج الذكاء الاصطناعي"
                    link="https://ollama.com"
                    linkLabel="تحميل من ollama.com"
                  />
                  <DownloadCard
                    icon={Package}
                    title="ملفات الجسر"
                    description="ملفا local-ollama-bridge.js و setup-bridge.bat"
                    onClick={handleDownload}
                    downloading={downloading}
                    linkLabel="تحميل ملفات الجسر"
                  />
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep('check')} className="text-sm text-slate-500 hover:text-slate-700">
                    رجوع
                  </button>
                  <button onClick={() => setStep('launch')} className="btn-primary">
                    التالي: تشغيل الجسر
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step: Launch */}
            {step === 'launch' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800">تشغيل الجسر</h3>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="mb-3 text-sm text-slate-600">للتشغيل اليدوي:</p>
                  <ol className="space-y-2 text-sm text-slate-600">
                    <li>1. افتح موجه الأوامر (CMD) في مجلد التنزيلات</li>
                    <li>2. نفّذ الأمر: <code className="rounded bg-slate-200 px-2 py-0.5 text-xs">node local-ollama-bridge.js</code></li>
                    <li>3. اترك النافذة مفتوحة أثناء استخدام النظام</li>
                  </ol>
                </div>

                <button
                  onClick={handleLaunch}
                  disabled={launching}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-success-500 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-elev-2 disabled:opacity-60"
                >
                  {launching ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      جاري الفحص...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      تشغيل الجسر الآن
                    </>
                  )}
                </button>

                <div className="flex justify-between">
                  <button onClick={() => setStep('install')} className="text-sm text-slate-500 hover:text-slate-700">
                    رجوع
                  </button>
                  <button onClick={runChecks} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
                    <RefreshCw size={14} /> إعادة الفحص
                  </button>
                </div>
              </div>
            )}

            {/* Step: Done */}
            {step === 'done' && (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
                  <CheckCircle2 size={32} className="text-success-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">اكتمل التثبيت!</h3>
                <p className="text-sm text-slate-500">
                  الجسر المحلي متصل ويعمل. يمكنك الآن استخدام جميع ميزات الذكاء الاصطناعي في النظام.
                </p>
                <button onClick={handleFinish} className="btn-primary mx-auto">
                  ابدأ استخدام النظام
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckRow({
  icon: Icon,
  label,
  checking,
  ok,
}: {
  icon: typeof Terminal;
  label: string;
  checking: boolean;
  ok?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon size={18} />
        </div>
        <span className="font-medium text-slate-700">{label}</span>
      </div>
      {checking ? (
        <Loader2 size={18} className="animate-spin text-slate-400" />
      ) : ok ? (
        <CheckCircle2 size={18} className="text-success-500" />
      ) : (
        <XCircle size={18} className="text-error-400" />
      )}
    </div>
  );
}

function DownloadCard({
  icon: Icon,
  title,
  description,
  link,
  linkLabel,
  onClick,
  downloading,
}: {
  icon: typeof Terminal;
  title: string;
  description: string;
  link?: string;
  linkLabel: string;
  onClick?: () => void;
  downloading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon size={20} />
        </div>
        <div>
          <p className="font-semibold text-slate-700">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      {onClick ? (
        <button
          onClick={onClick}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-60"
        >
          {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {downloading ? 'جاري...' : linkLabel}
        </button>
      ) : (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
        >
          <Download size={14} />
          {linkLabel}
        </a>
      )}
    </div>
  );
}
