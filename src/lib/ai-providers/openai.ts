// موفر OpenAI — يتحدث مع واجهة Chat Completions الرسمية.
// كل الاستدعاءات تُرجع null عند الفشل ليتمكن المستدعي من التحويل للاحتياطي.

export type OpenAIModel = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-3.5-turbo';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  text: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export async function openaiChat(
  apiKey: string,
  messages: OpenAIMessage[],
  options: { model?: OpenAIModel; temperature?: number; maxTokens?: number } = {},
): Promise<OpenAIResponse | null> {
  const model = options.model ?? 'gpt-4o-mini';
  const body = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 800,
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice) return null;
    return {
      text: choice.message?.content ?? '',
      model: data.model ?? model,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
    };
  } catch {
    return null;
  }
}

export async function openaiHealthCheck(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const OPENAI_PRICING: Record<OpenAIModel, { input: number; output: number }> = {
  // سعر لكل 1K رمز (بالدولار)
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
};
