import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { AIProviderId, ProviderConfig } from '../lib/unified-ai-service';
import { healthCheck } from '../lib/unified-ai-service';
import { PROVIDER_LABELS } from '../lib/unified-ai-service';

type Status = 'idle' | 'checking' | 'online' | 'offline';

interface Props {
  configs: ProviderConfig[];
}

export default function AIStatusBar({ configs }: Props) {
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  useEffect(() => {
    configs.forEach((c) => setStatuses((s) => ({ ...s, [c.id]: 'idle' })));
  }, [configs]);

  const check = async (config: ProviderConfig) => {
    setStatuses((s) => ({ ...s, [config.id]: 'checking' }));
    const ok = await healthCheck(config);
    setStatuses((s) => ({ ...s, [config.id]: ok ? 'online' : 'offline' }));
  };

  useEffect(() => {
    configs.filter((c) => c.enabled && c.hasApiKey).forEach((c) => void check(c));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const icon = (st: Status | undefined) => {
    if (st === 'checking') return <Loader2 size={14} className="animate-spin text-slate-400" />;
    if (st === 'online') return <CheckCircle2 size={14} className="text-success-500" />;
    if (st === 'offline') return <XCircle size={14} className="text-error-500" />;
    return <span className="h-3 w-3 rounded-full bg-slate-300" />;
  };

  return (
    <div className="card flex flex-wrap items-center gap-4 p-4">
      <p className="text-sm font-semibold text-slate-600">حالة الموفرين:</p>
      {configs.map((c) => (
        <button
          key={c.id}
          onClick={() => check(c)}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
        >
          {icon(statuses[c.id])}
          {PROVIDER_LABELS[c.id as AIProviderId]}
          {!c.enabled && <span className="text-slate-400">(معطّل)</span>}
        </button>
      ))}
    </div>
  );
}
