// Global Error Boundary — wraps every page, prevents full app crashes.
//
// Shows a professional fallback UI with a retry button and logs the error
// through the centralized error service.

import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { logError } from "@/lib/reliability/error-service";

interface Props {
  children: ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error: unknown;
  retryKey: number;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, retryKey: 0 };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: { componentStack: string }): void {
    logError(error, `ErrorBoundary:${this.props.pageName ?? "unknown"}:${info.componentStack}`);
  }

  handleRetry = (): void => {
    this.setState((prev) => ({ hasError: false, error: null, retryKey: prev.retryKey + 1 }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6" key={this.state.retryKey}>
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-50">
              <AlertTriangle size={28} className="text-error-500" />
            </div>
            <h2 className="mb-2 text-lg font-bold text-slate-800">حدث خطأ غير متوقع</h2>
            <p className="mb-6 text-sm text-slate-500">
              نواجه صعوبة في عرض هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة لاحقاً.
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600"
            >
              <RotateCcw size={16} />
              إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  pageName: string,
): React.ComponentType<P> {
  const Wrapped = (props: P) => (
    <ErrorBoundary pageName={pageName}>
      <Component {...props} />
    </ErrorBoundary>
  );
  Wrapped.displayName = `WithErrorBoundary(${pageName})`;
  return Wrapped;
}
