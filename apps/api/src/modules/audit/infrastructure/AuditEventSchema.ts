import mongoose, { Schema } from 'mongoose';
import type { AuditActor, AuditDetailValue } from '#core/model/AuditTrail';
import type { MongoDocument } from '#infrastructure/database/MongooseRepository';

export interface AuditEventDocument extends MongoDocument {
  professionalId: string;
  actor: AuditActor;
  action: string;
  category: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, AuditDetailValue>;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  occurredAt: Date;
}

const schema = new Schema<AuditEventDocument>(
  {
    _id: { type: String, required: true },
    professionalId: { type: String, required: true },
    actor: { type: String, enum: ['professional', 'patient', 'system'], required: true },
    action: { type: String, required: true },
    category: { type: String, required: true },
    targetType: { type: String, default: null },
    targetId: { type: String, default: null },
    details: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    requestId: { type: String, default: null },
    occurredAt: { type: Date, required: true },
  },
  { versionKey: false, minimize: false },
);

schema.index({ professionalId: 1, occurredAt: -1 });
schema.index({ professionalId: 1, category: 1, occurredAt: -1 });

export const AuditEventModel = mongoose.model<AuditEventDocument>(
  'AuditEvent',
  schema,
  'audit_events',
);
