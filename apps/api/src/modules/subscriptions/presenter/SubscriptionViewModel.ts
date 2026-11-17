import type {
  PaymentDto,
  PlanDto,
  SubscriptionDetailDto,
} from '../contracts/subscriptions.contracts';
import type { Payment } from '../model/Payment';
import type { Plan } from '../model/Plan';
import type { Subscription } from '../model/Subscription';
import type { SubscriptionService } from '../model/SubscriptionService';

export class SubscriptionViewModel {
  static toDto(subscription: Subscription, service: SubscriptionService): SubscriptionDetailDto {
    const now = service.now;
    const plan = service.planOf(subscription);
    return {
      status: subscription.statusAt(now),
      hasAccess: subscription.hasAccessAt(now),
      plan: plan ? SubscriptionViewModel.plan(plan) : null,
      currentPeriodEndsAt: subscription.periodEndsAt.toISOString(),
      daysLeft: subscription.daysLeftAt(now),
      autoDebit: subscription.renewsAutomatically,
      paymentMethods: subscription.paymentMethods.map((method) => ({
        id: method.id,
        brand: method.brand,
        label: method.label,
        last4: method.last4,
        expMonth: method.expMonth,
        expYear: method.expYear,
        holderName: method.holderName,
        isDefault: method.id === subscription.defaultPaymentMethodId,
      })),
      cancelledAt: subscription.cancelledAt?.toISOString() ?? null,
      availablePlans: service.plans.map(SubscriptionViewModel.plan),
    };
  }

  static plan(plan: Plan): PlanDto {
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      months: plan.months,
      price: plan.price,
      currency: plan.currency,
    };
  }

  static payment(payment: Payment): PaymentDto {
    return {
      id: payment.id,
      planId: payment.planId,
      amount: payment.amount,
      currency: payment.currency,
      kind: payment.kind,
      status: payment.status,
      methodLabel: payment.methodLabel,
      reference: payment.reference,
      failureReason: payment.failureReason,
      paidAt: payment.paidAt.toISOString(),
    };
  }
}
