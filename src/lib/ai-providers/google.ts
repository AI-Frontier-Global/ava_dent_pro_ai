// موفر Google Gemini — يتحدث مع واجهة Generate Content الرسمية.

export type GoogleModel = 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'gemini-2.0-flash-exp';

export interface GoogleMessage {
  role: 'user' | 'model';
  content: string;
}

export interface GoogleResponse {
  text: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

function endpoint(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

export async function googleChat(
  apiKey: string,
  systemPrompt: string,
  messages: GoogleMessage[],
  options: { model?: GoogleModel; temperature?: number; maxTokens?: number } = {},
): Promise<GoogleResponse | null> {
  const model = options.model ?? 'gemini-1.5-flash';
  const contents = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));
  const body = {
    contents,
    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 800,
    },
  };

  try {
    const res = await fetch(endpoint(model, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p: { text: string }) => p.text).join('') ?? '';
    return {
      text,
      model,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
      },
    };
  } catch {
    return null;
  }
}

export async function googleHealthCheck(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(endpoint('gemini-1.5-flash', apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
        generationConfig: { maxOutputTokens: 1 },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const GOOGLE_PRICING: Record<GoogleModel, { input: number; output: number }> = {
  // سعر لكل 1K رمز (بالدولار)
  'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
  'gemini-2.0-flash-exp': { input: 0, output: 0 },
};
