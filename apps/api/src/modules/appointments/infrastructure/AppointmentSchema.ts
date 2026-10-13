import mongoose, { Schema } from 'mongoose';
import type { MongoDocument } from '#infrastructure/database/MongooseRepository';

export interface AppointmentDocument extends MongoDocument {
  professionalId: string;
  patientId: string;
  startsAt: Date;
  /** Denormalized so overlap checks are a single range query. */
  endsAt: Date;
  durationMinutes: number;
  type: 'first_visit' | 'control' | 'follow_up' | 'medication' | 'other';
  modality: 'in_person' | 'virtual';
  status: 'scheduled' | 'cancelled';
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
}

const schema = new Schema<AppointmentDocument>(
  {
    _id: { type: String, required: true },
    professionalId: { type: String, required: true },
    patientId: { type: String, required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    type: {
      type: String,
      enum: ['first_visit', 'control', 'follow_up', 'medication', 'other'],
      required: true,
    },
    modality: { type: String, enum: ['in_person', 'virtual'], required: true },
    status: { type: String, enum: ['scheduled', 'cancelled'], required: true },
    notes: { type: String, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    cancelledAt: { type: Date, default: null },
  },
  { versionKey: false },
);

schema.index({ professionalId: 1, startsAt: 1 });

export const AppointmentModel = mongoose.model<AppointmentDocument>(
  'Appointment',
  schema,
  'appointments',
);
