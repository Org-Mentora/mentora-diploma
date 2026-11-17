import { zodResolver } from '@hookform/resolvers/zod';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { ApiErrorAdapter } from '@/model/api/ApiErrorAdapter';
import { useChangePasswordMutation } from '@/model/api/generated/mentoraApi';
import {
  AuthForms,
  type ChangePasswordFormValues,
  changePasswordDefaults,
  changePasswordFormSchema,
  PASSWORD_HINT,
} from '@/model/domain/session/auth.forms';
import { useUserFeedback } from '@/model/platform/Platform';

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
        feedback.success('Your password was changed');
        form.reset(changePasswordDefaults);
      } catch (caught) {
        const error = ApiErrorAdapter.toUiError(caught);
        const field = error?.field === 'currentPassword' ? 'currentPassword' : 'newPassword';
        form.setError(error?.field ? field : 'root', {
          message: error?.message ?? 'The password could not be changed',
        });
      }
    }),
    discard: () => form.reset(changePasswordDefaults),
  };
}
