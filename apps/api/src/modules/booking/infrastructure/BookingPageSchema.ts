import mongoose, { Schema } from 'mongoose';
import type { MongoDocument } from '#infrastructure/database/MongooseRepository';

export interface BookingPageDocument extends MongoDocument {
  slug: string;
  enabled: boolean;
  slotMinutes: number;
  minNoticeHours: number;
  horizonDays: number;
  modalities: ('in_person' | 'virtual')[];
  weeklyHours: { weekday: number; start: string; end: string }[];
  instructions: string | null;
  updatedAt: Date;
}

const schema = new Schema<BookingPageDocument>(
  {
    _id: { type: String, required: true },
    slug: { type: String, required: true },
    enabled: { type: Boolean, required: true },
    slotMinutes: { type: Number, required: true },
    minNoticeHours: { type: Number, required: true },
    horizonDays: { type: Number, required: true },
    modalities: { type: [String], required: true },
    weeklyHours: {
      type: [{ _id: false, weekday: Number, start: String, end: String }],
      default: [],
    },
    instructions: { type: String, default: null },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);

schema.index({ slug: 1 }, { unique: true });

export const BookingPageModel = mongoose.model<BookingPageDocument>(
  'BookingPage',
  schema,
  'booking_pages',
);
