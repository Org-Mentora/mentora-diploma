import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ApiErrorAdapter } from '@/model/api/ApiErrorAdapter';
import {
  useListPaymentsQuery,
  useRegisterManualPaymentMutation,
} from '@/model/api/generated/mentoraApi';
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

export type { ManualPaymentFormValues, PaymentItem };

export interface PaymentHistoryViewModel {
  items: PaymentItem[];
  isLoading: boolean;
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

const FIELDS = new Set<keyof ManualPaymentFormValues>(['amount', 'paidAt']);

// ViewModel
export function usePaymentHistoryViewModel(planPrice: number | null): PaymentHistoryViewModel {
  const { data, isLoading } = useListPaymentsQuery();
  const [register, registering] = useRegisterManualPaymentMutation();
  const [isManualOpen, setManualOpen] = useState(false);
  const manualForm = useForm<ManualPaymentFormValues>({
    resolver: zodResolver(manualPaymentFormSchema),
    defaultValues: SubscriptionForms.manualDefaults(planPrice, today()),
  });
  const items = useMemo(() => (data ?? []).map(SubscriptionAdapter.toPayment), [data]);

  return {
    items,
    isLoading,
    isManualOpen,
    manualForm,
    methodOptions: Object.entries(MANUAL_METHOD_LABEL).map(([value, label]) => ({ value, label })),
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
        toast.success('Payment registered. Your access was renewed.');
        setManualOpen(false);
      } catch (caught) {
        const error = ApiErrorAdapter.toUiError(caught);
        const field = error?.field as keyof ManualPaymentFormValues | undefined;
        manualForm.setError(field && FIELDS.has(field) ? field : 'root', {
          message: error?.message ?? 'The payment could not be registered',
        });
      }
    }),
  };
}
