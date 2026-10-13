import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppStore } from '@/app/store/AppStore';
import {
  useGetCurrentProfessionalQuery,
  useLogoutMutation,
} from '@/model/api/generated/mentoraApi';
import { useSessionViewModel } from './useSessionViewModel';

vi.mock('@/model/api/generated/mentoraApi', () => ({
  useGetCurrentProfessionalQuery: vi.fn(),
  useLogoutMutation: vi.fn(),
  mentoraApi: { util: { resetApiState: () => ({ type: 'api/resetApiState' }) } },
}));

const session = {
  professional: {
    id: 'p',
    firstName: 'Ana',
    lastName: 'García',
    fullName: 'Ana García',
    email: 'ana@x.dev',
    phone: '1',
    specialty: 'Psychiatry',
    licenseNumber: 'MN-1',
  },
  subscription: { status: 'trial', accessEndsAt: null, daysLeft: 2 },
};

const logout = vi.fn();

function wrapper({ children }: { children: ReactNode }) {
  return (
    <Provider store={AppStore.create()}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );
}

function givenMe(result: Record<string, unknown>) {
  vi.mocked(useGetCurrentProfessionalQuery).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    ...result,
  } as unknown as ReturnType<typeof useGetCurrentProfessionalQuery>);
}

describe('useSessionViewModel', () => {
  beforeEach(() => {
    logout.mockReset().mockReturnValue({ unwrap: () => Promise.resolve() });
    vi.mocked(useLogoutMutation).mockReturnValue([
      logout,
      { isLoading: false },
    ] as unknown as ReturnType<typeof useLogoutMutation>);
  });

  it.each([
    [{ isLoading: true }, 'loading'],
    [{ isError: true }, 'anonymous'],
    [{ data: session }, 'active'],
    [
      {
        data: { ...session, subscription: { status: 'expired', accessEndsAt: null, daysLeft: 0 } },
      },
      'expired',
    ],
  ])('%j → %s', (result, state) => {
    givenMe(result);
    const { result: vm } = renderHook(() => useSessionViewModel(), { wrapper });
    expect(vm.current.state).toBe(state);
  });

  it('exposes the trial status with a warning tone near the end', () => {
    givenMe({ data: session });
    const { result } = renderHook(() => useSessionViewModel(), { wrapper });

    expect(result.current.session).toMatchObject({
      initials: 'AG',
      subscriptionLabel: 'Free trial · 2 days left',
      subscriptionTone: 'warning',
    });
  });

  it('logout calls the API even if it fails', async () => {
    givenMe({ data: session });
    logout.mockReturnValue({ unwrap: () => Promise.reject(new Error('offline')) });
    const { result } = renderHook(() => useSessionViewModel(), { wrapper });

    await act(() => result.current.logout());
    expect(logout).toHaveBeenCalledOnce();
  });
});
