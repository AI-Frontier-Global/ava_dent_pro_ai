// عميل الجسر المحلي Ollama — يتحدث مع http://localhost:3001
// كل الاستدعاءات تُرجع null عند الفشل ليتمكن المستدعي من التحويل للاحتياطي.

export interface BridgeModel {
  name: string;
  size?: string;
  modified?: string;
}

export interface BridgeStatus {
  bridge: 'online' | 'offline';
  ollama: boolean;
  ollamaHost?: string;
  systemPrompt?: string;
  tunnelUrl?: string | null;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

// اكتشاف البيئة: عند التشغيل محلياً (localhost/127.0.0.1) نستخدم proxy Vite
// لتجاوز قيود CORS و mixed-content. عند التشغيل على bolt.host نستخدم localhost مباشرة.
function resolveBridgeUrl(bridgeUrl: string): string {
  const href = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal =
    href === 'localhost' ||
    href === '127.0.0.1' ||
    href === '0.0.0.0' ||
    /^192\.168\./.test(href) ||
    /^10\./.test(href) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(href);
  if (isLocal) {
    return '/bridge-api'; // يُعاد توجيهه عبر Vite proxy إلى http://localhost:3001/api
  }
  return normalize(bridgeUrl);
}

function normalize(url: string): string {
  return (url || '').replace(/\/$/, '');
}

async function safeFetch(url: string, init?: RequestInit, timeoutMs = 8000): Promise<Response | null> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(t);
    return res;
  } catch {
    clearTimeout(t);
    return null;
  }
}

export async function getStatus(bridgeUrl: string): Promise<BridgeStatus | null> {
  const res = await safeFetch(`${resolveBridgeUrl(bridgeUrl)}/api/status`);
  if (!res || !res.ok) return null;
  try {
    const data = await res.json();
    return {
      bridge: 'online',
      ollama: !!data.ollama,
      ollamaHost: data.ollamaHost,
      systemPrompt: data.systemPrompt,
      tunnelUrl: data.tunnelUrl ?? null,
    };
  } catch {
    return null;
  }
}

export async function getModels(bridgeUrl: string): Promise<BridgeModel[] | null> {
  const res = await safeFetch(`${resolveBridgeUrl(bridgeUrl)}/api/models`);
  if (!res) return null;
  if (!res.ok) return [];
  try {
    const data = await res.json();
    return data.models || [];
  } catch {
    return null;
  }
}

export async function deleteModel(bridgeUrl: string, name: string): Promise<boolean> {
  const res = await safeFetch(`${resolveBridgeUrl(bridgeUrl)}/api/models/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  }, 15000);
  return !!res && res.ok;
}

export async function chat(
  bridgeUrl: string,
  message: string,
  history: ChatTurn[],
  model?: string,
): Promise<string | null> {
  const res = await safeFetch(
    `${resolveBridgeUrl(bridgeUrl)}/api/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, model }),
    },
    30000,
  );
  if (!res || !res.ok) return null;
  try {
    const data = await res.json();
    return data.reply || null;
  } catch {
    return null;
  }
}

export async function startService(bridgeUrl: string): Promise<boolean> {
  const res = await safeFetch(`${resolveBridgeUrl(bridgeUrl)}/api/service/start`, { method: 'POST' }, 10000);
  return !!res && res.ok;
}

export async function stopService(bridgeUrl: string): Promise<boolean> {
  const res = await safeFetch(`${resolveBridgeUrl(bridgeUrl)}/api/service/stop`, { method: 'POST' }, 10000);
  return !!res && res.ok;
}

// تحميل نموذج عبر Server-Sent Events — يستدعي onProgress لكل تحديث.
export async function pullModel(
  bridgeUrl: string,
  model: string,
  onProgress: (update: { status: string; message?: string; total?: number; completed?: number }) => void,
  signal?: AbortSignal,
): Promise<boolean> {
  try {
    const res = await fetch(`${resolveBridgeUrl(bridgeUrl)}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model }),
      signal,
    });
    if (!res.ok || !res.body) return false;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let success = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          onProgress(data);
          if (data.status === 'success') success = true;
        } catch {
          /* تجاهل الأسطر غير الصالحة */
        }
      }
    }
    return success;
  } catch {
    return false;
  }
}
