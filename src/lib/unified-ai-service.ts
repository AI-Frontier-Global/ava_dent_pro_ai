// الخدمة الموحدة للذكاء الاصطناعي — واجهة واحدة لكل الموفرين.
// تختار الموفر النشط، تُرسل الطلب، تُسجّل التكلفة، وتُرجع رداً موحداً.

import { openaiChat, openaiHealthCheck, OPENAI_PRICING, type OpenAIModel, type OpenAIMessage } from './ai-providers/openai';
import {
  anthropicChat,
  anthropicHealthCheck,
  ANTHROPIC_PRICING,
  type AnthropicModel,
  type AnthropicMessage,
} from './ai-providers/anthropic';
import { googleChat, googleHealthCheck, GOOGLE_PRICING, type GoogleModel, type GoogleMessage } from './ai-providers/google';
import { recordUsage, type ProviderId } from './cost-tracker';

export type AIProviderId = 'openai' | 'anthropic' | 'google' | 'ollama';

export interface UnifiedChatRequest {
  systemPrompt?: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  temperature?: number;
  maxTokens?: number;
}

export interface UnifiedChatResponse {
  text: string;
  provider: AIProviderId;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costUsd: number;
}

export interface ProviderConfig {
  id: AIProviderId;
  label: string;
  apiKey: string;
  model: string;
  enabled: boolean;
}

export async function unifiedChat(
  config: ProviderConfig,
  request: UnifiedChatRequest,
): Promise<UnifiedChatResponse | null> {
  if (!config.enabled || !config.apiKey) return null;

  if (config.id === 'openai') {
    const messages: OpenAIMessage[] = [
      ...(request.systemPrompt ? [{ role: 'system' as const, content: request.systemPrompt }] : []),
      ...request.messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    const res = await openaiChat(config.apiKey, messages, {
      model: config.model as OpenAIModel,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });
    if (!res) return null;
    const pricing = OPENAI_PRICING[config.model as OpenAIModel] ?? { input: 0, output: 0 };
    const costUsd = (res.usage.promptTokens * pricing.input + res.usage.completionTokens * pricing.output) / 1000;
    recordUsage('openai' as ProviderId, res.usage.totalTokens, costUsd);
    return { text: res.text, provider: 'openai', model: res.model, usage: res.usage, costUsd };
  }

  if (config.id === 'anthropic') {
    const messages: AnthropicMessage[] = request.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const res = await anthropicChat(config.apiKey, request.systemPrompt ?? '', messages, {
      model: config.model as AnthropicModel,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });
    if (!res) return null;
    const pricing = ANTHROPIC_PRICING[config.model as AnthropicModel] ?? { input: 0, output: 0 };
    const costUsd = (res.usage.promptTokens * pricing.input + res.usage.completionTokens * pricing.output) / 1000;
    recordUsage('anthropic' as ProviderId, res.usage.totalTokens, costUsd);
    return { text: res.text, provider: 'anthropic', model: res.model, usage: res.usage, costUsd };
  }

  if (config.id === 'google') {
    const messages: GoogleMessage[] = request.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      content: m.content,
    }));
    const res = await googleChat(config.apiKey, request.systemPrompt ?? '', messages, {
      model: config.model as GoogleModel,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });
    if (!res) return null;
    const pricing = GOOGLE_PRICING[config.model as GoogleModel] ?? { input: 0, output: 0 };
    const costUsd = (res.usage.promptTokens * pricing.input + res.usage.completionTokens * pricing.output) / 1000;
    recordUsage('google' as ProviderId, res.usage.totalTokens, costUsd);
    return { text: res.text, provider: 'google', model: res.model, usage: res.usage, costUsd };
  }

  return null;
}

export async function healthCheck(config: ProviderConfig): Promise<boolean> {
  if (!config.apiKey) return false;
  if (config.id === 'openai') {
    return openaiHealthCheck(config.apiKey);
  }
  if (config.id === 'anthropic') {
    return anthropicHealthCheck(config.apiKey);
  }
  if (config.id === 'google') {
    return googleHealthCheck(config.apiKey);
  }
  return false;
}

export const PROVIDER_LABELS: Record<AIProviderId, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
  google: 'Google Gemini',
  ollama: 'Ollama محلي',
};

export const PROVIDER_MODELS: Record<AIProviderId, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  google: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
  ollama: ['llama3.2', 'llama3.1', 'mistral'],
};
