import mongoose, { Schema } from 'mongoose';
import type { MongoDocument } from '#infrastructure/database/MongooseRepository';

export interface ConsultationFeesDocument extends MongoDocument {
  currency: string;
  amounts: Record<string, number | null>;
  updatedAt: Date;
}

const schema = new Schema<ConsultationFeesDocument>(
  {
    _id: { type: String, required: true },
    currency: { type: String, required: true },
    amounts: { type: Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false, minimize: false },
);

export const ConsultationFeesModel = mongoose.model<ConsultationFeesDocument>(
  'ConsultationFees',
  schema,
  'consultation_fees',
);
