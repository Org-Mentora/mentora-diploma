import mongoose, { Schema } from 'mongoose';
import type { MongoDocument } from '#infrastructure/database/MongooseRepository';

export interface PatientDocument extends MongoDocument {
  professionalId: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: Date | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  healthInsurance: string | null;
  memberNumber: string | null;
  familyContact: { name: string; phone: string } | null;
  debt: number;
  allergies: string[];
  observations: string | null;
  status: 'active' | 'discharged' | 'inactive';
  statusChangedAt: Date;
  statusOrigin: 'manual' | 'automatic';
  registeredAt: Date;
  updatedAt: Date;
  /** Denormalized, accent-free "first last dni" used by CU-05. */
  searchText: string;
}

const nullableString = { type: String, default: null };

const schema = new Schema<PatientDocument>(
  {
    _id: { type: String, required: true },
    professionalId: { type: String, required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dni: { type: String, required: true },
    birthDate: { type: Date, default: null },
    gender: nullableString,
    phone: nullableString,
    email: nullableString,
    address: nullableString,
    healthInsurance: nullableString,
    memberNumber: nullableString,
    familyContact: {
      type: new Schema({ name: String, phone: String }, { _id: false }),
      default: null,
    },
    debt: { type: Number, default: 0 },
    allergies: { type: [String], default: [] },
    observations: nullableString,
    status: { type: String, enum: ['active', 'discharged', 'inactive'], required: true },
    statusChangedAt: { type: Date, required: true },
    statusOrigin: { type: String, enum: ['manual', 'automatic'], required: true },
    registeredAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    searchText: { type: String, required: true },
  },
  { versionKey: false },
);

// DNI is unique per professional, not globally (ADR-0019).
schema.index({ professionalId: 1, dni: 1 }, { unique: true });

export const PatientModel = mongoose.model<PatientDocument>('Patient', schema, 'patients');
