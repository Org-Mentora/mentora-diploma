import mongoose, { Schema } from 'mongoose';
import type { MongoDocument } from '#infrastructure/database/MongooseRepository';

export interface BookingRequestDocument extends MongoDocument {
  professionalId: string;
  requester: {
    firstName: string;
    lastName: string;
    dni: string;
    birthDate: Date | null;
    phone: string | null;
    email: string | null;
  };
  startsAt: Date;
  endsAt: Date;
  durationMinutes: number;
  modality: 'in_person' | 'virtual';
  reason: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  patientId: string | null;
  appointmentId: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  decidedAt: Date | null;
}

const schema = new Schema<BookingRequestDocument>(
  {
    _id: { type: String, required: true },
    professionalId: { type: String, required: true },
    requester: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      dni: { type: String, required: true },
      birthDate: { type: Date, default: null },
      phone: { type: String, default: null },
      email: { type: String, default: null },
    },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    modality: { type: String, enum: ['in_person', 'virtual'], required: true },
    reason: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      required: true,
    },
    patientId: { type: String, default: null },
    appointmentId: { type: String, default: null },
    rejectionReason: { type: String, default: null },
    createdAt: { type: Date, required: true },
    decidedAt: { type: Date, default: null },
  },
  { versionKey: false },
);

schema.index({ professionalId: 1, status: 1, startsAt: 1 });
schema.index({ professionalId: 1, createdAt: -1 });
schema.index({ status: 1, startsAt: 1 });

export const BookingRequestModel = mongoose.model<BookingRequestDocument>(
  'BookingRequest',
  schema,
  'booking_requests',
);
