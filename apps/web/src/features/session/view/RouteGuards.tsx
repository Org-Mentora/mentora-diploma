import { Navigate, Outlet, useLocation } from 'react-router';
import { useTranslation } from '@/shared/i18n';
import { PLAN_PATH, useSessionViewModel } from '../viewmodel/useSessionViewModel';

function FullPageMessage({ text }: { text: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center text-muted-foreground text-sm">
      {text}
    </div>
  );
}

export function RequireLogin() {
  const { t } = useTranslation();
  const { state } = useSessionViewModel();
  const location = useLocation();

  if (state === 'loading') {
    return <FullPageMessage text={t('session.loading')} />;
  }
  if (state === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export function RequireSession() {
  const { t } = useTranslation();
  const { state } = useSessionViewModel();
  const location = useLocation();

  if (state === 'loading') {
    return <FullPageMessage text={t('session.loading')} />;
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
  const { t } = useTranslation();
  const { state } = useSessionViewModel();

  if (state === 'loading') {
    return <FullPageMessage text={t('common.loading')} />;
  }
  if (state === 'active') {
    return <Navigate to="/patients" replace />;
  }
  if (state === 'restricted') {
    return <Navigate to={PLAN_PATH} replace />;
  }
  return <Outlet />;
}
