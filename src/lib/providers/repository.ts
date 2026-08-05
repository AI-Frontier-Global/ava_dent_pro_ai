// Enterprise Provider Repository — Single Source of Truth
//
// This is the ONLY module that reads/writes AI provider configuration.
// Every component must consume this repository — no duplicated config loaders.
//
// API keys are stored in Supabase (clinic_ai_credentials table) and are
// NEVER exposed to the browser. The browser only sees provider/model/enabled.
// All AI calls go through the edge function (ai-gateway) which loads the
// encrypted key server-side.

import { supabase } from "../supabase";
import type { AIProviderId, UnifiedChatRequest, UnifiedChatResponse } from "../unified-ai-service";

export type { AIProviderId, UnifiedChatRequest, UnifiedChatResponse } from "../unified-ai-service";

export interface ProviderConfig {
  id: AIProviderId;
  label: string;
  model: string;
  enabled: boolean;
  hasApiKey: boolean;
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

const DEFAULT_MODELS: Record<AIProviderId, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-20241022",
  google: "gemini-1.5-flash",
  ollama: "llama3.2",
};

let cachedClinicId: string | null = null;

async function resolveClinicId(): Promise<string | null> {
  if (cachedClinicId) return cachedClinicId;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data: member } = await supabase
    .from("clinic_members")
    .select("clinic_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (member) {
    cachedClinicId = member.clinic_id as string;
  }
  return cachedClinicId;
}

export async function getClinicId(): Promise<string | null> {
  return resolveClinicId();
}

export async function loadProviderConfigs(): Promise<ProviderConfig[]> {
  const clinicId = await resolveClinicId();
  if (!clinicId) return getDefaultConfigs();

  const { data, error } = await supabase
    .from("clinic_ai_credentials")
    .select("provider, model, enabled")
    .eq("clinic_id", clinicId);

  if (error || !data) return getDefaultConfigs();

  const stored = new Map<string, { model: string; enabled: boolean }>();
  for (const row of data) {
    stored.set(row.provider, { model: row.model, enabled: row.enabled });
  }

  const allProviders: AIProviderId[] = ["openai", "anthropic", "google", "ollama"];
  return allProviders.map((id) => {
    const storedRow = stored.get(id);
    return {
      id,
      label: PROVIDER_LABELS[id],
      model: storedRow?.model ?? DEFAULT_MODELS[id],
      enabled: storedRow?.enabled ?? (id === "ollama"),
      hasApiKey: id === "ollama" ? true : !!storedRow,
    };
  });
}

export function getDefaultConfigs(): ProviderConfig[] {
  return (["openai", "anthropic", "google", "ollama"] as AIProviderId[]).map((id) => ({
    id,
    label: PROVIDER_LABELS[id],
    model: DEFAULT_MODELS[id],
    enabled: id === "ollama",
    hasApiKey: id === "ollama",
  }));
}

export async function saveProviderConfig(
  provider: AIProviderId,
  patch: { apiKey?: string; model?: string; enabled?: boolean },
): Promise<void> {
  const clinicId = await resolveClinicId();
  if (!clinicId) throw new Error("No clinic found for current user");

  if (provider === "ollama") {
    // Ollama uses the local bridge — save bridge URL + model to clinic_ai_settings
    const update: Record<string, unknown> = {};
    if (patch.apiKey !== undefined) update.bridge_url = patch.apiKey;
    if (patch.model !== undefined) update.model = patch.model;
    if (patch.enabled !== undefined) update.enabled = patch.enabled;
    if (Object.keys(update).length > 0) {
      const { error } = await supabase
        .from("clinic_ai_settings")
        .update(update)
        .eq("id", 1);
      if (error) throw error;
    }
    return;
  }

  // For cloud providers — call the SECURITY DEFINER upsert function
  // which encrypts the API key server-side
  const { data: existing } = await supabase
    .from("clinic_ai_credentials")
    .select("model, enabled")
    .eq("clinic_id", clinicId)
    .eq("provider", provider)
    .maybeSingle();

  const model = patch.model ?? existing?.model ?? DEFAULT_MODELS[provider];
  const enabled = patch.enabled ?? existing?.enabled ?? false;
  const apiKey = patch.apiKey;

  if (!apiKey) {
    // Just update model/enabled without changing the key
    const { error } = await supabase
      .from("clinic_ai_credentials")
      .update({ model, enabled })
      .eq("clinic_id", clinicId)
      .eq("provider", provider);
    if (error) throw error;
    return;
  }

  // Use the SECURITY DEFINER function to encrypt and upsert
  const { error: rpcError } = await supabase.rpc("upsert_clinic_ai_credential", {
    p_clinic_id: clinicId,
    p_provider: provider,
    p_api_key: apiKey,
    p_model: model,
    p_enabled: enabled,
  });
  if (rpcError) throw rpcError;
}

export async function deleteProviderConfig(provider: AIProviderId): Promise<void> {
  const clinicId = await resolveClinicId();
  if (!clinicId) return;
  const { error } = await supabase
    .from("clinic_ai_credentials")
    .delete()
    .eq("clinic_id", clinicId)
    .eq("provider", provider);
  if (error) throw error;
}

export async function callProviderGateway(
  provider: AIProviderId,
  request: UnifiedChatRequest,
  model?: string,
): Promise<UnifiedChatResponse | null> {
  const clinicId = await resolveClinicId();
  if (!clinicId) return null;

  if (provider === "ollama") {
    // Ollama goes through the local bridge, not the edge function
    return null;
  }

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-gateway`;
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      clinicId,
      provider,
      systemPrompt: request.systemPrompt,
      messages: request.messages,
      model,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  if (data.error) return null;
  return data as UnifiedChatResponse;
}
