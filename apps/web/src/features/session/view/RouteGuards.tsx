import { Navigate, Outlet, useLocation } from 'react-router';
import { useSessionViewModel } from '../viewmodel/useSessionViewModel';

function FullPageMessage({ text }: { text: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center text-muted-foreground text-sm">
      {text}
    </div>
  );
}

/** Protected area: requires a session with an active subscription or trial. */
export function RequireSession() {
  const { state } = useSessionViewModel();
  const location = useLocation();

  if (state === 'loading') {
    return <FullPageMessage text="Loading your session…" />;
  }
  if (state === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (state === 'expired') {
    return <Navigate to="/plan-expired" replace />;
  }
  return <Outlet />;
}

/** Login and register: skip them when the professional is already logged in. */
export function PublicOnly() {
  const { state } = useSessionViewModel();

  if (state === 'loading') {
    return <FullPageMessage text="Loading…" />;
  }
  if (state === 'active') {
    return <Navigate to="/patients" replace />;
  }
  if (state === 'expired') {
    return <Navigate to="/plan-expired" replace />;
  }
  return <Outlet />;
}
