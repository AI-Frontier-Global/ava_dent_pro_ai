// متتبّع تكاليف استدعاءات الذكاء الاصطناعي — يخزّن السجل محلياً في المتصفح.

export type ProviderId = 'openai' | 'anthropic' | 'google' | 'ollama';

export interface UsageRecord {
  id: string;
  provider: ProviderId;
  tokens: number;
  costUsd: number;
  timestamp: number;
}

export interface ProviderStats {
  totalCalls: number;
  totalTokens: number;
  totalCostUsd: number;
  avgCostPerCall: number;
  avgTokensPerCall: number;
}

const STORAGE_KEY = 'ai_cost_records';
const MAX_RECORDS = 500;

function loadRecords(): UsageRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as UsageRecord[];
  } catch {
    return [];
  }
}

function saveRecords(records: UsageRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-MAX_RECORDS)));
  } catch {
    /* تجاهل */
  }
}

export function recordUsage(provider: ProviderId, tokens: number, costUsd: number): void {
  const records = loadRecords();
  records.push({
    id: Math.random().toString(36).slice(2, 10),
    provider,
    tokens,
    costUsd,
    timestamp: Date.now(),
  });
  saveRecords(records);
}

export function getAllRecords(): UsageRecord[] {
  return loadRecords();
}

export function getProviderStats(provider: ProviderId): ProviderStats {
  const records = loadRecords().filter((r) => r.provider === provider);
  const totalCalls = records.length;
  const totalTokens = records.reduce((s, r) => s + r.tokens, 0);
  const totalCostUsd = records.reduce((s, r) => s + r.costUsd, 0);
  return {
    totalCalls,
    totalTokens,
    totalCostUsd,
    avgCostPerCall: totalCalls > 0 ? totalCostUsd / totalCalls : 0,
    avgTokensPerCall: totalCalls > 0 ? totalTokens / totalCalls : 0,
  };
}

export function getOverallStats(): ProviderStats {
  const records = loadRecords();
  const totalCalls = records.length;
  const totalTokens = records.reduce((s, r) => s + r.tokens, 0);
  const totalCostUsd = records.reduce((s, r) => s + r.costUsd, 0);
  return {
    totalCalls,
    totalTokens,
    totalCostUsd,
    avgCostPerCall: totalCalls > 0 ? totalCostUsd / totalCalls : 0,
    avgTokensPerCall: totalCalls > 0 ? totalTokens / totalCalls : 0,
  };
}

export function clearRecords(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getDailySpend(days = 7): { date: string; costUsd: number; calls: number }[] {
  const records = loadRecords();
  const now = new Date();
  const buckets: { date: string; costUsd: number; calls: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    buckets.push({ date: dateStr, costUsd: 0, calls: 0 });
  }
  const bucketMap = new Map(buckets.map((b) => [b.date, b]));
  records.forEach((r) => {
    const dateStr = new Date(r.timestamp).toISOString().slice(0, 10);
    const bucket = bucketMap.get(dateStr);
    if (bucket) {
      bucket.costUsd += r.costUsd;
      bucket.calls += 1;
    }
  });
  return buckets;
}
