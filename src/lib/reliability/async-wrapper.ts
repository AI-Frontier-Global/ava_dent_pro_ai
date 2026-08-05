// Async Error Wrappers — Reusable helpers to replace duplicated try/catch.
//
// Usage:
//   const { data, error } = await safeAsync(() => fetchSomething(), "context");
//   if (error) { /* error already logged + classified */ }

import { classifyError, logError, type ClassifiedError } from "./error-service";

export interface SafeResult<T> {
  data: T | null;
  error: ClassifiedError | null;
}

export async function safeAsync<T>(
  fn: () => Promise<T>,
  context: string,
): Promise<SafeResult<T>> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (err) {
    const error = logError(err, context);
    return { data: null, error };
  }
}

export function safeSync<T>(fn: () => T, context: string): SafeResult<T> {
  try {
    const data = fn();
    return { data, error: null };
  } catch (err) {
    const error = logError(err, context);
    return { data: null, error };
  }
}

export async function safeAsyncOr<T>(
  fn: () => Promise<T>,
  fallback: T,
  context: string,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    logError(err, context);
    return fallback;
  }
}

export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delayMs?: number; context?: string } = {},
): Promise<T> {
  const { retries = 3, delayMs = 1000, context = "retry" } = options;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
      }
    }
  }
  logError(lastErr, context);
  throw lastErr;
}

export function isNetworkError(err: unknown): boolean {
  return classifyError(err).category === "network";
}

export function isAuthError(err: unknown): boolean {
  return classifyError(err).category === "authentication";
}
