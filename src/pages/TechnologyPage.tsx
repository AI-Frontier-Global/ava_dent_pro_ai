import { useState } from 'react';
import { ExternalLink, Check, X, Cloud, HardDrive, ArrowRight } from 'lucide-react';
import AIPartnersShowcase from '../components/AIPartnersShowcase';

type Tab = 'overview' | 'cloud' | 'local' | 'compare';

interface TechDetail {
  name: string;
  logo: React.ReactNode;
  description: string;
  features: string[];
  url: string;
}

export default function TechnologyPage() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-elev-2">
          <Cloud size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">التقنيات المستخدمة</h2>
          <p className="text-sm text-slate-500">نظرة مفصّلة على تقنيات الذكاء الاصطناعي التي نعتمد عليها</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-elev-1">
        {[
          { id: 'overview' as Tab, label: 'نظرة عامة', icon: Cloud },
          { id: 'cloud' as Tab, label: 'السحابي', icon: Cloud },
          { id: 'local' as Tab, label: 'المحلي', icon: HardDrive },
          { id: 'compare' as Tab, label: 'مقارنة', icon: ArrowRight },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-gradient-to-l from-slate-700 to-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'cloud' && <CloudTab />}
      {tab === 'local' && <LocalTab />}
      {tab === 'compare' && <CompareTab />}
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="mb-3 text-lg font-bold text-slate-800">نظام ذكاء اصطناعي هجين متكامل</h3>
        <p className="text-sm leading-relaxed text-slate-600">
          يعتمد نظامنا على بنية هجينة تجمع بين النماذج السحابية العالمية والنماذج المحلية الآمنة. هذا يضمن
          أفضل أداء مع حماية كاملة لخصوصية بيانات المرضى — يمكنك اختيار النموذج المناسب لكل مهمة حسب
          الحاجة.
        </p>
      </div>

      <AIPartnersShowcase />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <Cloud size={22} />
          </div>
          <h4 className="font-bold text-slate-800">النماذج السحابية</h4>
          <p className="mt-1 text-sm text-slate-500">
            أقوى نماذج الذكاء الاصطناعي عالمياً — GPT-4 و Claude و Gemini — للأغراض التي تتطلب أعلى دقة.
          </p>
        </div>
        <div className="card p-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <HardDrive size={22} />
          </div>
          <h4 className="font-bold text-slate-800">النماذج المحلية</h4>
          <p className="mt-1 text-sm text-slate-500">
            نماذج Llama و Phi تعمل على جهاز العيادة مباشرة — بيانات المرضى لا تغادر الجهاز أبداً.
          </p>
        </div>
      </div>
    </div>
  );
}

function CloudTab() {
  const techs: TechDetail[] = [
    {
      name: 'OpenAI GPT-4',
      logo: null,
      description: 'نموذج لغوي متعدد الاستخدامات من OpenAI، يتفوق في فهم السياق الطبي وتوليد النصوص.',
      features: ['أعلى دقة في فهم اللغة الطبيعية', 'دعم كامل للغة العربية', 'سرعة استجابة عالية', 'مناسب للتحليلات المعقدة'],
      url: 'https://openai.com',
    },
    {
      name: 'Anthropic Claude',
      logo: null,
      description: 'نموذج Claude من Anthropic — مصمم ليكون آمناً ودقيقاً، مثالي للسياقات الطبية الحساسة.',
      features: ['تفكير منطقي متقدم', 'أمان عالي في الردود', 'دعم محادثات طويلة', 'مناسب للتوصيات الطبية'],
      url: 'https://anthropic.com',
    },
    {
      name: 'Google Gemini',
      logo: null,
      description: 'نموذج Gemini من Google — متعدد الوسائط، يفهم النصوص والصور، سريع واقتصادي.',
      features: ['متعدد الوسائط (نص + صورة)', 'سرعة استجابة فائقة', 'تكلفة منخفضة', 'مناسب لتحليل الأشعة'],
      url: 'https://ai.google',
    },
  ];

  return (
    <div className="space-y-4">
      {techs.map((t) => (
        <div key={t.name} className="card p-6">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h4 className="text-lg font-bold text-slate-800">{t.name}</h4>
              <p className="mt-1 text-sm text-slate-500">{t.description}</p>
            </div>
            <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-brand-500">
              <ExternalLink size={18} />
            </a>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {t.features.map((f) => (
              <div key={f} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <Check size={14} className="text-success-500" />
                {f}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LocalTab() {
  const techs: TechDetail[] = [
    {
      name: 'Ollama + Llama 3.2',
      logo: null,
      description: 'نموذج Llama 3.2 من Meta، يعمل محلياً عبر Ollama — خصوصية كاملة بدون إنترنت.',
      features: ['خصوصية 100% — بلا إنترنت', 'بدون تكلفة استدعاءات', 'تحكم كامل في النموذج', 'مناسب للمحادثات اليومية'],
      url: 'https://ollama.com',
    },
    {
      name: 'Microsoft Phi',
      logo: null,
      description: 'نماذج Phi المتقدمة من Microsoft — صغيرة الحجم، سريعة، وفعّالة للأجهزة المحلية.',
      features: ['حجم صغير وأداء عالي', 'سرعة استجابة فورية', 'كفاءة في استهلاك الموارد', 'مناسب للأجهزة المتوسطة'],
      url: 'https://phi.microsoft.com',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <HardDrive size={20} />
          </div>
          <div>
            <p className="font-bold text-emerald-800">الخصوصية أولاً</p>
            <p className="mt-1 text-sm text-emerald-700">
              النماذج المحلية تعمل بالكامل على جهاز العيادة. لا تُرسل أي بيانات للإنترنت — مثالية للبيانات الطبية الحساسة.
            </p>
          </div>
        </div>
      </div>

      {techs.map((t) => (
        <div key={t.name} className="card p-6">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h4 className="text-lg font-bold text-slate-800">{t.name}</h4>
              <p className="mt-1 text-sm text-slate-500">{t.description}</p>
            </div>
            <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-brand-500">
              <ExternalLink size={18} />
            </a>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {t.features.map((f) => (
              <div key={f} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <Check size={14} className="text-success-500" />
                {f}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CompareTab() {
  const rows = [
    { label: 'الخصوصية', cloud: 'بيانات تُرسل للسحابة', local: 'خصوصية كاملة محلياً', cloudWin: false },
    { label: 'الدقة', cloud: 'أعلى دقة عالمياً', local: 'دقة جيدة جداً', cloudWin: true },
    { label: 'السرعة', cloud: 'سريع (يعتمد على الإنترنت)', local: 'فوري (بدون إنترنت)', cloudWin: false },
    { label: 'التكلفة', cloud: 'دفع لكل استدعاء', local: 'مجاني تماماً', cloudWin: false },
    { label: 'الإعداد', cloud: 'مفتاح API فقط', local: 'تثبيت Ollama محلياً', cloudWin: true },
    { label: 'حجم النموذج', cloud: 'غير محدود', local: 'محدود بذاكرة الجهاز', cloudWin: true },
    { label: 'تحليل الصور', cloud: 'مدعوم بالكامل', local: 'مدعوم جزئياً', cloudWin: true },
    { label: 'العمل بدون إنترنت', cloud: false, local: true, cloudWin: false },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-4 text-right font-semibold text-slate-600">المعيار</th>
              <th className="p-4 text-center font-semibold text-blue-600">السحابي</th>
              <th className="p-4 text-center font-semibold text-emerald-600">المحلي</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-slate-100 last:border-0">
                <td className="p-4 font-semibold text-slate-700">{r.label}</td>
                <td className="p-4 text-center text-slate-600">
                  <div className="flex items-center justify-center gap-1.5">
                    {r.cloudWin ? <Check size={14} className="text-success-500" /> : <X size={14} className="text-slate-300" />}
                    {typeof r.cloud === 'boolean' ? (r.cloud ? 'نعم' : 'لا') : r.cloud}
                  </div>
                </td>
                <td className="p-4 text-center text-slate-600">
                  <div className="flex items-center justify-center gap-1.5">
                    {!r.cloudWin ? <Check size={14} className="text-success-500" /> : <X size={14} className="text-slate-300" />}
                    {typeof r.local === 'boolean' ? (r.local ? 'نعم' : 'لا') : r.local}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 bg-slate-50 p-4 text-center text-sm text-slate-500">
        ننصح باستخدام النماذج السحابية للتحليلات المعقدة، والنماذج المحلية للمحادثات اليومية وبيانات المرضى الحساسة.
      </div>
    </div>
  );
}
