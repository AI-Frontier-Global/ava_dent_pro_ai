// مساعد ذكي لمركز المساعدة — يستخدم خدمة الذكاء الاصطناعي الموحدة عند توفّر مفاتيح API،
// ويرجع لردود قائمة على الكلمات المفتاحية كاحتياطي.

import type { ProviderConfig, UnifiedChatRequest } from './unified-ai-service';
import { smartChat } from './ai-switcher';
import { loadConfigs } from './ai-config';

const HELP_SYSTEM_PROMPT =
  'أنت مساعد ذكي في مركز مساعدة لمنصة DentalPro لإدارة عيادات الأسنان في الوطن العربي. ' +
  'أجب بالعربية باختصار ووضوح. ساعد المستخدم في استخدام النظام: إضافة المرضى، الجدولة، الفوترة، ' +
  'الذكاء الاصطناعي، الإعدادات، الاشتراكات. إذا لم تكن متأكداً، وجّه المستخدم لتصفح المقالات أو فتح تذكرة دعم.';

const KEYWORD_REPLIES: { keywords: string[]; reply: string }[] = [
  {
    keywords: ['مريض', 'تسجيل', 'إضافة مريض', 'تسجيل مريض'],
    reply: 'لإضافة مريض جديد: من القائمة الجانبية اختر "المرضى" ثم اضغط "إضافة مريض جديد". أدخل الاسم ورقم الهاتف وتاريخ الميلاد ثم احفظ.',
  },
  {
    keywords: ['موعد', 'جدول', 'جدولة', 'حجز'],
    reply: 'لجدولة موعد: اذهب إلى "الجدولة"، اختر اليوم والساعة المناسبة، ثم اضغط على المربع الفارغ واختر المريض ونوع الموعد.',
  },
  {
    keywords: ['فاتورة', 'دفع', 'فواتير', 'مدفوعات'],
    reply: 'لإنشاء فاتورة: في صفحة "الفواتير" اضغط "فاتورة جديدة"، اختر المريض وأضف الخدمات، ثم اضغط "إرسال" لإرسال رابط الدفع عبر واتساب.',
  },
  {
    keywords: ['ذكاء', 'اصطناعي', 'ai', 'مساعد ذكي', 'ollama'],
    reply: 'لتفعيل مساعد الذكاء الاصطناعي: اذهب إلى "مركز الذكاء الاصطناعي" في الإعدادات، أضف مفتاح API لموفر مثل OpenAI، أو فعّل Ollama محلياً.',
  },
  {
    keywords: ['اشتراك', 'باقة', 'تسعير', 'خطة', 'ترقية'],
    reply: 'يمكنك تغيير باقتك من صفحة التسعير. لدينا 3 باقات: الأساسية ($29)، الاحترافية ($79)، والمؤسسية ($199). تجربة مجانية 14 يوماً بدون بطاقة ائتمان.',
  },
  {
    keywords: ['صلاحيات', 'فريق', 'موظف', 'طبيب', 'دور'],
    reply: 'لإدارة صلاحيات الفريق: في الإعدادات، قسم "الفريق"، يمكنك دعوة أعضاء وتعيين أدوار: مدير، طبيب، موظف استقبال، مساعد.',
  },
  {
    keywords: ['تأمين', 'بوليصة'],
    reply: 'لإدارة التأمين الصحي: اذهب إلى صفحة "التأمين"، أضف بوليصة جديدة للمريض مع نسبة التغطية والحد السنوي.',
  },
  {
    keywords: ['عضوية', 'اشتراك مريض'],
    reply: 'لإنشاء خطط عضوية للمرضى: اذهب إلى "العضويات"، أنشئ خطة بالسعر والمميزات، ثم اربطها بالمرضى.',
  },
  {
    keywords: ['تقرير', 'إحصائيات', 'تحليلات'],
    reply: 'لعرض التقارير: اذهب إلى "التقارير" لرؤية إحصائيات العيادة: عدد المرضى، الإيرادات، المواعيد، وأداء الأطباء.',
  },
  {
    keywords: ['اشعة', 'أشعة', 'صورة', 'تصوير', 'xray'],
    reply: 'لإدارة الصور والأشعة: في صفحة المريض، اذهب إلى تبويب "التصوير" لرفع وعرض الأشعة والصور والمستندات.',
  },
];

function keywordReply(userMsg: string): string {
  const lower = userMsg.toLowerCase();
  for (const entry of KEYWORD_REPLIES) {
    if (entry.keywords.some((k) => lower.includes(k.toLowerCase()))) {
      return entry.reply;
    }
  }
  return 'شكراً لسؤالك! يمكنك تصفح المقالات والدروس أعلاه، أو التواصل مع الدعم عبر فتح تذكرة من صفحة الإعدادات.';
}

export interface HelpbotResult {
  text: string;
  usedAI: boolean;
}

export async function helpbotChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
): Promise<HelpbotResult> {
  const configs = await loadConfigs();
  const enabled = configs.filter((c) => c.enabled && c.hasApiKey && c.id !== 'ollama');

  if (enabled.length > 0) {
    const request: UnifiedChatRequest = {
      systemPrompt: HELP_SYSTEM_PROMPT,
      messages: messages.filter((m) => m.content),
      temperature: 0.7,
      maxTokens: 500,
    };

    const result = await smartChat(configs, request, { strategy: 'cost', fallback: true });

    if (result.response) {
      return { text: result.response.text, usedAI: true };
    }
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  return { text: keywordReply(lastUserMsg?.content || ''), usedAI: false };
}
