import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import { useRegisterProfessionalMutation } from '@/model/api/generated/mentoraApi';
import {
  AuthForms,
  type RegisterFormValues,
  registerFormDefaults,
  registerFormSchema,
} from '@/model/domain/session/auth.forms';

export interface RegisterViewModel {
  form: UseFormReturn<RegisterFormValues>;
  error: UiError | null;
  isSubmitting: boolean;
  submit: () => Promise<void>;
}

const FIELDS = new Set<keyof RegisterFormValues>(['email', 'licenseNumber', 'password']);

/** CU-03 Register professional (starts the free trial). */
export function useRegisterViewModel(): RegisterViewModel {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: registerFormDefaults,
  });
  const [register, { isLoading }] = useRegisterProfessionalMutation();
  const [error, setError] = useState<UiError | null>(null);
  const navigate = useNavigate();

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const session = await register({
        registerProfessionalRequestDto: AuthForms.toRegisterRequest(values),
      }).unwrap();
      // CU-03 step 12: tell the professional when the trial ends.
      toast.success(`Welcome! Your free trial lasts ${session.subscription.daysLeft ?? 0} days.`);
      navigate('/patients', { replace: true });
    } catch (caught) {
      const uiError = ApiErrorAdapter.toUiError(caught);
      const field = uiError?.field as keyof RegisterFormValues | undefined;
      if (uiError && field && FIELDS.has(field)) {
        form.setError(field, { message: uiError.message });
      } else {
        setError(uiError);
      }
    }
  });

  return { form, error, isSubmitting: isLoading, submit };
}
