// نظام التبديل الذكي بين الموفرين — يختار الأفضل حسب التوفّر والتكلفة والتأخير.

import type { ProviderConfig, AIProviderId } from './unified-ai-service';
import { unifiedChat, healthCheck, type UnifiedChatRequest, type UnifiedChatResponse } from './unified-ai-service';
import { getProviderStats } from './cost-tracker';

export interface SwitcherResult {
  response: UnifiedChatResponse | null;
  usedProvider: AIProviderId | null;
  attempts: { provider: AIProviderId; success: boolean; error?: string }[];
}

export async function smartChat(
  configs: ProviderConfig[],
  request: UnifiedChatRequest,
  options: { strategy?: 'cost' | 'speed' | 'quality'; fallback?: boolean } = {},
): Promise<SwitcherResult> {
  const strategy = options.strategy ?? 'cost';
  const fallback = options.fallback ?? true;
  const attempts: { provider: AIProviderId; success: boolean; error?: string }[] = [];

  const enabled = configs.filter((c) => c.enabled && c.apiKey && c.apiKey !== '');
  if (enabled.length === 0) {
    return { response: null, usedProvider: null, attempts };
  }

  const ranked = rankProviders(enabled, strategy);

  for (const config of ranked) {
    const res = await unifiedChat(config, request);
    if (res) {
      attempts.push({ provider: config.id, success: true });
      return { response: res, usedProvider: config.id, attempts };
    }
    attempts.push({ provider: config.id, success: false, error: 'فشل الطلب' });
    if (!fallback) break;
  }

  return { response: null, usedProvider: null, attempts };
}

function rankProviders(configs: ProviderConfig[], strategy: 'cost' | 'speed' | 'quality'): ProviderConfig[] {
  if (strategy === 'quality') {
    const order: AIProviderId[] = ['anthropic', 'openai', 'google', 'ollama'];
    return configs.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }
  if (strategy === 'speed') {
    const order: AIProviderId[] = ['google', 'openai', 'anthropic', 'ollama'];
    return configs.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }
  // cost: رتّب حسب متوسط التكلفة من سجل cost-tracker، ثم حسب الأولوية
  return configs.sort((a, b) => {
    const aCost = getProviderStats(a.id).avgCostPerCall;
    const bCost = getProviderStats(b.id).avgCostPerCall;
    return aCost - bCost;
  });
}

export async function checkAllProviders(configs: ProviderConfig[]): Promise<
  Record<AIProviderId, boolean>
> {
  const results = {} as Record<AIProviderId, boolean>;
  await Promise.all(
    configs.map(async (c) => {
      results[c.id] = await healthCheck(c);
    }),
  );
  return results;
}
