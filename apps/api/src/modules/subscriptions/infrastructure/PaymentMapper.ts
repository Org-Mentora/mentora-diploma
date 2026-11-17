import type { DataMapper } from '#core/model/DataMapper';
import { Payment } from '../model/Payment';
import type { PaymentDocument } from './PaymentSchema';

// Data Mapper
export class PaymentMapper implements DataMapper<Payment, PaymentDocument> {
  toDomain(record: PaymentDocument): Payment {
    return Payment.restore(record._id, {
      professionalId: record.professionalId,
      planId: record.planId,
      amount: record.amount,
      currency: record.currency,
      kind: record.kind,
      status: record.status,
      methodLabel: record.methodLabel,
      reference: record.reference,
      chargeKey: record.chargeKey ?? null,
      failureReason: record.failureReason,
      paidAt: record.paidAt,
      createdAt: record.createdAt,
    });
  }

  toPersistence(payment: Payment): PaymentDocument {
    return {
      _id: payment.id,
      professionalId: payment.professionalId,
      planId: payment.planId,
      amount: payment.amount,
      currency: payment.currency,
      kind: payment.kind,
      status: payment.status,
      methodLabel: payment.methodLabel,
      reference: payment.reference,
      chargeKey: payment.chargeKey,
      failureReason: payment.failureReason,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    };
  }
}
