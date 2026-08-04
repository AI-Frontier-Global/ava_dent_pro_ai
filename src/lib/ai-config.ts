// مصدر واحد لإعدادات موفرّي الذكاء الاصطناعي — يقرأ من localStorage
// ويدمج إعدادات Ollama المحفوظة في Supabase (bridge_url, model).

import type { ProviderConfig, AIProviderId } from './unified-ai-service';
import { supabase } from './supabase';

const STORAGE_KEY = 'ai_provider_configs';

export const DEFAULT_CONFIGS: ProviderConfig[] = [
  { id: 'openai', label: 'OpenAI', apiKey: '', model: 'gpt-4o-mini', enabled: false },
  { id: 'anthropic', label: 'Anthropic Claude', apiKey: '', model: 'claude-3-5-haiku-20241022', enabled: false },
  { id: 'google', label: 'Google Gemini', apiKey: '', model: 'gemini-1.5-flash', enabled: false },
  { id: 'ollama', label: 'Ollama محلي', apiKey: 'local', model: 'llama3.2', enabled: true },
];

function loadFromStorage(): ProviderConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIGS;
    const parsed = JSON.parse(raw) as ProviderConfig[];
    return DEFAULT_CONFIGS.map((d) => parsed.find((p) => p.id === d.id) ?? d);
  } catch {
    return DEFAULT_CONFIGS;
  }
}

export function loadConfigs(): ProviderConfig[] {
  return loadFromStorage();
}

export function saveConfigs(configs: ProviderConfig[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function updateConfig(
  id: AIProviderId,
  patch: Partial<ProviderConfig>,
): ProviderConfig[] {
  const current = loadFromStorage();
  const next = current.map((c) => (c.id === id ? { ...c, ...patch } : c));
  saveConfigs(next);
  return next;
}

/**
 * يحمل إعدادات Ollama من Supabase (bridge_url, model) ويدمجها في إعدادات
 * localStorage. هذا يضمن أن unifiedChat تستخدم نفس bridge_url المُعدّ في
 * صفحة الإعدادات.
 */
export async function loadConfigsWithOllamaSettings(): Promise<ProviderConfig[]> {
  const base = loadFromStorage();
  try {
    const { data } = await supabase
      .from('clinic_ai_settings')
      .select('enabled, bridge_url, model')
      .eq('id', 1)
      .maybeSingle();
    if (data) {
      return base.map((c) =>
        c.id === 'ollama'
          ? {
              ...c,
              apiKey: data.bridge_url || c.apiKey,
              model: data.model || c.model,
              enabled: data.enabled ?? c.enabled,
            }
          : c,
      );
    }
  } catch {
    // تجاهل — استخدم الإعدادات المحلية
  }
  return base;
}
