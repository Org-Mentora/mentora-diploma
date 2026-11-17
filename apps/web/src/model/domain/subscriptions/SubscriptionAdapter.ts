import type { PaymentDto, PlanDto, SubscriptionDetailDto } from '@mentora/contracts';

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

const STATUS: Record<SubscriptionDetailDto['status'], { label: string; tone: Tone }> = {
  trial: { label: 'Free trial', tone: 'success' },
  active: { label: 'Active', tone: 'success' },
  pending_payment: { label: 'Pending payment', tone: 'danger' },
  suspended: { label: 'Suspended', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'warning' },
  expired: { label: 'Expired', tone: 'danger' },
};

const KIND: Record<PaymentDto['kind'], string> = {
  automatic: 'Automatic debit',
  plan_change: 'Plan change',
  manual: 'Manual payment',
};

const PAYMENT_STATUS: Record<PaymentDto['status'], { label: string; tone: Tone }> = {
  approved: { label: 'Approved', tone: 'success' },
  declined: { label: 'Declined', tone: 'danger' },
  failed: { label: 'Failed', tone: 'warning' },
};

const PLAN_NAME: Record<PlanDto['id'], string> = { monthly: 'Monthly', annual: 'Annual' };

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

// Adapter
export class SubscriptionAdapter {
  static money(amount: number, currency = 'ARS'): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  static date(iso: string): string {
    return dateFormat.format(new Date(iso));
  }

  static toOverview(dto: SubscriptionDetailDto): SubscriptionOverview {
    return {
      statusLabel: STATUS[dto.status].label,
      statusTone: STATUS[dto.status].tone,
      hasAccess: dto.hasAccess,
      planName: dto.plan ? `${dto.plan.name} plan` : 'No plan chosen yet',
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
      name: plan.name,
      description: plan.description,
      priceLabel: `${SubscriptionAdapter.money(plan.price, plan.currency)} / ${
        plan.months === 1 ? 'month' : `${plan.months} months`
      }`,
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
      planName: PLAN_NAME[dto.planId],
      kindLabel: KIND[dto.kind],
      methodLabel: dto.methodLabel,
      statusLabel: PAYMENT_STATUS[dto.status].label,
      statusTone: PAYMENT_STATUS[dto.status].tone,
      detail: dto.failureReason ?? dto.reference ?? '',
    };
  }

  private static period(dto: SubscriptionDetailDto): string {
    const date = SubscriptionAdapter.date(dto.currentPeriodEndsAt);
    if (!dto.hasAccess) {
      return `Access ended on ${date}`;
    }
    switch (dto.status) {
      case 'trial':
        return `Trial ends on ${date} (${dto.daysLeft} days left)`;
      case 'cancelled':
        return `Access until ${date}; it will not renew`;
      default:
        return dto.autoDebit ? `Renews automatically on ${date}` : `Paid until ${date}`;
    }
  }
}
