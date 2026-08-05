// Centralized Toast / Notification Service
//
// Extends the existing Toast component with a centralized service layer.
// Supports: success, warning, error, info.
// Usage: import { toast } from "@/lib/reliability/toast"; toast.success("message");

import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { createRoot } from "react-dom/client";

export type ToastType = "success" | "warning" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

const listeners = new Set<ToastListener>();
let toasts: ToastItem[] = [];
let idCounter = 0;

function notify() {
  for (const l of listeners) l([...toasts]);
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

function show(message: string, type: ToastType, duration = 3500) {
  const id = ++idCounter;
  toasts = [...toasts, { id, message, type, duration }];
  notify();
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }
  return id;
}

export const toast = {
  success: (msg: string) => show(msg, "success"),
  warning: (msg: string) => show(msg, "warning"),
  error: (msg: string) => show(msg, "error", 5000),
  info: (msg: string) => show(msg, "info"),
  dismiss,
};

export function subscribe(listener: ToastListener): () => void {
  listeners.add(listener);
  listener([...toasts]);
  return () => {
    listeners.delete(listener);
  };
}

const config: Record<ToastType, { icon: typeof CheckCircle2; bg: string; text: string; ring: string }> = {
  success: { icon: CheckCircle2, bg: "bg-success-50", text: "text-success-800", ring: "ring-success-200" },
  warning: { icon: AlertTriangle, bg: "bg-warning-50", text: "text-warning-800", ring: "ring-warning-200" },
  error: { icon: AlertCircle, bg: "bg-error-50", text: "text-error-800", ring: "ring-error-200" },
  info: { icon: Info, bg: "bg-blue-50", text: "text-blue-800", ring: "ring-blue-200" },
};

// Singleton toast container — mounted once at app root
let containerMounted = false;

export function mountToastContainer() {
  if (containerMounted) return;
  containerMounted = true;
  const el = document.createElement("div");
  el.id = "toast-container";
  document.body.appendChild(el);
  const root = createRoot(el);

  const render = (currentToasts: ToastItem[]) => {
    root.render(
      <div className="fixed bottom-6 left-6 z-[60] flex flex-col gap-2">
        {currentToasts.map((t) => {
          const c = config[t.type];
          const Icon = c.icon;
          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 rounded-xl ${c.bg} px-4 py-3 shadow-elev-1 ring-1 ${c.ring} animate-modal-in`}
            >
              <Icon size={20} className={c.text} />
              <span className={`text-sm font-bold ${c.text}`}>{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="mr-2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>,
    );
  };

  subscribe(render);
}

export { show };
