import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Brain,
  Mic,
  TrendingDown,
  Activity,
  AlertTriangle,
  Phone,
  Clock,
  Calendar,
  Sparkles,
  Volume2,
  Send,
  Zap,
  ShieldCheck,
  Radio,
  Target,
  Database,
  CheckCircle2,
} from 'lucide-react';
import type { Store } from '../store';
import { computeClinicInsights, predictNoShowWithModel, RISK_STYLES } from '../lib/noShowEngine';
import type { NoShowPrediction } from '../lib/noShowEngine';
import { createVoiceAssistant } from '../lib/voiceAssistant';
import type { VoiceAssistant, VoiceState, VoiceMessage } from '../lib/voiceAssistant';
import { buildTrainingSet, trainLogisticRegression } from '../lib/mlModel';
import type { ModelWeights } from '../lib/mlModel';
import { loadModel, saveModel, getModelMeta } from '../lib/modelStore';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

type Tab = 'voice' | 'noshow' | 'insights';

type Props = { store: Store };

export default function AIHubPage({ store }: Props) {
  const [tab, setTab] = useState<Tab>('insights');
  const toast = useToast();

  const insights = useMemo(
    () => computeClinicInsights(store.appointments, store.patients),
    [store.appointments, store.patients],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-elev-2 shadow-violet-500/20">
            <Brain size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">مركز الذكاء الاصطناعي</h2>
            <p className="text-sm text-slate-500">أدوات ذكية تعمل مع بيانات عيادتك مباشرة</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-success-50 px-4 py-2 text-sm font-semibold text-success-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success-500" />
          </span>
          نشط
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-elev-1">
        {[
          { id: 'insights' as Tab, label: 'تحليلات العيادة', icon: Activity },
          { id: 'noshow' as Tab, label: 'تنبؤ الغياب', icon: TrendingDown },
          { id: 'voice' as Tab, label: 'المساعد الصوتي', icon: Mic },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-gradient-to-l from-violet-500 to-fuchsia-600 text-white shadow-md'
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
      {tab === 'insights' && <InsightsTab insights={insights} />}
      {tab === 'noshow' && <NoShowTab store={store} insights={insights} toast={toast} />}
      {tab === 'voice' && <VoiceTab />}
    </div>
  );
}

/* ============ Insights Tab ============ */
function InsightsTab({ insights }: { insights: ReturnType<typeof computeClinicInsights> }) {
  const stats = [
    { label: 'إجمالي المواعيد', value: insights.totalAppointments, icon: Calendar, color: 'from-blue-500 to-accent-600' },
    { label: 'معدل الإكمال', value: `${insights.completedRate}%`, icon: ShieldCheck, color: 'from-success-500 to-brand-600' },
    { label: 'معدل الإلغاء', value: `${insights.noShowRate}%`, icon: AlertTriangle, color: 'from-error-500 to-red-600' },
    { label: 'مواعيد قادمة', value: insights.upcoming, icon: Clock, color: 'from-violet-500 to-fuchsia-600' },
  ];

  return (
    <div className="space-y-6">
      {/* AI Summary banner */}
      <div className="rounded-2xl border border-violet-200 bg-gradient-to-l from-violet-50 to-fuchsia-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-800">ملخص ذكي للعيادة</p>
            <p className="mt-1 text-sm text-slate-600">{insights.summary}</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-5">
              <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Patterns */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Calendar size={16} /> أكثر يوم ازدحاماً
          </p>
          <p className="text-2xl font-bold text-slate-800">{insights.busiestDay ?? '—'}</p>
        </div>
        <div className="card p-5">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Clock size={16} /> أكثر ساعة ازدحاماً
          </p>
          <p className="text-2xl font-bold text-slate-800">
            {insights.busiestHour !== null ? `${insights.busiestHour}:00` : '—'}
          </p>
        </div>
        <div className="card p-5">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Activity size={16} /> متوسط الفترة بين الزيارات
          </p>
          <p className="text-2xl font-bold text-slate-800">
            {insights.averageGapDays !== null ? `${insights.averageGapDays} يوم` : '—'}
          </p>
        </div>
      </div>

      {/* High risk alert */}
      {insights.highRiskCount > 0 && (
        <div className="rounded-2xl border border-error-200 bg-error-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error-500 text-white">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="font-bold text-error-800">تنبيه: {insights.highRiskCount} مريض عالي مخاطر الغياب</p>
              <p className="mt-1 text-sm text-error-600">
                يُنصح بالتواصل معهم قبل مواعيدهم لتأكيد الحضور. انتقل لتبويب "تنبؤ الغياب" للتفاصيل.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ No-Show Tab ============ */
function NoShowTab({
  store,
  insights,
  toast,
}: {
  store: Store;
  insights: ReturnType<typeof computeClinicInsights>;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all');
  const [model, setModel] = useState<ModelWeights | null>(null);
  const [modelMeta, setModelMeta] = useState<{ trainedAt: string | null; trainingExamples: number; trainingAccuracy: number } | null>(null);
  const [training, setTraining] = useState(false);

  // Load persisted model on mount
  useEffect(() => {
    void (async () => {
      const m = await loadModel();
      if (m && m.trainingExamples > 0) {
        setModel(m);
        const meta = await getModelMeta();
        setModelMeta(meta);
      }
    })();
  }, []);

  const mlPredictions = useMemo(() => {
    if (!model || model.trainingExamples === 0) return null;
    const now = new Date().toISOString().slice(0, 10);
    const upcoming = store.appointments.filter(
      (a) => a.appointmentDate && a.appointmentDate >= now && a.status !== 'تم' && a.status !== 'ملغى',
    );
    return upcoming
      .map((a) => {
        const patient = store.patients.find((p) => p.id === a.patientId);
        return predictNoShowWithModel(a, patient, store.appointments, model);
      })
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [model, store.appointments, store.patients]);

  const activePredictions = mlPredictions ?? insights.predictions;

  const filtered = useMemo(() => {
    if (filter === 'all') return activePredictions;
    return activePredictions.filter((p) => p.riskLevel === filter);
  }, [activePredictions, filter]);

  const handleTrain = async () => {
    setTraining(true);
    try {
      const examples = buildTrainingSet(store.appointments, store.patients);
      if (examples.length < 2) {
        toast('لا توجد بيانات كافية للتدريب — أضف مواعيد مكتملة وملغاة', 'error');
        setTraining(false);
        return;
      }
      const trained = trainLogisticRegression(examples, { learningRate: 0.1, iterations: 800 });
      await saveModel(trained);
      setModel(trained);
      const meta = await getModelMeta();
      setModelMeta(meta);
      toast(`تم تدريب النموذج على ${trained.trainingExamples} مثال بدقة ${Math.round(trained.trainingAccuracy * 100)}%`, 'success');
    } catch {
      toast('تعذر تدريب النموذج', 'error');
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="rounded-2xl border border-warning-200 bg-warning-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-500 text-white">
            <TrendingDown size={20} />
          </div>
          <div>
            <p className="font-bold text-warning-800">محرك التنبؤ بالغياب</p>
            <p className="mt-1 text-sm text-warning-700">
              نموذج تعلم آلي (Logistic Regression) يتدرب على بيانات عيادتك الحقيقية. كلما زادت المواعيد المسجلة، زادت دقة التنبؤ.
            </p>
          </div>
        </div>
      </div>

      {/* ML Model panel */}
      <div className="card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
              <Target size={22} />
            </div>
            <div>
              <p className="font-bold text-slate-800">نموذج التعلم الآلي</p>
              {modelMeta && modelMeta.trainingExamples > 0 ? (
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-50 px-2.5 py-1 font-semibold text-success-700">
                    <CheckCircle2 size={12} />
                    مدرب
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Database size={12} />
                    {modelMeta.trainingExamples} مثال
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Target size={12} />
                    دقة {Math.round(modelMeta.trainingAccuracy * 100)}%
                  </span>
                  {modelMeta.trainedAt && (
                    <span className="text-slate-400">
                      آخر تدريب: {new Date(modelMeta.trainedAt).toLocaleDateString('ar-JO')}
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  لم يتم تدريب النموذج بعد — يستخدم النظام الخوارزمية الافتراضية حتى يتوفر نموذج مدرب
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleTrain}
            disabled={training}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-violet-500 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-elev-2 disabled:opacity-60"
          >
            {training ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                جاري التدريب...
              </>
            ) : (
              <>
                <Zap size={16} />
                {modelMeta && modelMeta.trainingExamples > 0 ? 'إعادة التدريب' : 'تدريب النموذج'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all' as const, label: 'الكل', count: activePredictions.length },
          { id: 'high' as const, label: 'مرتفع', count: activePredictions.filter((p) => p.riskLevel === 'high').length },
          { id: 'medium' as const, label: 'متوسط', count: activePredictions.filter((p) => p.riskLevel === 'medium').length },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              filter === f.id
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Predictions */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center p-12 text-center">
          <Calendar size={40} className="mb-3 text-slate-300" />
          <p className="font-semibold text-slate-500">لا توجد مواعيد قادمة لتحليلها</p>
          <p className="mt-1 text-sm text-slate-400">أضف مواعيد من صفحة الجدولة لعرض تنبؤات الغياب</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <PredictionCard key={p.appointmentId} prediction={p} store={store} toast={toast} />
          ))}
        </div>
      )}
    </div>
  );
}

function PredictionCard({
  prediction,
  store,
  toast,
}: {
  prediction: NoShowPrediction;
  store: Store;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const style = RISK_STYLES[prediction.riskLevel];
  const appt = store.appointments.find((a) => a.id === prediction.appointmentId);
  const dayName = appt ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][appt.day] : '';

  return (
    <div className={`card overflow-hidden border-r-4 ${
      prediction.riskLevel === 'high' ? 'border-r-error-500' :
      prediction.riskLevel === 'medium' ? 'border-r-warning-500' : 'border-r-success-500'
    }`}>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600">
            {prediction.patientName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-800">{prediction.patientName}</p>
            <p className="text-xs text-slate-500">
              {dayName} {appt && `· ${appt.startHour}:00`} {appt && `· ${appt.reason}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-left">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${style.badge}`}>
              {style.label}
            </span>
            <p className="mt-1 text-2xl font-extrabold text-slate-800">{prediction.riskScore}%</p>
          </div>
        </div>
      </div>

      {/* Risk bar */}
      <div className="h-2 w-full bg-slate-100">
        <div
          className={`h-full ${style.bar} transition-all duration-700`}
          style={{ width: `${prediction.riskScore}%` }}
        />
      </div>

      {/* Factors */}
      <div className="p-5 pt-4">
        <p className="mb-2 text-xs font-semibold text-slate-500">عوامل المخاطر:</p>
        <div className="flex flex-wrap gap-2">
          {prediction.factors.map((f) => (
            <span key={f.label} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600 ring-1 ring-slate-200">
              <span className={`h-1.5 w-1.5 rounded-full ${style.bar}`} />
              {f.label}
              <span className="font-bold text-slate-400">+{f.weight}</span>
            </span>
          ))}
        </div>

        {/* Recommendation */}
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-violet-50 p-3 text-sm text-violet-700">
          <Sparkles size={16} className="mt-0.5 shrink-0" />
          <p>{prediction.recommendation}</p>
        </div>

        {/* Actions */}
        {prediction.riskLevel !== 'low' && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={async () => {
                try {
                  await store.updateAppointmentStatus(prediction.appointmentId, 'مؤكد');
                  toast('تم تأكيد الموعد', 'success');
                } catch {
                  toast('تعذر تأكيد الموعد', 'error');
                }
              }}
              className="flex items-center gap-1.5 rounded-lg bg-success-50 px-3 py-2 text-xs font-semibold text-success-700 transition-colors hover:bg-success-100"
            >
              <ShieldCheck size={14} />
              تأكيد الموعد
            </button>
            <button
              onClick={() => {
                const patient = store.patients.find((p) => p.id === prediction.patientId);
                if (patient?.phone) {
                  toast(`رقم المريض: ${patient.phone} — يرجى الاتصال للتأكيد`, 'info');
                } else {
                  toast('لا يوجد رقم هاتف مسجل لهذا المريض', 'error');
                }
              }}
              className="flex items-center gap-1.5 rounded-lg bg-error-50 px-3 py-2 text-xs font-semibold text-error-700 transition-colors hover:bg-error-100"
            >
              <Phone size={14} />
              اتصال للتأكيد
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ Voice Tab ============ */
function VoiceTab() {
  const [messages, setMessages] = useState<VoiceMessage[]>([
    { role: 'assistant', text: 'مرحباً! أنا سمايل، مساعدك الذكي. اضغط زر الميكروفون وتحدث، أو اكتب سؤالك بالأسفل.', timestamp: Date.now() },
  ]);
  const [state, setState] = useState<VoiceState>('idle');
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const assistantRef = useRef<VoiceAssistant | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [bridgeUrl, setBridgeUrl] = useState('http://localhost:3001');
  const [model, setModel] = useState('llama3.2');

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('clinic_ai_settings')
        .select('bridge_url, model')
        .eq('id', 1)
        .maybeSingle();
      if (data) {
        if (data.bridge_url) setBridgeUrl(data.bridge_url);
        if (data.model) setModel(data.model);
      }
    })();
  }, []);

  useEffect(() => {
    assistantRef.current = createVoiceAssistant(bridgeUrl, model, {
      onStateChange: setState,
      onUserMessage: (text) => {
        setMessages((prev) => [...prev, { role: 'user', text, timestamp: Date.now() }]);
      },
      onAssistantMessage: (text) => {
        setMessages((prev) => [...prev, { role: 'assistant', text, timestamp: Date.now() }]);
      },
      onError: (msg) => {
        setError(msg);
        setState('idle');
      },
    });
    return () => {
      assistantRef.current?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleMic = () => {
    setError(null);
    if (state === 'listening') {
      assistantRef.current?.stopListening();
    } else {
      assistantRef.current?.startListening();
    }
  };

  const handleSend = () => {
    if (!textInput.trim()) return;
    setError(null);
    assistantRef.current?.sendText(textInput.trim());
    setTextInput('');
  };

  const stateConfig: Record<VoiceState, { label: string; color: string }> = {
    idle: { label: 'جاهز', color: 'text-slate-400' },
    listening: { label: 'يستمع...', color: 'text-error-500' },
    thinking: { label: 'يفكر...', color: 'text-violet-500' },
    speaking: { label: 'يتحدث...', color: 'text-success-500' },
  };

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white">
            <Mic size={20} />
          </div>
          <div>
            <p className="font-bold text-violet-800">المساعد الصوتي الذكي</p>
            <p className="mt-1 text-sm text-violet-700">
              يستخدم التعرف الصوتي للمتصفح (Web Speech API) لفهم كلامك، ويرد عبر مساعد Ollama المحلي ثم ينطق الرد بصوت عربي.
              يعمل أفضل على Chrome أو Edge.
            </p>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="card flex h-[480px] flex-col">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-gradient-to-l from-violet-500 to-fuchsia-600 text-white'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-violet-100">
                    <Sparkles size={10} /> سمايل
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          ))}
          {state === 'thinking' && (
            <div className="flex justify-end">
              <div className="flex items-center gap-1 rounded-2xl bg-gradient-to-l from-violet-500 to-fuchsia-600 px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-slate-100 p-4">
          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-error-50 px-3 py-2 text-xs text-error-600">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}
          <div className="flex items-center gap-2">
            {/* Mic button */}
            <button
              onClick={handleMic}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all ${
                state === 'listening'
                  ? 'bg-error-500 text-white shadow-elev-2 shadow-error-500/30'
                  : 'bg-violet-500 text-white hover:bg-violet-600'
              }`}
              aria-label="تسجيل صوتي"
            >
              {state === 'listening' ? (
                <span className="relative flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-white" />
                </span>
              ) : (
                <Mic size={20} />
              )}
            </button>

            {/* Text input */}
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="اكتب سؤالك..."
              className="input flex-1"
              disabled={state === 'thinking' || state === 'speaking'}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!textInput.trim() || state === 'thinking'}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white transition-all hover:bg-slate-700 disabled:opacity-40"
              aria-label="إرسال"
            >
              <Send size={18} />
            </button>
          </div>

          {/* State indicator */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs">
            <Radio size={14} className={stateConfig[state].color} />
            <span className={`font-semibold ${stateConfig[state].color}`}>{stateConfig[state].label}</span>
            {state === 'speaking' && <Volume2 size={14} className="text-success-500" />}
          </div>
        </div>
      </div>

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-2">
        {[
          'كم مريض لدي غداً؟',
          'ما أسعار التنظيف؟',
          'أريد حجز موعد',
          'ما هي ساعات العمل؟',
        ].map((s) => (
          <button
            key={s}
            onClick={() => {
              setTextInput(s);
            }}
            className="rounded-full bg-white px-4 py-2 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-all hover:bg-slate-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
