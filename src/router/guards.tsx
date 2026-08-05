import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

type Props = { children: ReactNode; session: unknown | null; ready: boolean };

export function ProtectedRoute({ children, session, ready }: Props) {
  const location = useLocation();
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500" />
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

export function PublicOnlyRoute({ children, session, ready }: Props) {
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500" />
      </div>
    );
  }
  if (session) {
    return <Navigate to="/app/dashboard" replace />;
  }
  return <>{children}</>;
}
