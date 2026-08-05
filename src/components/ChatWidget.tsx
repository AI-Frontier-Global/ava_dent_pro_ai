import { useState, useEffect, useRef } from 'react';
import { X, Send, WifiOff } from 'lucide-react';
import { smartChat } from '../lib/ai-switcher';
import { loadConfigsWithOllamaSettings } from '../lib/ai-config';
import type { ProviderConfig } from '../lib/unified-ai-service';

const responses: Record<string, string> = {
  greeting: `مرحباً بك في عيادة سمايل! 👋

أنا سارة، مساعدتك الذكية. يمكنني مساعدتك في:

📋 معلومات عن النظام
💰 الأسعار والباقة المناسبة
🏥 خدماتنا الطبية
📅 حجز موعد
🛡️ الضمان والكفالة
📞 التواصل معنا

ماذا تريد أن تعرف؟`,

  pricing: `💰 لدينا 3 باقات مرنة تناسب جميع العيادات:

━━━━━━━━━━━━━━━━━━━━

📊 الباقة الأساسية - 29 JOD/شهر
━━━━━━━━━━━━━━━━━━━━
✓ حتى 300 مريض
✓ جدولة المواعيد الذكية
✓ إدارة ملفات المرضى
✓ فواتير أساسية
✓ تقارير بسيطة
✓ دعم فني عبر البريد

مثالية لـ: العيادات الناشئة والطبيب الواحد

━━━━━━━━━━━━━━━━━━━━

🚀 باقة النمو (الأكثر طلباً) - 49 JOD/شهر
━━━━━━━━━━━━━━━━━━━━
✓ عدد لا محدود من المرضى
✓ كل ميزات الباقة الأساسية +
✓ تذكيرات WhatsApp تلقائية
✓ دفع عبر CliQ
✓ فوترة إلكترونية JoFotara
✓ مخطط الأسنان التفاعلي
✓ خطط العلاج
✓ تقارير مالية متقدمة
✓ دعم فني عبر WhatsApp

مثالية لـ: العيادات المتوسطة (1-3 أطباء)

━━━━━━━━━━━━━━━━━━━━

💎 الباقة المتقدمة - 79 JOD/شهر
━━━━━━━━━━━━━━━━━━━━
✓ كل ميزات باقة النمو +
✓ API للتكامل مع أنظمة أخرى
✓ إدارة فروع متعددة
✓ صلاحيات موظفين متقدمة
✓ نسخ احتياطي يومي
✓ مدير حساب مخصص
✓ دعم فني VIP على مدار الساعة
✓ تدريب مخصص للفريق

مثالية لـ: المراكز الطبية والعيادات الكبيرة

━━━━━━━━━━━━━━━━━━━━

🎁 عرض خاص: تجربة مجانية 14 يوم لكل الباقات!
💳 خصم 20% عند الدفع السنوي

هل تريد معرفة المزيد عن باقة معينة؟`,

  services: `🏥 نقدم نظاماً متكاملاً لإدارة عيادات الأسنان:

━━━━━━━━━━━━━━━━━━━━

📅 1. الجدولة الذكية
━━━━━━━━━━━━━━━━━━━━
• تقويم مرئي بسحب وإفلات
• حجز مواعيد في 15 ثانية
• تذكيرات تلقائية عبر WhatsApp
• تقليل نسبة الغياب من 30% إلى 8%
• إدارة قوائم الانتظار

━━━━━━━━━━━━━━━━━━━━

👥 2. إدارة المرضى
━━━━━━━━━━━━━━━━━━━━
• ملفات طبية إلكترونية كاملة
• بحث سريع بالاسم أو رقم الهاتف
• سجل طبي كامل لكل مريض
• صور الأشعة والتقارير
• تاريخ العلاج الكامل

━━━━━━━━━━━━━━━━━━━━

🦷 3. مخطط الأسنان التفاعلي
━━━━━━━━━━━━━━━━━━━━
• 32 سن للبالغين + 20 للأطفال
• تسجيل الحالات بالنقر (حشوة، تاج، خلع)
• 5 أسطح لكل سن
• ألوان قياسية معتمدة
• حفظ تلقائي

━━━━━━━━━━━━━━━━━━━━

💳 4. الفوترة والمدفوعات
━━━━━━━━━━━━━━━━━━━━
• فوترة إلكترونية JoFotara (إلزامي في الأردن)
• ضريبة 16% تُحسب تلقائياً
• دفع عبر CliQ (نظام الدفع الأردني)
• كاش، فيزا، تحويل بنكي
• إدارة الأقساط والمتأخرات
• QR Code على كل فاتورة

━━━━━━━━━━━━━━━━━━━━

📱 5. تفاعل المرضى
━━━━━━━━━━━━━━━━━━━━
• تذكيرات WhatsApp قبل الموعد
• تأكيد الموعد بالرد "1"
• نماذج رقمية قبل الزيارة
• بوابة مريض للحجز الذاتي
• تقييم الخدمة بعد الزيارة

━━━━━━━━━━━━━━━━━━━━

📊 6. التقارير والتحليلات
━━━━━━━━━━━━━━━━━━━━
• التحصيل اليومي والأسبوعي
• نسبة الحضور والغياب
• إنتاجية الأطباء
• أكثر الخدمات طلباً
• تقارير مالية مفصلة

━━━━━━━━━━━━━━━━━━━━

🔐 7. الأمان والخصوصية
━━━━━━━━━━━━━━━━━━━━
• تشفير كامل للبيانات
• صلاحيات دقيقة للموظفين
• نسخ احتياطي يومي
• متوافق مع قانون حماية البيانات الأردني

هل تريد تفاصيل أكثر عن ميزة معينة؟`,

  warranty: `🛡️ ضمان شامل لمدة 12 شهر على النظام:

━━━━━━━━━━━━━━━━━━━━

✅ ما يشمله الضمان:
━━━━━━━━━━━━━━━━━━━━
✓ دعم فني 24/7 عبر الهاتف وWhatsApp
✓ جميع التحديثات والترقيات مجاناً
✓ إصلاح أي أخطاء برمجية فوراً
✓ تدريب مجاني لفريقك (ساعتان)
✓ نقل بياناتك من النظام القديم مجاناً
✓ استجابة خلال ساعة واحدة للمشاكل الحرجة

━━━━━━━━━━━━━━━━━━━━

⏱️ مستويات الدعم:
━━━━━━━━━━━━━━━━━━━━
🔴 حرج (النظام لا يعمل): استجابة خلال 1 ساعة
🟡 متوسط (ميزة لا تعمل): استجابة خلال 4 ساعات
🟢 بسيط (استفسار): استجابة خلال 24 ساعة

━━━━━━━━━━━━━━━━━━━━

🔄 بعد انتهاء الضمان:
━━━━━━━━━━━━━━━━━━━━
• يمكن تمديد الضمان بـ 29 JOD/سنة فقط
• أو 25 JOD/سنة عند التجديد السنوي
• يشمل نفس مستوى الدعم

━━━━━━━━━━━━━━━━━━━━

🎓 التدريب والدعم:
━━━━━━━━━━━━━━━━━━━━
• فيديو تعليمي لكل ميزة (بالعربية)
• دليل استخدام PDF
• ويبينار أسبوعي مجاني
• مجموعة WhatsApp للدعم السريع
• زيارة ميدانية للعيادات في عمان (اختياري)

━━━━━━━━━━━━━━━━━━━━

💯 ضمان الرضا:
━━━━━━━━━━━━━━━━━━━━
• 14 يوم تجربة مجانية بدون التزام
• إذا لم يعجبك النظام، نرجع لك فلوسك
• لا عقود طويلة الأمد
• يمكنك الإلغاء في أي وقت

هل لديك سؤال آخر عن الضمان؟`,

  booking: `📅 لحجز موعد جديد، أحتاج المعلومات التالية:

━━━━━━━━━━━━━━━━━━━━

1️⃣ معلوماتك الشخصية:
━━━━━━━━━━━━━━━━━━━━
• الاسم الكامل:
• رقم الهاتف (07XXXXXXXX):
• العمر:

━━━━━━━━━━━━━━━━━━━━

2️⃣ نوع العلاج المطلوب:
━━━━━━━━━━━━━━━━━━━━
• 🔍 كشفية وفحص عام
• 🦷 حشوة (ضوئية/فضية)
• 🦷 علاج عصب
• 🦷 خلع سن
• 🦷 تقويم أسنان
• ✨ تبييض أسنان
• 🦷 زراعة أسنان
• 👑 تاج أو جسر
• 🧹 تنظيف الأسنان
• 📋 استشارة فقط

━━━━━━━━━━━━━━━━━━━━

3️⃣ الوقت المفضل:
━━━━━━━━━━━━━━━━━━━━
• اليوم المفضل:
• الوقت المفضل (صباحاً/مساءً):
• هل لديك موعد طارئ؟

━━━━━━━━━━━━━━━━━━━━

4️⃣ معلومات إضافية:
━━━━━━━━━━━━━━━━━━━━
• هل زرتنا من قبل؟ (نعم/لا)
• هل لديك حساسية من أدوية معينة؟
• هل لديك تأمين طبي؟

━━━━━━━━━━━━━━━━━━━━

📞 أو يمكنك الاتصال مباشرة:
• هاتف: 06-XXXXXXX
• WhatsApp: 079-XXXXXXX
• ساعات العمل: الأحد-الخميس، 9 صباحاً - 9 مساءً

🎁 عرض: أول كشفية مجانية عند حجز أول موعد!

أخبرني بالتفاصيل وسأساعدك في الحجز فوراً.`,

  about: `ℹ️ عن نظام إدارة عيادات الأسنان:

━━━━━━━━━━━━━━━━━━━━

🎯 رؤيتنا:
━━━━━━━━━━━━━━━━━━━━
أن نكون الحل الأول والأكثر موثوقية لإدارة عيادات الأسنان في الأردن والشرق الأوسط.

━━━━━━━━━━━━━━━━━━━━

🚀 مهمتنا:
━━━━━━━━━━━━━━━━━━━━
• تبسيط إدارة العيادات وتقليل الأعباء الإدارية
• زيادة إنتاجية الأطباء بنسبة 60%
• تحسين تجربة المرضى
• تقليل نسبة الغياب إلى أقل من 10%
• ضمان الامتثال للقوانين الأردنية (JoFotara)

━━━━━━━━━━━━━━━━━━━━

💡 لماذا نحن مختلفون؟
━━━━━━━━━━━━━━━━━━━━
✓ مصمم خصيصاً للسوق الأردني
✓ واجهة عربية 100% (RTL)
✓ سهل التعلم (45 دقيقة فقط)
✓ سعر مناسب (يبدأ من 29 JOD/شهر)
✓ دعم فني محلي سريع
✓ تكامل مع الأنظمة الأردنية (CliQ, JoFotara, WhatsApp)

━━━━━━━━━━━━━━━━━━━━

📊 إنجازاتنا:
━━━━━━━━━━━━━━━━━━━━
• 50+ عيادة تستخدم النظام
• 15,000+ مريض مُدار
• 98% رضا العملاء
• توفير 60% من وقت الإدارة
• زيادة التحصيل بنسبة 30%

━━━━━━━━━━━━━━━━━━━━

🏆 جوائز وشهادات:
━━━━━━━━━━━━━━━━━━━━
• معتمد من جمعية طب الأسنان الأردنية
• متوافق مع JoFotara 100%
• شهادة ISO 27001 لأمن المعلومات

هل تريد معرفة المزيد؟`,

  contact: `📞 طرق التواصل معنا:

━━━━━━━━━━━━━━━━━━━━

📱 الهاتف والرسائل:
━━━━━━━━━━━━━━━━━━━━
• هاتف: 06-XXXXXXX
• WhatsApp: 079-XXXXXXX
• ساعات العمل: الأحد-الخميس، 9ص - 9م

━━━━━━━━━━━━━━━━━━━━

📧 البريد الإلكتروني:
━━━━━━━━━━━━━━━━━━━━
• المبيعات: sales@smileclinic.jo
• الدعم: support@smileclinic.jo
• الاستفسارات: info@smileclinic.jo

━━━━━━━━━━━━━━━━━━━━

📍 العنوان:
━━━━━━━━━━━━━━━━━━━━
عمان، الأردن
شارع المدينة المنورة
مبنى رقم 123، الطابق 3

━━━━━━━━━━━━━━━━━━━━

🌐 وسائل التواصل الاجتماعي:
━━━━━━━━━━━━━━━━━━━━
• Facebook: facebook.com/smileclinic
• Instagram: instagram.com/smileclinic
• LinkedIn: linkedin.com/company/smileclinic

━━━━━━━━━━━━━━━━━━━━

💬 الدعم الفوري:
━━━━━━━━━━━━━━━━━━━━
• محادثة مباشرة هنا (24/7)
• WhatsApp Business (رد خلال 5 دقائق)
• هاتف (رد خلال 3 رنات)

كيف يمكنني مساعدتك الآن؟`,

  features: `✨ المميزات الرئيسية للنظام:

━━━━━━━━━━━━━━━━━━━━

⚡ السرعة والسهولة:
━━━━━━━━━━━━━━━━━━━━
• تعلم النظام في 45 دقيقة فقط
• 3 نقرات لإنشاء فاتورة
• 15 ثانية لحجز موعد
• بحث عن مريض بالهاتف في ثانيتين

━━━━━━━━━━━━━━━━━━━━

🔐 الأمان والخصوصية:
━━━━━━━━━━━━━━━━━━━━
• تشفير SSL/TLS للبيانات
• صلاحيات دقيقة لكل موظف
• نسخ احتياطي يومي تلقائي
• متوافق مع قانون حماية البيانات

━━━━━━━━━━━━━━━━━━━━

📱 العمل من أي مكان:
━━━━━━━━━━━━━━━━━━━━
• نظام سحابي 100%
• يعمل على الكمبيوتر والتابلت والموبايل
• لا حاجة لخوادم محلية
• وصول آمن من أي مكان

━━━━━━━━━━━━━━━━━━━━

🤖 الأتمتة الذكية:
━━━━━━━━━━━━━━━━━━━━
• تذكيرات WhatsApp تلقائية
• تأكيد المواعيد آلياً
• إعادة حجز المواعيد الملغاة
• تقارير تلقائية يومية

━━━━━━━━━━━━━━━━━━━━

🇯🇴 مصمم للأردن:
━━━━━━━━━━━━━━━━━━━━
• JoFotara مدمج (فوترة إلكترونية)
• CliQ للدفع السريع
• أرقام هواتف أردنية
• تقويم الأحد-الخميس
• ضريبة 16% تلقائية

هل تريد تفاصيل أكثر عن ميزة معينة؟`,

  default: `شكراً لسؤالك! 🤗

يمكنني مساعدتك في:

📋 معلومات عن النظام والميزات
💰 الأسعار والباقة المناسبة
🏥 خدماتنا الطبية
📅 حجز موعد جديد
🛡️ الضمان والكفالة
📞 التواصل معنا
ℹ️ عن الشركة ورؤيتنا

اختر من القائمة أعلاه أو اكتب سؤالك بالتفصيل وسأساعدك فوراً!`,
};

function detectIntent(msg: string): string {
  const m = msg.toLowerCase();

  if (m.includes('سعر') || m.includes('كم') || m.includes('تكلفة') ||
      m.includes('باقة') || m.includes('باقه') || m.includes('اشتراك') || m.includes('price')) {
    return 'pricing';
  }
  if (m.includes('خدمة') || m.includes('خدمه') || m.includes('تقدم') || m.includes('تعمل') ||
      m.includes('features') || m.includes('مميزات') || m.includes('ما هي') || m.includes('ما هي')) {
    return 'services';
  }
  if (m.includes('ضمان') || m.includes('كفالة') || m.includes('garantee') || m.includes('warranty')) {
    return 'warranty';
  }
  if (m.includes('حجز') || m.includes('موعد') || m.includes('booking') || m.includes('appointment')) {
    return 'booking';
  }
  if (m.includes('عن') || m.includes('about') || m.includes('من انتم') ||
      m.includes('رؤية') || m.includes('mission')) {
    return 'about';
  }
  if (m.includes('تواصل') || m.includes('اتصال') || m.includes('هاتف') ||
      m.includes('email') || m.includes('بريد')) {
    return 'contact';
  }
  if (m.includes('ميزة') || m.includes('مميزات') || m.includes('feature')) {
    return 'features';
  }
  if (m.includes('مرحبا') || m.includes('السلام') || m.includes('هلا') ||
      m.includes('hi') || m.includes('hello')) {
    return 'greeting';
  }
  return 'default';
}

const QUICK_REPLIES = ['الأسعار', 'الخدمات', 'حجز موعد', 'ضمان', 'المميزات', 'تواصل معنا'];

type Sender = 'ai' | 'customer';
type Message = { sender: Sender; text: string; timestamp: Date };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const WIDGET_SYSTEM_PROMPT =
  'أنت مساعد ذكي لعيادة أسنان. أجب بالعربية باختصار ووضوح. ساعد في حجز المواعيد، الأسعار، الخدمات، ومعلومات العيادة.';

async function askAI(message: string, history: Message[]): Promise<string | null> {
  const configs = await loadConfigsWithOllamaSettings();
  const enabled = configs.filter((c) => c.enabled && c.hasApiKey);
  if (enabled.length === 0) return null;
  const historyMsgs = history
    .slice(-8)
    .map((m) => ({
      role: (m.sender === 'customer' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.text,
    }));
  const result = await smartChat(
    configs,
    { systemPrompt: WIDGET_SYSTEM_PROMPT, messages: historyMsgs, temperature: 0.7, maxTokens: 500 },
    { strategy: 'cost', fallback: true },
  );
  return result.response?.text ?? null;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage('ai', responses.greeting);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('chat-open');
    } else {
      document.body.classList.remove('chat-open');
    }

    return () => {
      document.body.classList.remove('chat-open');
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender: Sender, text: string) => {
    setMessages((prev) => [...prev, { sender, text, timestamp: new Date() }]);
  };

  const [fallbackNotice, setFallbackNotice] = useState(false);

  const respondTo = async (text: string) => {
    setIsTyping(true);
    const aiReply = await askAI(text, messages);
    if (aiReply) {
      addMessage('ai', aiReply);
      setFallbackNotice(false);
    } else {
      setFallbackNotice(true);
      const intent = detectIntent(text);
      addMessage('ai', responses[intent] || responses.default);
    }
    setIsTyping(false);
  };

  const handleSend = (override?: string) => {
    const content = (override ?? input).trim();
    if (!content) return;
    addMessage('customer', content);
    setInput('');
    respondTo(content);
  };

  const handleQuickReply = (reply: string) => {
    addMessage('customer', reply);
    respondTo(reply);
  };

  return (
    <>
      {/* Avatar Button */}
      <div
        className="fixed bottom-4 right-4 z-40"
        onClick={() => setIsOpen(true)}
      >
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop"
            alt="AI"
            className={`w-16 h-16 rounded-full border-4 border-blue-500 shadow-xl cursor-pointer transition-all ${
              isTyping ? 'scale-105' : 'hover:scale-110'
            }`}
          />
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
      </div>

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 w-full max-w-md h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-elev-4 z-50 flex flex-col overflow-hidden chat-widget-mobile">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 text-white min-w-0">
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop"
                alt="سارة"
                className={`w-12 h-12 rounded-full border-2 border-white shrink-0 ${isTyping ? 'avatar-speaking' : 'avatar-blink'}`}
              />
              <div className="min-w-0">
                <h3 className="font-bold text-base">سارة</h3>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>متصلة الآن</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setMessages([])}
                className="text-xs text-white/70 hover:text-white hover:bg-white/20 rounded-full px-3 py-2 transition"
                title="مسح المحادثة"
              >
                مسح
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                aria-label="إغلاق المحادثة"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Fallback notice */}
          {fallbackNotice && (
            <div className="flex items-center gap-2 bg-warning-50 border-b border-warning-200 px-4 py-2 text-xs text-warning-700">
              <WifiOff size={14} className="shrink-0" />
              <span>الخدمة المحلية غير متصلة، جاري استخدام وضع الردود الذكية الاحتياطي.</span>
              <button
                onClick={() => setFallbackNotice(false)}
                className="mr-auto text-warning-500 hover:text-warning-700"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3 min-h-0">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'customer' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.sender === 'customer'
                    ? 'bg-blue-500 text-white rounded-tl-none'
                    : 'bg-white border border-gray-200 rounded-tr-none'
                }`}>
                  <p className="text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>
                  <span className="text-[10px] opacity-70 mt-1 block">
                    {new Date(msg.timestamp).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-end">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tr-none p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="px-3 py-2 bg-white border-t flex gap-2 overflow-x-auto shrink-0">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                onClick={() => handleQuickReply(reply)}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium hover:bg-blue-100 whitespace-nowrap transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="bg-blue-500 text-white rounded-full p-2.5 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
