import { zodResolver } from '@hookform/resolvers/zod';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { FormErrors } from '@/model/api/FormErrors';
import { useChangePasswordMutation } from '@/model/api/generated/mentoraApi';
import {
  AuthForms,
  type ChangePasswordFormValues,
  changePasswordDefaults,
  changePasswordFormSchema,
  PASSWORD_HINT,
} from '@/model/domain/session/auth.forms';
import { useUserFeedback } from '@/model/platform/Platform';
import { useTranslation } from '@/shared/i18n';

export type { ChangePasswordFormValues };

export interface ChangePasswordViewModel {
  form: UseFormReturn<ChangePasswordFormValues>;
  passwordHint: string;
  isSaving: boolean;
  save: () => Promise<void>;
  discard: () => void;
}

// ViewModel
export function useChangePasswordViewModel(): ChangePasswordViewModel {
  const { t } = useTranslation();
  const feedback = useUserFeedback();
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: changePasswordDefaults,
  });
  const [change, { isLoading }] = useChangePasswordMutation();

  return {
    form,
    passwordHint: PASSWORD_HINT,
    isSaving: isLoading,
    save: form.handleSubmit(async (values) => {
      try {
        await change({
          changePasswordRequestDto: AuthForms.toChangePasswordRequest(values),
        }).unwrap();
        feedback.success(t('settings.password.changed'));
        form.reset(changePasswordDefaults);
      } catch (caught) {
        FormErrors.apply(form, caught, {
          fields: ['currentPassword', 'newPassword'],
          fallback: t('settings.password.failed'),
        });
      }
    }),
    discard: () => form.reset(changePasswordDefaults),
  };
}
