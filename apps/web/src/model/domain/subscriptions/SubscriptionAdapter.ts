import type { PaymentDto, PlanDto, SubscriptionDetailDto } from '@mentora/contracts';
import { translate as t } from '@/shared/i18n';
import { Formats } from '../format/Formats';

export type Tone = 'success' | 'warning' | 'danger' | 'secondary';

export interface SubscriptionOverview {
  statusLabel: string;
  statusTone: Tone;
  hasAccess: boolean;
  planName: string;
  periodLabel: string;
  autoDebit: boolean;
  isCancelled: boolean;
  needsAction: boolean;
  hasPaymentMethod: boolean;
  planPrice: number | null;
}

export interface PlanOption {
  id: PlanDto['id'];
  name: string;
  description: string;
  priceLabel: string;
  isCurrent: boolean;
}

export interface PaymentMethodItem {
  id: string;
  label: string;
  holderName: string;
  expiry: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface PaymentItem {
  id: string;
  date: string;
  amount: string;
  planName: string;
  kindLabel: string;
  methodLabel: string;
  statusLabel: string;
  statusTone: Tone;
  detail: string;
}

const STATUS_TONE: Record<SubscriptionDetailDto['status'], Tone> = {
  trial: 'success',
  active: 'success',
  pending_payment: 'danger',
  suspended: 'danger',
  cancelled: 'warning',
  expired: 'danger',
};

const PAYMENT_TONE: Record<PaymentDto['status'], Tone> = {
  approved: 'success',
  declined: 'danger',
  failed: 'warning',
};

// Adapter
export class SubscriptionAdapter {
  static money(amount: number, currency = 'ARS'): string {
    return Formats.money(amount, currency);
  }

  static date(iso: string): string {
    return Formats.date(iso);
  }

  static toOverview(dto: SubscriptionDetailDto): SubscriptionOverview {
    return {
      statusLabel: t(`subscription.status.${dto.status}`),
      statusTone: STATUS_TONE[dto.status],
      hasAccess: dto.hasAccess,
      planName: dto.plan
        ? t('subscription.planName', { name: SubscriptionAdapter.planName(dto.plan.id) })
        : t('subscription.noPlan'),
      periodLabel: SubscriptionAdapter.period(dto),
      autoDebit: dto.autoDebit,
      isCancelled: dto.status === 'cancelled',
      needsAction: !dto.hasAccess,
      hasPaymentMethod: dto.paymentMethods.length > 0,
      planPrice: dto.plan?.price ?? null,
    };
  }

  static toPlanOptions(dto: SubscriptionDetailDto): PlanOption[] {
    return dto.availablePlans.map((plan) => ({
      id: plan.id,
      name: SubscriptionAdapter.planName(plan.id),
      description: t(`subscription.planDescription.${plan.id}`, { defaultValue: plan.description }),
      priceLabel: `${SubscriptionAdapter.money(plan.price, plan.currency)} / ${t(
        'subscription.months',
        { count: plan.months },
      )}`,
      isCurrent: dto.plan?.id === plan.id,
    }));
  }

  static toPaymentMethods(dto: SubscriptionDetailDto): PaymentMethodItem[] {
    return dto.paymentMethods.map((method) => ({
      id: method.id,
      label: method.label,
      holderName: method.holderName,
      expiry: `${String(method.expMonth).padStart(2, '0')}/${String(method.expYear).slice(-2)}`,
      expMonth: method.expMonth,
      expYear: method.expYear,
      isDefault: method.isDefault,
    }));
  }

  static toPayment(dto: PaymentDto): PaymentItem {
    return {
      id: dto.id,
      date: SubscriptionAdapter.date(dto.paidAt),
      amount: SubscriptionAdapter.money(dto.amount, dto.currency),
      planName: SubscriptionAdapter.planName(dto.planId),
      kindLabel: t(`subscription.paymentKind.${dto.kind}`),
      methodLabel: dto.methodLabel,
      statusLabel: t(`subscription.paymentStatus.${dto.status}`),
      statusTone: PAYMENT_TONE[dto.status],
      detail: dto.failureReason ?? dto.reference ?? '',
    };
  }

  private static planName(id: PlanDto['id']): string {
    return t(`subscription.plan.${id}`);
  }

  private static period(dto: SubscriptionDetailDto): string {
    const date = SubscriptionAdapter.date(dto.currentPeriodEndsAt);
    if (!dto.hasAccess) {
      return t('subscription.period.ended', { date });
    }
    switch (dto.status) {
      case 'trial':
        return t('subscription.period.trial', { date, count: dto.daysLeft });
      case 'cancelled':
        return t('subscription.period.cancelled', { date });
      default:
        return dto.autoDebit
          ? t('subscription.period.renews', { date })
          : t('subscription.period.paidUntil', { date });
    }
  }
}
