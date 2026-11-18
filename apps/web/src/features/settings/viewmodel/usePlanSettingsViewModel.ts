import { useMemo, useState } from 'react';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import {
  useCancelSubscriptionMutation,
  useChoosePlanMutation,
  useGetSubscriptionQuery,
  useSetAutoDebitMutation,
} from '@/model/api/generated/mentoraApi';
import { useAction } from '@/model/api/useAction';
import {
  type PlanOption,
  SubscriptionAdapter,
  type SubscriptionOverview,
} from '@/model/domain/subscriptions/SubscriptionAdapter';
import { useUserFeedback } from '@/model/platform/Platform';
import { useTranslation } from '@/shared/i18n';
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
  const { t } = useTranslation();
  const feedback = useUserFeedback();
  const run = useAction();
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
        feedback.success(
          pendingPlan.chargesNow
            ? t('settings.plan.approved', { plan: pendingPlan.option.name })
            : t('settings.plan.appliesNext', { plan: pendingPlan.option.name }),
        );
      } catch (caught) {
        const uiError = ApiErrorAdapter.toUiError(caught);
        if (uiError?.code === 'PAYMENT_METHOD_REQUIRED') {
          cards.openAdd(t('settings.plan.addCardForPlan'));
        } else {
          feedback.error(ApiErrorAdapter.messageOf(caught, t('settings.plan.changeFailed')));
        }
      } finally {
        setPendingPlan(null);
      }
    },
    pendingAutoDebit,
    requestAutoDebit: (enabled) => {
      if (enabled && !overview?.hasPaymentMethod) {
        cards.openAdd(t('settings.plan.addCardForDebit'));
        return;
      }
      setPendingAutoDebit(enabled);
    },
    abortAutoDebit: () => setPendingAutoDebit(null),
    confirmAutoDebit: async () => {
      if (pendingAutoDebit === null) {
        return;
      }
      await run(
        () => setAutoDebit({ autoDebitRequestDto: { enabled: pendingAutoDebit } }).unwrap(),
        {
          success: pendingAutoDebit
            ? t('settings.plan.debitEnabled')
            : t('settings.plan.debitDisabled'),
          failure: t('settings.plan.debitFailed'),
        },
      );
      setPendingAutoDebit(null);
    },
    isCancelling,
    requestCancel: () => setCancelling(true),
    abortCancel: () => setCancelling(false),
    confirmCancel: async () => {
      await run(() => cancel().unwrap(), {
        success: t('settings.plan.cancelled'),
        failure: t('settings.plan.cancelFailed'),
      });
      setCancelling(false);
    },
    isSaving: choosing.isLoading || settingDebit.isLoading || cancelling.isLoading,
    cards,
    payments,
  };
}
