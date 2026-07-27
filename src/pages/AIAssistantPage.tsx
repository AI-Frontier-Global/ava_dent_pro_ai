import { Brain } from 'lucide-react';
import { AISettingsPanel } from './SettingsPage';

export default function AIAssistantPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-600 text-white shadow-elev-2 shadow-brand-500/20">
          <Brain size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">المساعد الذكي المحلي</h2>
          <p className="text-sm text-slate-500">إدارة وتشغيل مساعد الذكاء الاصطناعي المحلي (Ollama)</p>
        </div>
      </div>
      <AISettingsPanel />
    </div>
  );
}
