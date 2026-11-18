import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { FormErrors } from '@/model/api/FormErrors';
import {
  useListPaymentsQuery,
  useRegisterManualPaymentMutation,
} from '@/model/api/generated/mentoraApi';
import { type UiPagedList, usePagedList } from '@/model/api/usePagedList';
import {
  type PaymentItem,
  SubscriptionAdapter,
} from '@/model/domain/subscriptions/SubscriptionAdapter';
import {
  MANUAL_METHOD_LABEL,
  type ManualPaymentFormValues,
  manualPaymentFormSchema,
  SubscriptionForms,
} from '@/model/domain/subscriptions/subscription.forms';
import { useUserFeedback } from '@/model/platform/Platform';
import { useTranslation } from '@/shared/i18n';

export type { ManualPaymentFormValues, PaymentItem };

export interface PaymentHistoryViewModel
  extends Pick<
    UiPagedList<PaymentItem>,
    'items' | 'isLoading' | 'hasMore' | 'isLoadingMore' | 'loadMore'
  > {
  isManualOpen: boolean;
  manualForm: UseFormReturn<ManualPaymentFormValues>;
  methodOptions: { value: string; label: string }[];
  isSaving: boolean;
  openManual: () => void;
  closeManual: () => void;
  submitManual: () => Promise<void>;
}

function today(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

// ViewModel
export function usePaymentHistoryViewModel(planPrice: number | null): PaymentHistoryViewModel {
  const { t } = useTranslation();
  const feedback = useUserFeedback();
  const list = usePagedList(useListPaymentsQuery, {}, (dtos) =>
    dtos.map(SubscriptionAdapter.toPayment),
  );
  const [register, registering] = useRegisterManualPaymentMutation();
  const [isManualOpen, setManualOpen] = useState(false);
  const manualForm = useForm<ManualPaymentFormValues>({
    resolver: zodResolver(manualPaymentFormSchema),
    defaultValues: SubscriptionForms.manualDefaults(planPrice, today()),
  });

  return {
    items: list.items,
    isLoading: list.isLoading,
    hasMore: list.hasMore,
    isLoadingMore: list.isLoadingMore,
    loadMore: list.loadMore,
    isManualOpen,
    manualForm,
    methodOptions: Object.entries(MANUAL_METHOD_LABEL).map(([value, label]) => ({
      value,
      label: t(label),
    })),
    isSaving: registering.isLoading,
    openManual: () => {
      manualForm.reset(SubscriptionForms.manualDefaults(planPrice, today()));
      setManualOpen(true);
    },
    closeManual: () => setManualOpen(false),
    submitManual: manualForm.handleSubmit(async (values) => {
      try {
        await register({
          manualPaymentRequestDto: SubscriptionForms.toManualPayment(values),
        }).unwrap();
        feedback.success(t('settings.payments.registered'));
        list.refresh();
        setManualOpen(false);
      } catch (caught) {
        FormErrors.apply(manualForm, caught, {
          fields: ['amount', 'paidAt'],
          fallback: t('settings.payments.failed'),
        });
      }
    }),
  };
}
