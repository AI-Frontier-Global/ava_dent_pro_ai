// موفر Anthropic — يتحدث مع واجهة Messages الرسمية.

export type AnthropicModel = 'claude-3-5-sonnet-20241022' | 'claude-3-5-haiku-20241022' | 'claude-3-opus-20240229';

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicResponse {
  text: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const ENDPOINT = 'https://api.anthropic.com/v1/messages';

export async function anthropicChat(
  apiKey: string,
  systemPrompt: string,
  messages: AnthropicMessage[],
  options: { model?: AnthropicModel; temperature?: number; maxTokens?: number } = {},
): Promise<AnthropicResponse | null> {
  const model = options.model ?? 'claude-3-5-haiku-20241022';
  const body = {
    model,
    system: systemPrompt,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 800,
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.content?.map((c: { text: string }) => c.text).join('') ?? '';
    return {
      text,
      model: data.model ?? model,
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
    };
  } catch {
    return null;
  }
}

export async function anthropicHealthCheck(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const ANTHROPIC_PRICING: Record<AnthropicModel, { input: number; output: number }> = {
  // سعر لكل 1K رمز (بالدولار)
  'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
  'claude-3-5-haiku-20241022': { input: 0.0008, output: 0.004 },
  'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
};
