import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import {
  useRegisterProfessionalMutation,
  useUploadLogoMutation,
} from '@/model/api/generated/mentoraApi';
import {
  AuthForms,
  PASSWORD_HINT,
  type RegisterFormValues,
  registerFormDefaults,
  registerFormSchema,
} from '@/model/domain/session/auth.forms';
import { LogoFile } from '@/model/domain/session/LogoFile';
import { useUserFeedback } from '@/model/platform/Platform';
import { useTranslation } from '@/shared/i18n';
import { readFileAsDataUrl } from '@/shared/lib/readFileAsDataUrl';

export type { RegisterFormValues };

export interface RegisterViewModel {
  form: UseFormReturn<RegisterFormValues>;
  error: UiError | null;
  isSubmitting: boolean;
  passwordHint: string;
  logo: { accept: string; hint: string; preview: string | null; error: string | null };
  selectLogo: (file: File | null) => Promise<void>;
  submit: () => Promise<void>;
}

const FIELDS = new Set<keyof RegisterFormValues>(['email', 'licenseNumber', 'password', 'offices']);

// ViewModel
export function useRegisterViewModel(): RegisterViewModel {
  const { t } = useTranslation();
  const feedback = useUserFeedback();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: registerFormDefaults,
  });
  const [register, { isLoading }] = useRegisterProfessionalMutation();
  const [uploadLogo, uploading] = useUploadLogoMutation();
  const [error, setError] = useState<UiError | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const session = await register({
        registerProfessionalRequestDto: AuthForms.toRegisterRequest(values),
      }).unwrap();
      if (logo) {
        await uploadLogo({ uploadLogoRequestDto: { dataUrl: logo } })
          .unwrap()
          .catch(() => feedback.warning(t('auth.register.logoFailed')));
      }
      feedback.success(t('auth.register.welcome', { count: session.subscription.daysLeft }));
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

  return {
    form,
    error,
    isSubmitting: isLoading || uploading.isLoading,
    passwordHint: PASSWORD_HINT,
    logo: { accept: LogoFile.ACCEPT, hint: LogoFile.HINT, preview: logo, error: logoError },
    selectLogo: async (file) => {
      setLogoError(null);
      if (!file) {
        setLogo(null);
        return;
      }
      const problem = LogoFile.problemWith(file);
      if (problem) {
        setLogo(null);
        setLogoError(problem);
        return;
      }
      setLogo(await readFileAsDataUrl(file));
    },
    submit,
  };
}
