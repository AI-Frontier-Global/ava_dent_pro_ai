import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  message: string;
  history?: { role: string; content: string }[];
}

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ENTRIES = 8;
const MAX_HISTORY_CONTENT_LENGTH = 2000;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: settings, error: settingsError } = await supabase
      .from("clinic_ai_settings")
      .select("enabled, server_url, model, system_prompt")
      .eq("id", 1)
      .maybeSingle();

    if (settingsError) throw settingsError;

    if (!settings || !settings.enabled) {
      return new Response(
        JSON.stringify({
          reply: null,
          offline: true,
          reason: "AI assistant is disabled. Configure it in Settings.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { message, history = [] } = (await req.json()) as ChatRequest;
    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Message exceeds ${MAX_MESSAGE_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const serverUrl = settings.server_url ?? "";
    if (!serverUrl) {
      return new Response(
        JSON.stringify({
          reply: null,
          offline: true,
          reason: "Ollama server URL not configured. Set it in Settings.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const ollamaUrl = serverUrl.replace(/\/$/, "");

    const sanitizedHistory = (Array.isArray(history) ? history : [])
      .slice(-MAX_HISTORY_ENTRIES)
      .filter((h) => h && typeof h.content === "string" && h.content.length <= MAX_HISTORY_CONTENT_LENGTH)
      .map((h) => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: h.content,
      }));

    const messages = [
      { role: "system", content: settings.system_prompt ?? "You are a helpful dental clinic assistant." },
      ...sanitizedHistory,
      { role: "user", content: message },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let ollamaResponse: Response;
    try {
      ollamaResponse = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: settings.model,
          messages,
          stream: false,
        }),
        signal: controller.signal,
      });
    } catch {
      clearTimeout(timeout);
      return new Response(
        JSON.stringify({
          reply: null,
          offline: true,
          reason: `Cannot reach Ollama server. Make sure Ollama is running on the clinic computer.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    clearTimeout(timeout);

    if (!ollamaResponse.ok) {
      return new Response(
        JSON.stringify({
          reply: null,
          offline: true,
          reason: `Ollama returned an error (status ${ollamaResponse.status}).`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await ollamaResponse.json();
    const reply = data?.message?.content ?? "";

    return new Response(
      JSON.stringify({ reply, offline: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
