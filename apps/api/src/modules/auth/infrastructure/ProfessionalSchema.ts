import mongoose, { Schema } from 'mongoose';
import type { MongoDocument } from '#infrastructure/database/MongooseRepository';

export interface ProfessionalDocument extends MongoDocument {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
  passwordHash: string;
  subscription: { plan: 'trial' | 'paid'; endsAt: Date | null };
  registeredAt: Date;
}

const schema = new Schema<ProfessionalDocument>(
  {
    _id: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    specialty: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    subscription: {
      plan: { type: String, enum: ['trial', 'paid'], required: true },
      endsAt: { type: Date, default: null },
    },
    registeredAt: { type: Date, required: true },
  },
  { versionKey: false },
);

export const ProfessionalModel = mongoose.model<ProfessionalDocument>(
  'Professional',
  schema,
  'professionals',
);
