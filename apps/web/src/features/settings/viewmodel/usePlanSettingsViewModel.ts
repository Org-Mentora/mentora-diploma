import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import {
  useCancelSubscriptionMutation,
  useChoosePlanMutation,
  useGetSubscriptionQuery,
  useSetAutoDebitMutation,
} from '@/model/api/generated/mentoraApi';
import {
  type PlanOption,
  SubscriptionAdapter,
  type SubscriptionOverview,
} from '@/model/domain/subscriptions/SubscriptionAdapter';
import {
  type PaymentHistoryViewModel,
  usePaymentHistoryViewModel,
} from './usePaymentHistoryViewModel';
import {
  type PaymentMethodsViewModel,
  usePaymentMethodsViewModel,
} from './usePaymentMethodsViewModel';

export type { PaymentHistoryViewModel, PaymentMethodsViewModel, PlanOption, SubscriptionOverview };

export interface PendingPlan {
  option: PlanOption;
  chargesNow: boolean;
}

export interface PlanSettingsViewModel {
  isLoading: boolean;
  error: UiError | null;
  overview: SubscriptionOverview | null;
  plans: PlanOption[];
  pendingPlan: PendingPlan | null;
  requestPlan: (option: PlanOption) => void;
  abortPlan: () => void;
  confirmPlan: () => Promise<void>;
  pendingAutoDebit: boolean | null;
  requestAutoDebit: (enabled: boolean) => void;
  abortAutoDebit: () => void;
  confirmAutoDebit: () => Promise<void>;
  isCancelling: boolean;
  requestCancel: () => void;
  abortCancel: () => void;
  confirmCancel: () => Promise<void>;
  isSaving: boolean;
  cards: PaymentMethodsViewModel;
  payments: PaymentHistoryViewModel;
}

// ViewModel
export function usePlanSettingsViewModel(): PlanSettingsViewModel {
  const { data, isLoading, error } = useGetSubscriptionQuery();
  const [choosePlan, choosing] = useChoosePlanMutation();
  const [setAutoDebit, settingDebit] = useSetAutoDebitMutation();
  const [cancel, cancelling] = useCancelSubscriptionMutation();
  const [pendingPlan, setPendingPlan] = useState<PendingPlan | null>(null);
  const [pendingAutoDebit, setPendingAutoDebit] = useState<boolean | null>(null);
  const [isCancelling, setCancelling] = useState(false);

  const overview = useMemo(() => (data ? SubscriptionAdapter.toOverview(data) : null), [data]);
  const plans = useMemo(() => (data ? SubscriptionAdapter.toPlanOptions(data) : []), [data]);
  const methods = useMemo(() => (data ? SubscriptionAdapter.toPaymentMethods(data) : []), [data]);
  const cards = usePaymentMethodsViewModel(methods);
  const payments = usePaymentHistoryViewModel(overview?.planPrice ?? null);

  return {
    isLoading,
    error: ApiErrorAdapter.toUiError(error),
    overview,
    plans,
    pendingPlan,
    requestPlan: (option) => setPendingPlan({ option, chargesNow: !overview?.hasAccess }),
    abortPlan: () => setPendingPlan(null),
    confirmPlan: async () => {
      if (!pendingPlan) {
        return;
      }
      try {
        await choosePlan({ choosePlanRequestDto: { planId: pendingPlan.option.id } }).unwrap();
        toast.success(
          pendingPlan.chargesNow
            ? `Payment approved. The ${pendingPlan.option.name} plan is active.`
            : `The ${pendingPlan.option.name} plan applies from your next renewal.`,
        );
      } catch (caught) {
        const uiError = ApiErrorAdapter.toUiError(caught);
        if (uiError?.code === 'PAYMENT_METHOD_REQUIRED') {
          cards.openAdd('Add a card to activate the plan, then choose it again.');
        } else {
          toast.error(uiError?.message ?? 'The plan could not be changed');
        }
      } finally {
        setPendingPlan(null);
      }
    },
    pendingAutoDebit,
    requestAutoDebit: (enabled) => {
      if (enabled && !overview?.hasPaymentMethod) {
        cards.openAdd('Add a card to turn on automatic debit.');
        return;
      }
      setPendingAutoDebit(enabled);
    },
    abortAutoDebit: () => setPendingAutoDebit(null),
    confirmAutoDebit: async () => {
      if (pendingAutoDebit === null) {
        return;
      }
      try {
        await setAutoDebit({ autoDebitRequestDto: { enabled: pendingAutoDebit } }).unwrap();
        toast.success(`Automatic debit ${pendingAutoDebit ? 'enabled' : 'disabled'}`);
      } catch (caught) {
        toast.error(ApiErrorAdapter.toUiError(caught)?.message ?? 'Could not change the debit');
      } finally {
        setPendingAutoDebit(null);
      }
    },
    isCancelling,
    requestCancel: () => setCancelling(true),
    abortCancel: () => setCancelling(false),
    confirmCancel: async () => {
      try {
        await cancel().unwrap();
        toast.success('Your subscription was cancelled. It will not renew.');
      } catch (caught) {
        toast.error(ApiErrorAdapter.toUiError(caught)?.message ?? 'Could not cancel');
      } finally {
        setCancelling(false);
      }
    },
    isSaving: choosing.isLoading || settingDebit.isLoading || cancelling.isLoading,
    cards,
    payments,
  };
}
