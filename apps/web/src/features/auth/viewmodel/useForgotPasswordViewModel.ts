import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import {
  useRequestPasswordRecoveryMutation,
  useResetPasswordMutation,
  useVerifyRecoveryCodeMutation,
} from '@/model/api/generated/mentoraApi';
import {
  PASSWORD_HINT,
  type RecoveryCodeValues,
  type RecoveryEmailValues,
  type RecoveryPasswordValues,
  recoveryCodeSchema,
  recoveryEmailSchema,
  recoveryPasswordSchema,
} from '@/model/domain/session/auth.forms';
import { useUserFeedback } from '@/model/platform/Platform';

export type { RecoveryCodeValues, RecoveryEmailValues, RecoveryPasswordValues };

export type RecoveryStep = 'email' | 'code' | 'password';

export interface ForgotPasswordViewModel {
  step: RecoveryStep;
  email: string;
  notice: string | null;
  passwordHint: string;
  emailForm: UseFormReturn<RecoveryEmailValues>;
  codeForm: UseFormReturn<RecoveryCodeValues>;
  passwordForm: UseFormReturn<RecoveryPasswordValues>;
  error: UiError | null;
  isSubmitting: boolean;
  requestCode: () => Promise<void>;
  verifyCode: () => Promise<void>;
  resetPassword: () => Promise<void>;
  resendCode: () => Promise<void>;
  startOver: () => void;
}

// ViewModel
export function useForgotPasswordViewModel(): ForgotPasswordViewModel {
  const feedback = useUserFeedback();
  const [step, setStep] = useState<RecoveryStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<UiError | null>(null);
  const navigate = useNavigate();

  const emailForm = useForm<RecoveryEmailValues>({
    resolver: zodResolver(recoveryEmailSchema),
    defaultValues: { email: '' },
  });
  const codeForm = useForm<RecoveryCodeValues>({
    resolver: zodResolver(recoveryCodeSchema),
    defaultValues: { code: '' },
  });
  const passwordForm = useForm<RecoveryPasswordValues>({
    resolver: zodResolver(recoveryPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const [request, requesting] = useRequestPasswordRecoveryMutation();
  const [verify, verifying] = useVerifyRecoveryCodeMutation();
  const [reset, resetting] = useResetPasswordMutation();

  const send = async (address: string) => {
    setError(null);
    try {
      const result = await request({ passwordRecoveryRequestDto: { email: address } }).unwrap();
      setEmail(address);
      setNotice(result.message);
      setStep('code');
    } catch (caught) {
      setError(ApiErrorAdapter.toUiError(caught));
    }
  };

  const failOn = (field: 'code' | 'newPassword', caught: unknown) => {
    const uiError = ApiErrorAdapter.toUiError(caught);
    if (uiError?.field === 'code') {
      codeForm.setError('code', { message: uiError.message });
      setStep('code');
    } else if (uiError?.field === 'newPassword' && field === 'newPassword') {
      passwordForm.setError('newPassword', { message: uiError.message });
    } else {
      setError(uiError);
    }
  };

  return {
    step,
    email,
    notice,
    passwordHint: PASSWORD_HINT,
    emailForm,
    codeForm,
    passwordForm,
    error,
    isSubmitting: requesting.isLoading || verifying.isLoading || resetting.isLoading,
    requestCode: emailForm.handleSubmit((values) => send(values.email)),
    resendCode: () => send(email),
    verifyCode: codeForm.handleSubmit(async (values) => {
      setError(null);
      try {
        await verify({ verifyRecoveryCodeRequestDto: { email, code: values.code } }).unwrap();
        setCode(values.code);
        setStep('password');
      } catch (caught) {
        failOn('code', caught);
      }
    }),
    resetPassword: passwordForm.handleSubmit(async (values) => {
      setError(null);
      try {
        await reset({
          resetPasswordRequestDto: { email, code, newPassword: values.newPassword },
        }).unwrap();
        feedback.success('Your password was changed. Log in with the new one.');
        navigate('/login', { replace: true });
      } catch (caught) {
        failOn('newPassword', caught);
      }
    }),
    startOver: () => {
      setStep('email');
      setNotice(null);
      setError(null);
      codeForm.reset();
      passwordForm.reset();
    },
  };
}
