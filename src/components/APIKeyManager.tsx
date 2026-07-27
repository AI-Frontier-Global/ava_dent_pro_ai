import { useState } from 'react';
import { Key, Eye, EyeOff, Save, Check } from 'lucide-react';
import type { AIProviderId, ProviderConfig } from '../lib/unified-ai-service';
import { PROVIDER_LABELS, PROVIDER_MODELS } from '../lib/unified-ai-service';

interface Props {
  configs: ProviderConfig[];
  onSave: (id: AIProviderId, patch: Partial<ProviderConfig>) => void;
}

export default function APIKeyManager({ configs, onSave }: Props) {
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, { apiKey: string; model: string; enabled: boolean }>>({});
  const [saved, setSaved] = useState<string | null>(null);

  const toggleVisible = (id: string) =>
    setVisible((v) => ({ ...v, [id]: !v[id] }));

  const updateDraft = (id: string, patch: Partial<{ apiKey: string; model: string; enabled: boolean }>) =>
    setDrafts((d) => ({
      ...d,
      [id]: { ...(d[id] ?? configs.find((c) => c.id === id)!), ...patch },
    }));

  const handleSave = (id: AIProviderId) => {
    const draft = drafts[id];
    if (!draft) return;
    onSave(id, draft);
    setSaved(id);
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Key size={20} className="text-slate-600" />
        <h3 className="text-lg font-bold text-slate-800">إدارة مفاتيح API</h3>
      </div>
      <p className="mb-5 text-sm text-slate-500">
        أضف مفاتيح API لموفرين الذكاء الاصطناعي. تُخزّن المفاتيح محلياً في متصفحك ولا تُرسل لأي خادم آخر.
      </p>

      <div className="space-y-4">
        {configs.map((c) => {
          const draft = drafts[c.id] ?? { apiKey: c.apiKey, model: c.model, enabled: c.enabled };
          const id = c.id as AIProviderId;
          return (
            <div key={c.id} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold text-slate-700">{PROVIDER_LABELS[id]}</span>
                <label className="inline-flex items-center gap-2 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(e) => updateDraft(c.id, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand-500"
                  />
                  مفعّل
                </label>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={visible[c.id] ? 'text' : 'password'}
                    value={draft.apiKey}
                    onChange={(e) => updateDraft(c.id, { apiKey: e.target.value })}
                    placeholder={`مفتاح ${PROVIDER_LABELS[id]}`}
                    className="input pl-10"
                  />
                  <button
                    onClick={() => toggleVisible(c.id)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="إظهار/إخفاء"
                  >
                    {visible[c.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <select
                  value={draft.model}
                  onChange={(e) => updateDraft(c.id, { model: e.target.value })}
                  className="input w-44"
                >
                  {PROVIDER_MODELS[id].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleSave(id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  {saved === c.id ? <Check size={16} /> : <Save size={16} />}
                  {saved === c.id ? 'تم' : 'حفظ'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
