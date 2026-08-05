// Centralized Error Service
//
// Single entry point for error classification, logging, and reporting.
// Every module should route errors through here instead of ad-hoc try/catch.

import { monitoring } from "./monitoring";

export type ErrorCategory =
  | "network"
  | "database"
  | "ai"
  | "authentication"
  | "permission"
  | "validation"
  | "unknown";

export interface ClassifiedError {
  category: ErrorCategory;
  message: string;
  original: unknown;
  recoverable: boolean;
  userMessage: string;
}

const NETWORK_PATTERNS = [
  "fetch",
  "network",
  "failed to fetch",
  "networkerror",
  "err_internet_disconnected",
  "err_name_not_resolved",
  "err_connection_refused",
  "err_connection_reset",
  "err_connection_closed",
  "timeout",
  "aborted",
  "load failed",
];

const DATABASE_PATTERNS = [
  "postgres",
  "supabase",
  "database",
  "relation",
  "schema",
  "duplicate key",
  "foreign key",
  "violates",
  "rls",
  "policy",
  "permission denied for table",
];

const AI_PATTERNS = [
  "openai",
  "anthropic",
  "gemini",
  "google",
  "ollama",
  "ai-gateway",
  "edge function",
  "provider",
  "model",
  "token",
  "rate limit",
  "quota",
];

const AUTH_PATTERNS = [
  "auth",
  "unauthorized",
  "401",
  "403",
  "invalid credentials",
  "session",
  "jwt",
  "token",
  "not authenticated",
  "auth.uid",
];

const PERMISSION_PATTERNS = [
  "permission",
  "forbidden",
  "403",
  "not authorized",
  "not allowed",
  "access denied",
  "rls",
  "policy",
];

const VALIDATION_PATTERNS = [
  "validation",
  "invalid",
  "required",
  "must be",
  "cannot be empty",
  "expected",
  "schema",
];

function matchesAny(text: string, patterns: string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

export function classifyError(err: unknown): ClassifiedError {
  const message = err instanceof Error ? err.message : String(err ?? "Unknown error");
  const text = message.toLowerCase();

  let category: ErrorCategory = "unknown";
  let recoverable = false;

  if (matchesAny(text, NETWORK_PATTERNS)) {
    category = "network";
    recoverable = true;
  } else if (matchesAny(text, AUTH_PATTERNS)) {
    category = "authentication";
    recoverable = false;
  } else if (matchesAny(text, PERMISSION_PATTERNS)) {
    category = "permission";
    recoverable = false;
  } else if (matchesAny(text, AI_PATTERNS)) {
    category = "ai";
    recoverable = true;
  } else if (matchesAny(text, DATABASE_PATTERNS)) {
    category = "database";
    recoverable = true;
  } else if (matchesAny(text, VALIDATION_PATTERNS)) {
    category = "validation";
    recoverable = false;
  }

  const userMessage = userMessageFor(category, message);
  return { category, message, original: err, recoverable, userMessage };
}

function userMessageFor(category: ErrorCategory, _detail: string): string {
  switch (category) {
    case "network":
      return "تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مرة أخرى.";
    case "database":
      return "حدث خطأ في قاعدة البيانات. يتمت إعادة المحاولة تلقائياً.";
    case "ai":
      return "تعذر الاتصال بموفر الذكاء الاصطناعي. حاول مرة أخرى أو فعّل موفراً آخر.";
    case "authentication":
      return "انتهت الجلسة. الرجاء إعادة تسجيل الدخول.";
    case "permission":
      return "لا تملك صلاحية لتنفيذ هذا الإجراء.";
    case "validation":
      return "البيانات المدخلة غير صحيحة. تحقق من الحقول وأعد المحاولة.";
    default:
      return "حدث خطأ غير متوقع. حاول مرة أخرى.";
  }
}

export function logError(err: unknown, context?: string): ClassifiedError {
  const classified = classifyError(err);
  const entry = {
    timestamp: Date.now(),
    context: context ?? "unknown",
    ...classified,
  };

  if (import.meta.env.DEV) {
    console.error(`[${classified.category.toUpperCase()}] ${context ?? ""}:`, err);
  }

  monitoring.recordError({
    category: classified.category,
    context: context ?? "unknown",
    message: classified.message,
    recoverable: classified.recoverable,
  });

  return entry;
}

export function reportError(err: unknown, context?: string): ClassifiedError {
  return logError(err, context);
}

export function withErrorLog<T extends (...args: never[]) => unknown>(
  fn: T,
  context: string,
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((err) => {
          logError(err, context);
          throw err;
        });
      }
      return result;
    } catch (err) {
      logError(err, context);
      throw err;
    }
  }) as T;
}
