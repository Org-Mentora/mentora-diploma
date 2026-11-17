import { Entity } from '#core/model/Entity';
import type { PlanId } from './Plan';

export type PaymentKind = 'automatic' | 'plan_change' | 'manual';
export type PaymentStatus = 'approved' | 'declined' | 'failed';
export type ManualPaymentMethod = 'bank_transfer' | 'cash' | 'card' | 'other';

export interface PaymentProps {
  professionalId: string;
  planId: PlanId;
  amount: number;
  currency: string;
  kind: PaymentKind;
  status: PaymentStatus;
  methodLabel: string;
  reference: string | null;
  chargeKey: string | null;
  failureReason: string | null;
  paidAt: Date;
  createdAt: Date;
}

const MANUAL_LABEL: Record<ManualPaymentMethod, string> = {
  bank_transfer: 'Bank transfer',
  cash: 'Cash',
  card: 'Card (manual)',
  other: 'Other',
};

// Aggregate Root
export class Payment extends Entity<PaymentProps> {
  static charged(data: Omit<PaymentProps, 'createdAt' | 'paidAt'>, now: Date): Payment {
    return new Payment(crypto.randomUUID(), { ...data, paidAt: now, createdAt: now });
  }

  static manual(
    data: {
      professionalId: string;
      planId: PlanId;
      amount: number;
      currency: string;
      method: ManualPaymentMethod;
      reference: string | null;
      paidAt: Date;
    },
    now: Date,
  ): Payment {
    return new Payment(crypto.randomUUID(), {
      professionalId: data.professionalId,
      planId: data.planId,
      amount: data.amount,
      currency: data.currency,
      kind: 'manual',
      status: 'approved',
      methodLabel: MANUAL_LABEL[data.method],
      reference: data.reference?.trim() || null,
      chargeKey: null,
      failureReason: null,
      paidAt: data.paidAt,
      createdAt: now,
    });
  }

  static restore(id: string, props: PaymentProps): Payment {
    return new Payment(id, props);
  }

  get professionalId(): string {
    return this.props.professionalId;
  }

  get planId(): PlanId {
    return this.props.planId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  get kind(): PaymentKind {
    return this.props.kind;
  }

  get status(): PaymentStatus {
    return this.props.status;
  }

  get methodLabel(): string {
    return this.props.methodLabel;
  }

  get reference(): string | null {
    return this.props.reference;
  }

  get chargeKey(): string | null {
    return this.props.chargeKey;
  }

  get failureReason(): string | null {
    return this.props.failureReason;
  }

  get paidAt(): Date {
    return this.props.paidAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
