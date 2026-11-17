import mongoose, { Schema } from 'mongoose';
import type { MongoDocument } from '#infrastructure/database/MongooseRepository';

export interface PaymentDocument extends MongoDocument {
  professionalId: string;
  planId: 'monthly' | 'annual';
  amount: number;
  currency: string;
  kind: 'automatic' | 'plan_change' | 'manual';
  status: 'approved' | 'declined' | 'failed';
  methodLabel: string;
  reference: string | null;
  failureReason: string | null;
  paidAt: Date;
  createdAt: Date;
}

const schema = new Schema<PaymentDocument>(
  {
    _id: { type: String, required: true },
    professionalId: { type: String, required: true },
    planId: { type: String, enum: ['monthly', 'annual'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    kind: { type: String, enum: ['automatic', 'plan_change', 'manual'], required: true },
    status: { type: String, enum: ['approved', 'declined', 'failed'], required: true },
    methodLabel: { type: String, required: true },
    reference: { type: String, default: null },
    failureReason: { type: String, default: null },
    paidAt: { type: Date, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

schema.index({ professionalId: 1, createdAt: -1 });

export const PaymentModel = mongoose.model<PaymentDocument>('Payment', schema, 'payments');
