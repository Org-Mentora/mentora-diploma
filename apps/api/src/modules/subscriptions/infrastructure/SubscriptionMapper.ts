import type { DataMapper } from '#core/model/DataMapper';
import { PaymentMethod } from '../model/PaymentMethod';
import { Subscription } from '../model/Subscription';
import type { SubscriptionDocument } from './SubscriptionSchema';

// Data Mapper
export class SubscriptionMapper implements DataMapper<Subscription, SubscriptionDocument> {
  toDomain(record: SubscriptionDocument): Subscription {
    return Subscription.restore(record._id, {
      contact: { email: record.contact.email, name: record.contact.name },
      phase: record.phase,
      planId: record.planId,
      periodEndsAt: record.periodEndsAt,
      autoDebit: record.autoDebit,
      paymentMethods: record.paymentMethods.map((m) =>
        PaymentMethod.restore({
          id: m.id,
          brand: m.brand,
          last4: m.last4,
          expMonth: m.expMonth,
          expYear: m.expYear,
          holderName: m.holderName,
          gatewayToken: m.gatewayToken,
          addedAt: m.addedAt,
        }),
      ),
      defaultPaymentMethodId: record.defaultPaymentMethodId,
      failedChargeAttempts: record.failedChargeAttempts,
      cancelledAt: record.cancelledAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  toPersistence(subscription: Subscription): SubscriptionDocument {
    return {
      _id: subscription.id,
      contact: { ...subscription.contact },
      phase: subscription.phase,
      planId: subscription.planId,
      periodEndsAt: subscription.periodEndsAt,
      autoDebit: subscription.autoDebit,
      paymentMethods: subscription.paymentMethods.map((m) => ({
        id: m.id,
        brand: m.brand,
        last4: m.last4,
        expMonth: m.expMonth,
        expYear: m.expYear,
        holderName: m.holderName,
        gatewayToken: m.gatewayToken,
        addedAt: m.addedAt,
      })),
      defaultPaymentMethodId: subscription.defaultPaymentMethodId,
      failedChargeAttempts: subscription.failedChargeAttempts,
      cancelledAt: subscription.cancelledAt,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}
