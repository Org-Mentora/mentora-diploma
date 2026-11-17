import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
        toast.success('Your data was updated');
      } catch (caught) {
        const error = ApiErrorAdapter.toUiError(caught);
        const field = error?.field as keyof ProfileFormValues | undefined;
        form.setError(field && FIELDS.has(field) ? field : 'root', {
          message: error?.message ?? 'Your data could not be saved',
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
        toast.success('Logo updated');
      } catch (caught) {
        setLogoError(ApiErrorAdapter.toUiError(caught)?.message ?? 'The logo could not be saved');
      }
    },
    removeLogo: async () => {
      setLogoError(null);
      try {
        await remove().unwrap();
        toast.success('Logo removed. Prescriptions will use the default logo.');
      } catch (caught) {
        setLogoError(ApiErrorAdapter.toUiError(caught)?.message ?? 'The logo could not be removed');
      }
    },
  };
}
