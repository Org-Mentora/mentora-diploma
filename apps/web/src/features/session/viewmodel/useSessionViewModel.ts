import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import {
  mentoraApi,
  useGetCurrentProfessionalQuery,
  useLogoutMutation,
} from '@/model/api/generated/mentoraApi';
import { SessionAdapter, type SessionUiModel } from '@/model/domain/session/SessionAdapter';

export type SessionState = 'loading' | 'anonymous' | 'active' | 'restricted';

export const PLAN_PATH = '/settings/plan';

export interface SessionViewModel {
  state: SessionState;
  session: SessionUiModel | null;
  isLoggingOut: boolean;
  logout: () => Promise<void>;
}

// ViewModel
export function useSessionViewModel(): SessionViewModel {
  const { data, isLoading, isError } = useGetCurrentProfessionalQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const session = useMemo(
    () => (data && !isError ? SessionAdapter.toUiModel(data) : null),
    [data, isError],
  );

  let state: SessionState = 'active';
  if (isLoading) {
    state = 'loading';
  } else if (!session) {
    state = 'anonymous';
  } else if (!session.hasAccess) {
    state = 'restricted';
  }

  return {
    state,
    session,
    isLoggingOut,
    logout: async () => {
      await logout()
        .unwrap()
        .catch(() => undefined);
      dispatch(mentoraApi.util.resetApiState());
      navigate('/login', { replace: true });
    },
  };
}
