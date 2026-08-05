// Unified AI Gateway Edge Function
//
// Receives: { clinicId, provider, prompt, systemPrompt?, messages?, model?, temperature?, maxTokens? }
// Loads encrypted API key from Supabase (server-side only).
// Calls the provider API.
// Returns: { text, provider, model, usage, costUsd }
//
// API keys NEVER reach the browser. The browser only sends prompts.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GatewayRequest {
  clinicId: string;
  provider: string;
  prompt?: string;
  systemPrompt?: string;
  messages?: { role: string; content: string }[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface ProviderResponse {
  text: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const PRICING: Record<string, Record<string, { input: number; output: number }>> = {
  openai: {
    "gpt-4o": { input: 0.005, output: 0.015 },
    "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
    "gpt-4-turbo": { input: 0.01, output: 0.03 },
    "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
  },
  anthropic: {
    "claude-3-5-sonnet-20241022": { input: 0.003, output: 0.015 },
    "claude-3-5-haiku-20241022": { input: 0.0008, output: 0.004 },
    "claude-3-opus-20240229": { input: 0.015, output: 0.075 },
  },
  google: {
    "gemini-1.5-pro": { input: 0.00125, output: 0.005 },
    "gemini-1.5-flash": { input: 0.000075, output: 0.0003 },
    "gemini-2.0-flash-exp": { input: 0, output: 0 },
  },
};

async function callOpenAI(
  apiKey: string,
  messages: { role: string; content: string }[],
  model: string,
  temperature: number,
  maxTokens: number,
): Promise<ProviderResponse | null> {
  const body = { model, messages, temperature, max_tokens: maxTokens };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const choice = data.choices?.[0];
  if (!choice) return null;
  return {
    text: choice.message?.content ?? "",
    model: data.model ?? model,
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    },
  };
}

async function callAnthropic(
  apiKey: string,
  systemPrompt: string,
  messages: { role: string; content: string }[],
  model: string,
  temperature: number,
  maxTokens: number,
): Promise<ProviderResponse | null> {
  const body = {
    model,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature,
    max_tokens: maxTokens,
  };
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.content?.map((c: { text: string }) => c.text).join("") ?? "";
  return {
    text,
    model: data.model ?? model,
    usage: {
      promptTokens: data.usage?.input_tokens ?? 0,
      completionTokens: data.usage?.output_tokens ?? 0,
      totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    },
  };
}

async function callGoogle(
  apiKey: string,
  systemPrompt: string,
  messages: { role: string; content: string }[],
  model: string,
  temperature: number,
  maxTokens: number,
): Promise<ProviderResponse | null> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const body = {
    contents,
    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  };
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: { text: string }) => p.text).join("") ?? "";
  return {
    text,
    model,
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json() as GatewayRequest;
    const { clinicId, provider, prompt, systemPrompt, messages, model, temperature, maxTokens } = body;

    if (!clinicId || !provider) {
      return new Response(
        JSON.stringify({ error: "clinicId and provider are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load encrypted API key from database (server-side only)
    const { data: cred, error: credError } = await supabase
      .from("clinic_ai_credentials")
      .select("api_key_encrypted, model, enabled")
      .eq("clinic_id", clinicId)
      .eq("provider", provider)
      .maybeSingle();

    if (credError || !cred || !cred.enabled) {
      return new Response(
        JSON.stringify({ error: "Provider not configured or disabled" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Decrypt the API key
    const encKey = Deno.env.get("AI_ENCRYPTION_KEY");
    if (!encKey) {
      return new Response(
        JSON.stringify({ error: "Server encryption key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let apiKey: string;
    try {
      const { data: decrypted } = await supabase.rpc("decrypt_api_key", {
        encrypted_text: cred.api_key_encrypted,
        key_pass: encKey,
      });
      apiKey = decrypted as string;
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to decrypt API key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const useModel = model ?? cred.model;
    const useTemp = temperature ?? 0.7;
    const useMaxTokens = maxTokens ?? 800;

    // Build messages array
    const chatMessages: { role: string; content: string }[] = [];
    if (systemPrompt) chatMessages.push({ role: "system", content: systemPrompt });
    if (messages && messages.length > 0) {
      chatMessages.push(...messages);
    } else if (prompt) {
      chatMessages.push({ role: "user", content: prompt });
    }

    let result: ProviderResponse | null = null;

    if (provider === "openai") {
      result = await callOpenAI(apiKey, chatMessages, useModel, useTemp, useMaxTokens);
    } else if (provider === "anthropic") {
      const sysPrompt = systemPrompt ?? "";
      const userMessages = chatMessages.filter((m) => m.role !== "system");
      result = await callAnthropic(apiKey, sysPrompt, userMessages, useModel, useTemp, useMaxTokens);
    } else if (provider === "google") {
      const sysPrompt = systemPrompt ?? "";
      const userMessages = chatMessages.filter((m) => m.role !== "system");
      result = await callGoogle(apiKey, sysPrompt, userMessages, useModel, useTemp, useMaxTokens);
    } else {
      return new Response(
        JSON.stringify({ error: `Unknown provider: ${provider}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Provider call failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Calculate cost
    const providerPricing = PRICING[provider]?.[useModel] ?? { input: 0, output: 0 };
    const costUsd = (result.usage.promptTokens * providerPricing.input + result.usage.completionTokens * providerPricing.output) / 1000;

    return new Response(
      JSON.stringify({
        text: result.text,
        provider,
        model: result.model,
        usage: result.usage,
        costUsd,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
