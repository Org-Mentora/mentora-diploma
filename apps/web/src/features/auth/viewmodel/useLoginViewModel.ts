import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import { useLoginMutation } from '@/model/api/generated/mentoraApi';
import {
  AuthForms,
  type LoginFormValues,
  loginFormSchema,
} from '@/model/domain/session/auth.forms';

export interface LoginViewModel {
  form: UseFormReturn<LoginFormValues>;
  error: UiError | null;
  isSubmitting: boolean;
  submit: () => Promise<void>;
}

/** CU-01 Log in. */
export function useLoginViewModel(): LoginViewModel {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });
  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = useState<UiError | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/patients';

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const session = await login({ loginRequestDto: AuthForms.toLoginRequest(values) }).unwrap();
      navigate(session.subscription.status === 'expired' ? '/plan-expired' : from, {
        replace: true,
      });
    } catch (caught) {
      setError(ApiErrorAdapter.toUiError(caught));
    }
  });

  return { form, error, isSubmitting: isLoading, submit };
}
