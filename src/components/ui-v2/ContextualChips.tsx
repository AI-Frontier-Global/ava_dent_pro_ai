import { TrendingUp, Brain, MessageSquare, FileText } from 'lucide-react';

type Props = {
  onPredict?: () => void;
  onAnalyze?: () => void;
  onMessage?: () => void;
  onSummarize?: () => void;
  compact?: boolean;
};

const chips = [
  { key: 'predict', label: 'تنبؤ بالغياب', icon: TrendingUp, color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
  { key: 'analyze', label: 'تحليل المريض', icon: Brain, color: 'text-sky-600 bg-sky-50 hover:bg-sky-100' },
  { key: 'message', label: 'إنشاء رسالة', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
  { key: 'summarize', label: 'تلخيص', icon: FileText, color: 'text-rose-600 bg-rose-50 hover:bg-rose-100' },
] as const;

export default function ContextualChips({ onPredict, onAnalyze, onMessage, onSummarize, compact }: Props) {
  const handlers: Record<string, (() => void) | undefined> = {
    predict: onPredict,
    analyze: onAnalyze,
    message: onMessage,
    summarize: onSummarize,
  };

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'gap-2'}`} dir="rtl">
      {chips.map((chip) => {
        const Icon = chip.icon;
        const handler = handlers[chip.key];
        return (
          <button
            key={chip.key}
            onClick={handler}
            disabled={!handler}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-40 ${chip.color}`}
          >
            <Icon size={12} />
            {!compact && <span>{chip.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
