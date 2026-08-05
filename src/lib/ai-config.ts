// Provider Configuration — delegates to the Enterprise Provider Repository.
//
// This file is kept for backward compatibility — all existing imports
// (loadConfigs, saveConfigs, updateConfig, loadConfigsWithOllamaSettings)
// now route through the repository, which is the single source of truth.
//
// API keys are stored in Supabase, NOT localStorage.

import type { ProviderConfig, AIProviderId } from "./unified-ai-service";
import {
  loadProviderConfigs,
  saveProviderConfig,
  getDefaultConfigs,
} from "./providers/repository";
import { supabase } from "./supabase";

export async function loadConfigs(): Promise<ProviderConfig[]> {
  return loadProviderConfigs();
}

export async function saveConfigs(configs: ProviderConfig[]): Promise<void> {
  for (const c of configs) {
    if (c.id === "ollama") continue;
    await saveProviderConfig(c.id, { model: c.model, enabled: c.enabled });
  }
}

export async function updateConfig(
  id: AIProviderId,
  patch: Partial<ProviderConfig>,
): Promise<ProviderConfig[]> {
  await saveProviderConfig(id, patch);
  return loadProviderConfigs();
}

/**
 * Loads provider configs and merges Ollama settings from clinic_ai_settings.
 * This is the main entry point for components that need provider configs.
 */
export async function loadConfigsWithOllamaSettings(): Promise<ProviderConfig[]> {
  const base = await loadProviderConfigs();
  try {
    const { data } = await supabase
      .from("clinic_ai_settings")
      .select("enabled, bridge_url, model")
      .eq("id", 1)
      .maybeSingle();
    if (data) {
      return base.map((c) =>
        c.id === "ollama"
          ? {
              ...c,
              model: data.model || c.model,
              enabled: data.enabled ?? c.enabled,
              hasApiKey: true,
            }
          : c,
      );
    }
  } catch {
    // ignore — use base config
  }
  return base;
}

export { getDefaultConfigs as DEFAULT_CONFIGS };
