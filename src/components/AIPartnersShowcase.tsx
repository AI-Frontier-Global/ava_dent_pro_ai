import { ExternalLink } from 'lucide-react';

interface Partner {
  name: string;
  tagline: string;
  url: string;
  logo: React.ReactNode;
}

const partners: Partner[] = [
  {
    name: 'OpenAI',
    tagline: 'مدعوم بتقنية GPT-4',
    url: 'https://openai.com',
    logo: <OpenAILogo />,
  },
  {
    name: 'Anthropic',
    tagline: 'مدعوم بتقنية Claude',
    url: 'https://anthropic.com',
    logo: <AnthropicLogo />,
  },
  {
    name: 'Google',
    tagline: 'مدعوم بتقنية Gemini',
    url: 'https://ai.google',
    logo: <GoogleLogo />,
  },
  {
    name: 'Ollama',
    tagline: 'ذكاء اصطناعي محلي آمن',
    url: 'https://ollama.com',
    logo: <OllamaLogo />,
  },
  {
    name: 'Meta',
    tagline: 'نماذج Llama مفتوحة المصدر',
    url: 'https://llama.meta.com',
    logo: <MetaLogo />,
  },
  {
    name: 'Microsoft',
    tagline: 'نماذج Phi المتقدمة',
    url: 'https://phi.microsoft.com',
    logo: <MicrosoftLogo />,
  },
];

export default function AIPartnersShowcase() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6 sm:p-8">
      <div className="mb-6 text-center">
        <h3 className="text-lg font-bold text-slate-800 sm:text-xl">
          نستخدم أحدث تقنيات الذكاء الاصطناعي العالمية
        </h3>
        <p className="mt-1.5 text-sm text-slate-500">
          نظامنا مدعوم بأقوى نماذج الذكاء الاصطناعي في العالم لضمان أفضل تجربة
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {partners.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-elev-2"
          >
            <div className="flex h-12 items-center justify-center transition-transform duration-200 group-hover:scale-110">
              {p.logo}
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-700">{p.name}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{p.tagline}</p>
            </div>
            <ExternalLink size={12} className="text-slate-300 transition-colors group-hover:text-brand-500" />
          </a>
        ))}
      </div>
    </section>
  );
}

/* ============ Inline SVG Logos ============ */

function OpenAILogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.998-2.9 6.056 6.056 0 0 0-.748-7.073zM13.26 22.43a4.482 4.482 0 0 1-2.877-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .04.055v5.583a4.504 4.504 0 0 1-4.495 4.491zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.408 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zM8.3 12.85l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v3l-2.602 1.5-2.607-1.5z"
        fill="#000"
      />
    </svg>
  );
}

function AnthropicLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96z" fill="#D97757" />
      <path d="M3.603 3.52H7.21L17.397 20.48h-3.603L3.603 3.52z" fill="#000" />
      <path d="M8.828 3.52h3.603L17.397 20.48h-3.603L8.828 3.52z" fill="#000" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L9.5 8.5 2 11l7.5 2.5L12 22l2.5-8.5L22 11l-7.5-2.5L12 2z" fill="#4285F4" />
      <path d="M12 2v20l2.5-8.5L22 11l-7.5-2.5L12 2z" fill="#EA4335" />
      <path d="M2 11l7.5 2.5L12 22 9.5 8.5 2 11z" fill="#34A853" />
      <path d="M12 2L9.5 8.5 2 11l7.5-2.5L12 2z" fill="#FBBC05" />
    </svg>
  );
}

function OllamaLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C8.5 2 6 4.5 6 8c0 1.5.5 2.8 1.3 3.8L6 14c-.5 1 .5 2 1.5 1.5l1.5-.5c1 .5 2 .5 3 .5s2 0 3-.5l1.5.5c1 .5 2-.5 1.5-1.5l-1.3-2.2c.8-1 1.3-2.3 1.3-3.8 0-3.5-2.5-6-6-6z"
        fill="#000"
      />
      <circle cx="9.5" cy="8" r="1.2" fill="#fff" />
      <circle cx="14.5" cy="8" r="1.2" fill="#fff" />
    </svg>
  );
}

function MetaLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.5 4C3.5 4 1 6.5 1 10c0 3 1.5 5.5 3.5 5.5 1.5 0 3-1.5 4.5-4 1-1.5 2-3.5 3-3.5s2 2 3 3.5c1.5 2.5 3 4 4.5 4 2 0 3.5-2.5 3.5-5.5 0-3.5-2.5-6-5.5-6-2 0-4 1.5-5.5 4-1-2-3-4-5-4z"
        fill="#0082FB"
      />
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="9" height="9" fill="#F25022" />
      <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
      <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
      <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
