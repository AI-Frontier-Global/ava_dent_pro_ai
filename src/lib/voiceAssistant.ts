import { chat } from './ollamaBridge';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type VoiceMessage = {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
};

const DENTAL_SYSTEM_PROMPT = `أنت "سمايل"، المساعد الصوتي الذكي لعيادة أسنان في الأردن.
- تتحدث العربية بوضوح مع لمسة من اللهجة الأردنية الطبيعية
- صوتك ودود ومهني ومختصر (2-4 جمل)
- تساعد في حجز المواعيد، الإجابة على الأسعار، ساعات العمل، وأنواع العلاج
- لا تقدم نصائح طبية أو تشخيصية — وجه المريض للطبيب
- إذا كان المريض في حالة طارئة، اطلب منه الاتصال بالطوارئ أو زيارة أقرب مستشفى
- أكد تفاصيل الموعد في النهاية (اليوم، الساعة، نوع الخدمة)`;

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

function getRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = 'ar-JO';
  rec.continuous = false;
  rec.interimResults = false;
  return rec;
}

function getSynth(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  return window.speechSynthesis;
}

function pickArabicVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
  return (
    voices.find((v) => v.lang.startsWith('ar')) ??
    voices.find((v) => v.lang.startsWith('ar-SA')) ??
    voices.find((v) => v.name.toLowerCase().includes('arabic')) ??
    null
  );
}

function ensureVoicesLoaded(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = synth.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    const handler = () => resolve(synth.getVoices());
    synth.addEventListener('voiceschanged', handler, { once: true });
    setTimeout(() => resolve(synth.getVoices()), 1000);
  });
}

export type VoiceCallbacks = {
  onStateChange: (state: VoiceState) => void;
  onUserMessage: (text: string) => void;
  onAssistantMessage: (text: string) => void;
  onError: (message: string) => void;
};

export function createVoiceAssistant(
  bridgeUrl: string,
  model: string | undefined,
  callbacks: VoiceCallbacks,
) {
  const synth = getSynth();
  let recognition: SpeechRecognitionLike | null = null;
  let active = false;

  const speak = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synth) {
        resolve();
        return;
      }
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'ar-SA';
      utter.rate = 0.95;
      utter.pitch = 1;
      const voice = pickArabicVoice(synth);
      if (voice) utter.voice = voice;
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };
      utter.onend = done;
      utter.onerror = done;
      setTimeout(done, 15000);
      callbacks.onStateChange('speaking');
      synth.speak(utter);
    });
  };

  const stopSpeaking = () => {
    if (synth) synth.cancel();
  };

  const startListening = () => {
    if (recognition) {
      try { recognition.stop(); } catch { /* ignore */ }
    }
    recognition = getRecognition();
    if (!recognition) {
      callbacks.onError('المتصفح لا يدعم التعرف الصوتي. استخدم Chrome أو Edge');
      return;
    }
    if (synth) synth.cancel();
    active = true;
    callbacks.onStateChange('listening');
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      callbacks.onUserMessage(transcript);
      void processMessage(transcript);
    };
    recognition.onend = () => {
      if (active) {
        callbacks.onStateChange('idle');
      }
    };
    recognition.onerror = (event) => {
      active = false;
      const errorMap: Record<string, string> = {
        'not-allowed': 'تم رفض إذن الميكروفون. الرجاء السماح بالوصول للميكروفون',
        'service-not-allowed': 'خدمة التعرف الصوتي غير متاحة',
        'network': 'خطأ في الشبكة أثناء التعرف الصوتي',
        'audio-capture': 'تعذر الوصول للميكروفون',
      };
      callbacks.onError(errorMap[event.error] ?? `خطأ في التعرف الصوتي: ${event.error}`);
      callbacks.onStateChange('idle');
    };
    try {
      recognition.start();
    } catch {
      // already started
    }
  };

  const stopListening = () => {
    active = false;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    }
    callbacks.onStateChange('idle');
  };

  const processMessage = async (text: string) => {
    callbacks.onStateChange('thinking');
    let reply: string | null = null;
    try {
      reply = await chat(bridgeUrl, text, [], model);
    } catch {
      reply = null;
    }
    if (!reply) {
      reply = 'عذراً، المساعد المحلي غير متاح حالياً. تأكد من تشغيل جسر Ollama على المنفذ 3001. يمكنك كتابة سؤالك كنص في هذه الأثناء.';
    }
    callbacks.onAssistantMessage(reply);
    await speak(reply);
    if (active) callbacks.onStateChange('idle');
  };

  const sendText = (text: string) => {
    callbacks.onUserMessage(text);
    void processMessage(text);
  };

  const dispose = () => {
    active = false;
    stopSpeaking();
    if (recognition) {
      try { recognition.stop(); } catch { /* ignore */ }
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition = null;
    }
  };

  return {
    startListening,
    stopListening,
    stopSpeaking,
    sendText,
    dispose,
    isSupported: () => getRecognition() !== null,
    isSpeechSynthesisSupported: () => synth !== null,
  };
}

export type VoiceAssistant = ReturnType<typeof createVoiceAssistant>;
