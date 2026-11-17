import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { ApiErrorAdapter } from '@/model/api/ApiErrorAdapter';
import {
  useGetCurrentProfessionalQuery,
  useGetLogoQuery,
  useRemoveLogoMutation,
  useUpdateProfileMutation,
  useUploadLogoMutation,
} from '@/model/api/generated/mentoraApi';
import {
  AuthForms,
  type ProfileFormValues,
  profileFormSchema,
} from '@/model/domain/session/auth.forms';
import { LogoFile } from '@/model/domain/session/LogoFile';
import { useUserFeedback } from '@/model/platform/Platform';
import { useTranslation } from '@/shared/i18n';
import { readFileAsDataUrl } from '@/shared/lib/readFileAsDataUrl';

export type { ProfileFormValues };

export interface ProfileSettingsViewModel {
  isLoading: boolean;
  form: UseFormReturn<ProfileFormValues>;
  isSaving: boolean;
  save: () => Promise<void>;
  discard: () => void;
  logo: {
    url: string | null;
    accept: string;
    hint: string;
    error: string | null;
    isSaving: boolean;
  };
  uploadLogo: (file: File | null) => Promise<void>;
  removeLogo: () => Promise<void>;
}

const FIELDS = new Set<keyof ProfileFormValues>(['email', 'licenseNumber', 'offices']);

// ViewModel
export function useProfileSettingsViewModel(): ProfileSettingsViewModel {
  const { t } = useTranslation();
  const feedback = useUserFeedback();
  const { data: session, isLoading } = useGetCurrentProfessionalQuery();
  const { data: logo } = useGetLogoQuery();
  const [update, updating] = useUpdateProfileMutation();
  const [upload, uploading] = useUploadLogoMutation();
  const [remove, removing] = useRemoveLogoMutation();
  const [logoError, setLogoError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileFormSchema) });
  const professional = session?.professional;

  useEffect(() => {
    if (professional) {
      form.reset(AuthForms.profileFromDto(professional));
    }
  }, [professional, form]);

  return {
    isLoading,
    form,
    isSaving: updating.isLoading,
    save: form.handleSubmit(async (values) => {
      try {
        await update({ updateProfileRequestDto: AuthForms.toProfileRequest(values) }).unwrap();
        feedback.success(t('settings.profile.updated'));
      } catch (caught) {
        const error = ApiErrorAdapter.toUiError(caught);
        const field = error?.field as keyof ProfileFormValues | undefined;
        form.setError(field && FIELDS.has(field) ? field : 'root', {
          message: error?.message ?? t('settings.profile.failed'),
        });
      }
    }),
    discard: () => professional && form.reset(AuthForms.profileFromDto(professional)),
    logo: {
      url: logo?.dataUrl ?? null,
      accept: LogoFile.ACCEPT,
      hint: LogoFile.HINT,
      error: logoError,
      isSaving: uploading.isLoading || removing.isLoading,
    },
    uploadLogo: async (file) => {
      setLogoError(null);
      if (!file) {
        return;
      }
      const problem = LogoFile.problemWith(file);
      if (problem) {
        setLogoError(problem);
        return;
      }
      try {
        await upload({ uploadLogoRequestDto: { dataUrl: await readFileAsDataUrl(file) } }).unwrap();
        feedback.success(t('settings.profile.logoUpdated'));
      } catch (caught) {
        setLogoError(
          ApiErrorAdapter.toUiError(caught)?.message ?? t('settings.profile.logoFailed'),
        );
      }
    },
    removeLogo: async () => {
      setLogoError(null);
      try {
        await remove().unwrap();
        feedback.success(t('settings.profile.logoRemoved'));
      } catch (caught) {
        setLogoError(
          ApiErrorAdapter.toUiError(caught)?.message ?? t('settings.profile.logoRemoveFailed'),
        );
      }
    },
  };
}
