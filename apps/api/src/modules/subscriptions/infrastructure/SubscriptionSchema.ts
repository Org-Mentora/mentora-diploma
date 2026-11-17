import mongoose, { Schema } from 'mongoose';
import type { MongoDocument } from '#infrastructure/database/MongooseRepository';

export interface PaymentMethodDocument {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'other';
  last4: string;
  expMonth: number;
  expYear: number;
  holderName: string;
  gatewayToken: string;
  addedAt: Date;
}

export interface SubscriptionDocument extends MongoDocument {
  contact: { email: string; name: string };
  phase: 'trial' | 'active' | 'pending_payment' | 'suspended' | 'expired';
  planId: 'monthly' | 'annual' | null;
  periodEndsAt: Date;
  autoDebit: boolean;
  paymentMethods: PaymentMethodDocument[];
  defaultPaymentMethodId: string | null;
  failedChargeAttempts: number;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const paymentMethodSchema = new Schema<PaymentMethodDocument>(
  {
    id: { type: String, required: true },
    brand: { type: String, enum: ['visa', 'mastercard', 'amex', 'other'], required: true },
    last4: { type: String, required: true },
    expMonth: { type: Number, required: true },
    expYear: { type: Number, required: true },
    holderName: { type: String, required: true },
    gatewayToken: { type: String, required: true },
    addedAt: { type: Date, required: true },
  },
  { _id: false },
);

const schema = new Schema<SubscriptionDocument>(
  {
    _id: { type: String, required: true },
    contact: {
      email: { type: String, required: true },
      name: { type: String, required: true },
    },
    phase: {
      type: String,
      enum: ['trial', 'active', 'pending_payment', 'suspended', 'expired'],
      required: true,
    },
    planId: { type: String, enum: ['monthly', 'annual', null], default: null },
    periodEndsAt: { type: Date, required: true },
    autoDebit: { type: Boolean, required: true },
    paymentMethods: { type: [paymentMethodSchema], default: [] },
    defaultPaymentMethodId: { type: String, default: null },
    failedChargeAttempts: { type: Number, default: 0 },
    cancelledAt: { type: Date, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);

schema.index({ phase: 1, cancelledAt: 1, periodEndsAt: 1 });

export const SubscriptionModel = mongoose.model<SubscriptionDocument>(
  'Subscription',
  schema,
  'subscriptions',
);
