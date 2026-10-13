import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import {
  mentoraApi,
  useGetCurrentProfessionalQuery,
  useLogoutMutation,
} from '@/model/api/generated/mentoraApi';
import { SessionAdapter, type SessionUiModel } from '@/model/domain/session/SessionAdapter';

/** `expired` = logged in but the trial ended (CU-01 step 7). */
export type SessionState = 'loading' | 'anonymous' | 'active' | 'expired';

export interface SessionViewModel {
  state: SessionState;
  session: SessionUiModel | null;
  isLoggingOut: boolean;
  logout: () => Promise<void>;
}

/** ViewModel shared by the route guards and the application shell. */
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
  } else if (session.isExpired) {
    state = 'expired';
  }

  return {
    state,
    session,
    isLoggingOut,
    logout: async () => {
      await logout()
        .unwrap()
        .catch(() => undefined);
      // Drop every cached response so the next professional never sees stale data.
      dispatch(mentoraApi.util.resetApiState());
      navigate('/login', { replace: true });
    },
  };
}
