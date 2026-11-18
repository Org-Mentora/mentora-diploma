import mongoose, { Schema } from 'mongoose';
import type { DataMapper } from '#core/model/DataMapper';
import type { Page, PageRequest } from '#core/model/Pagination';
import { Keyset } from '#infrastructure/database/Keyset';
import {
  type MongoDocument,
  MongooseRepository,
} from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import {
  Notification,
  type NotificationStatus,
  type NotificationTopic,
} from '../model/Notification';
import type { NotificationRepository } from '../model/NotificationRepository';

const NEWEST_FIRST = Keyset.newestFirst();

interface NotificationDocument extends MongoDocument {
  professionalId: string;
  patientId: string;
  channel: 'whatsapp' | 'email';
  topic: NotificationTopic;
  recipient: string | null;
  body: string;
  status: NotificationStatus;
  attempts: number;
  providerMessageId: string | null;
  error: string | null;
  createdAt: Date;
}

const schema = new Schema<NotificationDocument>(
  {
    _id: { type: String, required: true },
    professionalId: { type: String, required: true },
    patientId: { type: String, required: true },
    channel: { type: String, enum: ['whatsapp', 'email'], required: true },
    topic: {
      type: String,
      enum: [
        'appointment_scheduled',
        'appointment_rescheduled',
        'appointment_cancelled',
        'appointment_reminder',
        'virtual_meeting',
      ],
      required: true,
    },
    recipient: { type: String, default: null },
    body: { type: String, required: true },
    status: { type: String, enum: ['sent', 'failed', 'skipped'], required: true },
    attempts: { type: Number, required: true },
    providerMessageId: { type: String, default: null },
    error: { type: String, default: null },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);
schema.index({ professionalId: 1, patientId: 1, createdAt: -1 });

const NotificationModel = mongoose.model<NotificationDocument>(
  'Notification',
  schema,
  'notifications',
);

// Data Mapper
class NotificationMapper implements DataMapper<Notification, NotificationDocument> {
  toDomain(record: NotificationDocument): Notification {
    return Notification.restore(record._id, {
      professionalId: record.professionalId,
      patientId: record.patientId,
      channel: record.channel,
      topic: record.topic,
      recipient: record.recipient,
      body: record.body,
      status: record.status,
      attempts: record.attempts,
      providerMessageId: record.providerMessageId,
      error: record.error,
      createdAt: record.createdAt,
    });
  }

  toPersistence(notification: Notification): NotificationDocument {
    return {
      _id: notification.id,
      professionalId: notification.professionalId,
      patientId: notification.patientId,
      channel: notification.channel,
      topic: notification.topic,
      recipient: notification.recipient,
      body: notification.body,
      status: notification.status,
      attempts: notification.attempts,
      providerMessageId: notification.providerMessageId,
      error: notification.error,
      createdAt: notification.createdAt,
    };
  }
}

// Repository, Adapter
export class MongooseNotificationRepository
  extends MongooseRepository<Notification, NotificationDocument>
  implements NotificationRepository
{
  constructor(context: TransactionContext) {
    super(NotificationModel, new NotificationMapper(), context);
  }

  async findByPatient(
    professionalId: string,
    patientId: string,
    page: PageRequest,
  ): Promise<Page<Notification>> {
    return this.findPage(NEWEST_FIRST, { professionalId, patientId }, page);
  }
}
