import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import { FormErrors } from '@/model/api/FormErrors';
import {
  useGetConsultationFeesQuery,
  useUpdateConsultationFeesMutation,
} from '@/model/api/generated/mentoraApi';
import { APPOINTMENT_TYPES, typeLabel } from '@/model/domain/appointments/AgendaAdapter';
import {
  FeesForm,
  type FeesFormValues,
  type FeeType,
  feesFormSchema,
} from '@/model/domain/reports/fees.form';
import { useUserFeedback } from '@/model/platform/Platform';
import { useTranslation } from '@/shared/i18n';

export type { FeesFormValues };

export interface FeesViewModel {
  isLoading: boolean;
  error: UiError | null;
  currency: string;
  rows: { name: FeeType; label: string }[];
  form: UseFormReturn<FeesFormValues>;
  isSaving: boolean;
  save: () => Promise<void>;
  discard: () => void;
}

const EMPTY: FeesFormValues = {
  first_visit: '',
  control: '',
  follow_up: '',
  medication: '',
  other: '',
};

// ViewModel
export function useFeesViewModel(): FeesViewModel {
  const { t } = useTranslation();
  const feedback = useUserFeedback();
  const { data, isLoading, error } = useGetConsultationFeesQuery();
  const [update, { isLoading: isSaving }] = useUpdateConsultationFeesMutation();
  const form = useForm<FeesFormValues>({
    resolver: zodResolver(feesFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (data) {
      form.reset(FeesForm.fromDto(data));
    }
  }, [data, form]);

  return {
    isLoading,
    error: ApiErrorAdapter.toUiError(error),
    currency: data?.currency ?? 'ARS',
    rows: APPOINTMENT_TYPES.map((name) => ({ name, label: typeLabel(name) })),
    form,
    isSaving,
    save: form.handleSubmit(async (values) => {
      try {
        const saved = await update({
          updateConsultationFeesRequestDto: FeesForm.toRequest(values),
        }).unwrap();
        form.reset(FeesForm.fromDto(saved));
        feedback.success(t('fees.saved'));
      } catch (caught) {
        FormErrors.apply(form, caught, { fallback: t('fees.failed') });
      }
    }),
    discard: () => form.reset(data ? FeesForm.fromDto(data) : EMPTY),
  };
}
