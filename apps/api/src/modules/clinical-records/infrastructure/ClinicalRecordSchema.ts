import mongoose, { Schema } from 'mongoose';
import type { MongoDocument } from '#infrastructure/database/MongooseRepository';

export interface MedicationDocument {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  indications: string | null;
  prescribedAt: Date;
}

export interface ConsultationDocument {
  _id: string;
  date: Date;
  type: 'in_person' | 'virtual';
  reason: string;
  observations: string | null;
  evolution: string | null;
  diagnosis: { code: string; name: string; assignedAt: Date } | null;
  medications: MedicationDocument[];
  recordedAt: Date;
}

export interface ClinicalRecordDocument extends MongoDocument {
  professionalId: string;
  patientId: string;
  openedAt: Date;
  updatedAt: Date;
  consultations: ConsultationDocument[];
}

const medicationSchema = new Schema<MedicationDocument>(
  {
    name: { type: String, required: true },
    dose: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    indications: { type: String, default: null },
    prescribedAt: { type: Date, required: true },
  },
  { _id: false },
);

const consultationSchema = new Schema<ConsultationDocument>(
  {
    _id: { type: String, required: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ['in_person', 'virtual'], required: true },
    reason: { type: String, required: true },
    observations: { type: String, default: null },
    evolution: { type: String, default: null },
    diagnosis: {
      type: new Schema({ code: String, name: String, assignedAt: Date }, { _id: false }),
      default: null,
    },
    medications: { type: [medicationSchema], default: [] },
    recordedAt: { type: Date, required: true },
  },
  { versionKey: false },
);

const schema = new Schema<ClinicalRecordDocument>(
  {
    _id: { type: String, required: true },
    professionalId: { type: String, required: true },
    patientId: { type: String, required: true },
    openedAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    consultations: { type: [consultationSchema], default: [] },
  },
  { versionKey: false },
);

schema.index({ professionalId: 1, patientId: 1 }, { unique: true });

export const ClinicalRecordModel = mongoose.model<ClinicalRecordDocument>(
  'ClinicalRecord',
  schema,
  'clinical_records',
);
