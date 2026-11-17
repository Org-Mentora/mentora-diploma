import mongoose, { Schema } from 'mongoose';
import type { MongoDocument } from '#infrastructure/database/MongooseRepository';

export interface AppointmentDocument extends MongoDocument {
  professionalId: string;
  patientId: string;
  startsAt: Date;
  endsAt: Date;
  durationMinutes: number;
  type: 'first_visit' | 'control' | 'follow_up' | 'medication' | 'other';
  modality: 'in_person' | 'virtual';
  status: 'scheduled' | 'cancelled';
  notes: string | null;
  fee?: number | null;
  source?: 'agenda' | 'online';
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  reminderSentAt?: Date | null;
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
    fee: { type: Number, default: null },
    source: { type: String, enum: ['agenda', 'online'], default: 'agenda' },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    cancelledAt: { type: Date, default: null },
    reminderSentAt: { type: Date, default: null },
  },
  { versionKey: false },
);

schema.index({ professionalId: 1, startsAt: 1 });
schema.index({ status: 1, reminderSentAt: 1, startsAt: 1 });

export const AppointmentModel = mongoose.model<AppointmentDocument>(
  'Appointment',
  schema,
  'appointments',
);
