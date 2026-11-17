import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useRequestPasswordRecoveryMutation,
  useResetPasswordMutation,
  useVerifyRecoveryCodeMutation,
} from '@/model/api/generated/mentoraApi';
import { useForgotPasswordViewModel } from './useForgotPasswordViewModel';

vi.mock('@/model/api/generated/mentoraApi', () => ({
  useRequestPasswordRecoveryMutation: vi.fn(),
  useVerifyRecoveryCodeMutation: vi.fn(),
  useResetPasswordMutation: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

const request = vi.fn();
const verify = vi.fn();
const reset = vi.fn();
const ok = (value: unknown = undefined) => ({ unwrap: () => Promise.resolve(value) });

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

describe('useForgotPasswordViewModel (CU-02)', () => {
  beforeEach(() => {
    vi.mocked(useRequestPasswordRecoveryMutation).mockReturnValue([
      request,
      { isLoading: false },
    ] as never);
    vi.mocked(useVerifyRecoveryCodeMutation).mockReturnValue([
      verify,
      { isLoading: false },
    ] as never);
    vi.mocked(useResetPasswordMutation).mockReturnValue([reset, { isLoading: false }] as never);
    request.mockReturnValue(ok({ message: 'If the email belongs to an account…' }));
  });

  it('goes email → code → password and sends the code with the new password', async () => {
    verify.mockReturnValue(ok());
    reset.mockReturnValue(ok());
    const { result } = renderHook(() => useForgotPasswordViewModel(), { wrapper });

    act(() => result.current.emailForm.setValue('email', 'ana@mentora.test'));
    await act(() => result.current.requestCode());
    expect(result.current.step).toBe('code');
    expect(result.current.notice).toContain('If the email belongs');

    act(() => result.current.codeForm.setValue('code', '123456'));
    await act(() => result.current.verifyCode());
    expect(result.current.step).toBe('password');

    act(() => {
      result.current.passwordForm.setValue('newPassword', 'Changed456');
      result.current.passwordForm.setValue('confirmPassword', 'Changed456');
    });
    await act(() => result.current.resetPassword());
    expect(reset).toHaveBeenCalledWith({
      resetPasswordRequestDto: {
        email: 'ana@mentora.test',
        code: '123456',
        newPassword: 'Changed456',
      },
    });
  });

  it('shows a wrong or expired code on the code field (step 8 alternative)', async () => {
    verify.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 400,
          data: {
            error: {
              code: 'INVALID_RECOVERY_CODE',
              message: 'The code is incorrect or has expired.',
              details: { field: 'code' },
            },
          },
        }),
    });
    const { result } = renderHook(() => useForgotPasswordViewModel(), { wrapper });

    act(() => result.current.emailForm.setValue('email', 'ana@mentora.test'));
    await act(() => result.current.requestCode());
    act(() => result.current.codeForm.setValue('code', '000000'));
    await act(() => result.current.verifyCode());

    expect(result.current.step).toBe('code');
    expect(result.current.codeForm.getFieldState('code').error?.message).toContain('incorrect');
  });
});
