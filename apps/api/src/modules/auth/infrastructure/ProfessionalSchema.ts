import mongoose, { Schema } from 'mongoose';
import type { MongoDocument } from '#infrastructure/database/MongooseRepository';

export interface ProfessionalDocument extends MongoDocument {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
  offices?: string[];
  passwordHash: string;
  passwordChangedAt?: Date | null;
  logoUpdatedAt?: Date | null;
  registeredAt: Date;
  updatedAt?: Date;
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
    offices: { type: [String], default: [] },
    passwordHash: { type: String, required: true },
    passwordChangedAt: { type: Date, default: null },
    logoUpdatedAt: { type: Date, default: null },
    registeredAt: { type: Date, required: true },
    updatedAt: { type: Date },
  },
  { versionKey: false },
);

export const ProfessionalModel = mongoose.model<ProfessionalDocument>(
  'Professional',
  schema,
  'professionals',
);
