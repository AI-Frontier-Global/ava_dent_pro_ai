// Unified Loading Components
//
// Replaces duplicated spinners across the app with a consistent set:
// - PageLoader: full-page centered spinner
// - SectionLoader: inline section loading
// - TableLoader: skeleton rows for tables
// - AILoader: AI-specific loading indicator with pulse
// - Skeleton: generic skeleton block

import { Loader2 } from "lucide-react";

export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-brand-500" />
        {label && <p className="text-sm font-medium text-slate-500">{label}</p>}
      </div>
    </div>
  );
}

export function SectionLoader({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-2">
        <Loader2 size={24} className="animate-spin text-brand-500" />
        {label && <p className="text-xs font-medium text-slate-400">{label}</p>}
      </div>
    </div>
  );
}

export function TableLoader({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((__, j) => (
            <div
              key={j}
              className="h-4 flex-1 animate-pulse rounded bg-slate-200"
              style={{ animationDelay: `${(i + j) * 80}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AILoader({ label = "يفكر..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
      <div className="relative flex h-8 w-8 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-200 opacity-75" />
        <Loader2 size={20} className="relative animate-spin text-brand-500" />
      </div>
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

export function InlineSpinner({ size = 16 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-brand-500" />;
}
