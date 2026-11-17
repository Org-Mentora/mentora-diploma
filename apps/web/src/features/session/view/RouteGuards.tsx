import { Navigate, Outlet, useLocation } from 'react-router';
import { PLAN_PATH, useSessionViewModel } from '../viewmodel/useSessionViewModel';

function FullPageMessage({ text }: { text: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center text-muted-foreground text-sm">
      {text}
    </div>
  );
}

export function RequireLogin() {
  const { state } = useSessionViewModel();
  const location = useLocation();

  if (state === 'loading') {
    return <FullPageMessage text="Loading your session…" />;
  }
  if (state === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export function RequireSession() {
  const { state } = useSessionViewModel();
  const location = useLocation();

  if (state === 'loading') {
    return <FullPageMessage text="Loading your session…" />;
  }
  if (state === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (state === 'restricted') {
    return <Navigate to={PLAN_PATH} replace />;
  }
  return <Outlet />;
}

export function PublicOnly() {
  const { state } = useSessionViewModel();

  if (state === 'loading') {
    return <FullPageMessage text="Loading…" />;
  }
  if (state === 'active') {
    return <Navigate to="/patients" replace />;
  }
  if (state === 'restricted') {
    return <Navigate to={PLAN_PATH} replace />;
  }
  return <Outlet />;
}
