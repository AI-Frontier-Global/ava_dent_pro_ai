// Unified AI Service — Enterprise Gateway Architecture
//
// The browser NEVER calls provider SDKs directly. All cloud provider calls
// go through the Supabase Edge Function (ai-gateway), which loads the
// encrypted API key server-side and calls the provider.
//
// Ollama (local) still goes through the local bridge.

import { callProviderGateway, type ProviderConfig } from "./providers/repository";
import { recordUsage, type ProviderId } from "./cost-tracker";
import { chat as ollamaChat, type ChatTurn } from "./ollamaBridge";

export type AIProviderId = "openai" | "anthropic" | "google" | "ollama";

export interface UnifiedChatRequest {
  systemPrompt?: string;
  messages: { role: "user" | "assistant"; content: string }[];
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

export type { ProviderConfig } from "./providers/repository";

export async function unifiedChat(
  config: ProviderConfig,
  request: UnifiedChatRequest,
): Promise<UnifiedChatResponse | null> {
  if (!config.enabled) return null;

  if (config.id === "ollama") {
    const history: ChatTurn[] = request.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const lastUser = [...request.messages].reverse().find((m) => m.role === "user");
    const userContent = lastUser?.content ?? "";
    const reply = await ollamaChat(config.model, userContent, history, config.model);
    if (!reply) return null;
    const totalTokens = Math.ceil(reply.length / 4);
    const usage = { promptTokens: totalTokens, completionTokens: totalTokens, totalTokens };
    recordUsage("ollama" as ProviderId, totalTokens, 0);
    return { text: reply, provider: "ollama", model: config.model, usage, costUsd: 0 };
  }

  // Cloud providers — route through the edge function gateway
  const response = await callProviderGateway(config.id, request, config.model);
  if (!response) return null;
  recordUsage(config.id as ProviderId, response.usage.totalTokens, response.costUsd);
  return response;
}

export async function healthCheck(config: ProviderConfig): Promise<boolean> {
  if (!config.hasApiKey) return false;
  if (config.id === "ollama") {
    const { getStatus } = await import("./ollamaBridge");
    const status = await getStatus(config.model);
    return !!(status && status.bridge === "online" && status.ollama);
  }
  // For cloud providers, we can't do a direct health check without
  // exposing the key. We trust the config status from the repository.
  return config.enabled && config.hasApiKey;
}

export const PROVIDER_LABELS: Record<AIProviderId, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic Claude",
  google: "Google Gemini",
  ollama: "Ollama محلي",
};

export const PROVIDER_MODELS: Record<AIProviderId, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
  google: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-exp"],
  ollama: ["llama3.2", "llama3.1", "mistral"],
};
