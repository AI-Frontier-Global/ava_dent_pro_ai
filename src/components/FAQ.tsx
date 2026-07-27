import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const faqs = [
  {
    q: 'هل النظام يدعم اللغة العربية بالكامل؟',
    a: 'نعم، النظام مصمم بالكامل باللغة العربية مع دعم RTL، وكل الواجهات والتقارير والفواتير بالعربية. كما يدعم إدخال الأسماء بالعربية والإنجليزية.',
  },
  {
    q: 'كم يستغرق إعداد النظام في عيادتي؟',
    a: 'يمكنك البدء فوراً بعد التسجيل. إعداد العيادة بالكامل (الأطباء، الخدمات، الأسعار) يستغرق عادةً 30 دقيقة فقط، وفريقنا يساعدك مجاناً في الترحيل من نظامك الحالي.',
  },
  {
    q: 'هل الفواتير متوافقة مع ضريبة المبيعات الأردنية؟',
    a: 'نعم، النظام متكامل مع نظام JoFotara الرسمي. تصدر الفواتير تلقائياً برقم ضريبي، وتحتسب ضريبة المبيعات 16%، وترسل للحساب الضريبي مباشرة دون أي إدخال يدوي.',
  },
  {
    q: 'هل يمكن للمرضى الدفع عبر CliQ؟',
    a: 'نعم، النظام يولّد رابط دفع CliQ فوراً لكل فاتورة. يرسل الرابط للمريض عبر WhatsApp أو رسالة نصية، ويدفع بضغطة زر من تطبيق CliQ على هاتفه.',
  },
  {
    q: 'ماذا يحدث بعد انتهاء التجربة المجانية؟',
    a: 'تستمر التجربة 14 يوماً بكامل الميزات بدون أي رسوم. بعدها تختار الباقة المناسبة لعيادتك. لا يتم خصم أي مبلغ تلقائياً، ولا تحتاج لإدخال بطاقة ائتمان للتسجيل.',
  },
  {
    q: 'هل بياناتي وبيانات مرضاي آمنة؟',
    a: 'بياناتك مشفرة ومستضافة على خوادم آمنة مع نسخ احتياطي يومي. النظام متوافق مع معايير حماية البيانات الطبية، ولا يشارك أي معلومات مع طرف ثالث.',
  },
  {
    q: 'هل أحتاج لتنزيل برنامج أو تثبيت شيء؟',
    a: 'لا، النظام يعمل بالكامل عبر المتصفح على أي جهاز — لابتوب، تابلت، أو موبايل. لا حاجة لتنزيل أو تثبيت أي شيء. كل ما تحتاجه هو اتصال بالإنترنت.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-xs font-semibold text-sky-700">
            <HelpCircle size={14} />
            الأسئلة الشائعة
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 sm:text-4xl">لديك سؤال؟ لدينا الإجابة</h2>
          <p className="mt-3 text-base text-slate-500">أكثر الأسئلة شيوعاً من أطباء الأسنان قبل البدء</p>
        </Reveal>

        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={i * 60}>
                <div
                  className={`overflow-hidden rounded-2xl border transition-all ${
                    isOpen ? 'border-sky-200 bg-sky-50/40 shadow-sm' : 'border-slate-200 bg-white'
                  }`}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-right"
                  >
                    <span className="text-base font-bold text-slate-800">{f.q}</span>
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
                        isOpen ? 'bg-sky-500 text-white rotate-180' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <ChevronDown size={18} />
                    </div>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{f.a}</p>
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
